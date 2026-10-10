"""Merchant copilot: natural language to read-only SQL analytics + alerts."""

from __future__ import annotations

import logging
import sqlite3
from collections import Counter
from datetime import date, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Literal, Optional, get_args

from pydantic import BaseModel, Field

from app.config import settings
from app.models.product import Product
from app.repositories import get_product_repository, get_sales_repository
from app.repositories.base import ProductRepository, SalesRepository
from app.services.gemini_service import GeminiService, get_gemini_service
from app.utils.sql_safety import SqlSafetyError, validate_sql

logger = logging.getLogger(__name__)

ChartType = Literal["bar", "line", "pie", "table", "number"]

DB_SCHEMA_PROMPT = """
The store uses a SQLite database with these tables:

products(id INTEGER, name TEXT, category TEXT, description TEXT,
         price REAL, color TEXT, image_url TEXT, stock INTEGER, embedding TEXT)

sales(id INTEGER, product_id INTEGER, quantity INTEGER,
      sale_date TEXT (ISO 'YYYY-MM-DD'), revenue REAL)

Today is {today}. "sale_date" is already a date; use date('now') for today.
Use only these two tables. The query will run on a read-only connection, so it
must be a single SELECT (no writes, no PRAGMA, no recursion), and it will be
limited to 100 rows automatically - keep results small.
"""

SQL_SYSTEM = (
    "You are a retail analytics assistant. Turn business questions into a single "
    "read-only SQLite SELECT query. Respond only with valid JSON."
)

INSIGHT_SYSTEM = (
    "You are a retail analytics expert. Explain query results to a store owner in "
    "plain English, 2-3 sentences, focusing on actionable takeaways."
)

ALERT_SYSTEM = (
    "You are a retail ops assistant. For each flagged product write ONE concise, "
    "actionable recommendation (one line, max 25 words). Be specific about the "
    "quantity to reorder based on units sold per day."
)

ALERT_WINDOW_DAYS = 30
ALERT_MIN_UNITS_SOLD = 5
ALERT_MAX_STOCK = 8


class SqlPlan(BaseModel):
    sql: str
    explanation: str = ""
    chart_type: ChartType = "table"


class MerchantAskResult(BaseModel):
    sql: str
    columns: list[str]
    rows: list[list]
    insight: str
    chart_type: str


class AlertRecommendation(BaseModel):
    product_id: int
    recommendation: str


class AlertsPlan(BaseModel):
    recommendations: list[AlertRecommendation] = Field(default_factory=list)


class AlertItem(BaseModel):
    product_id: int
    name: str
    category: str
    stock: int
    units_sold_30_days: int
    days_until_out: Optional[float]
    recommendation: str = ""


class MerchantService:
    """Generates, validates, runs and explains SQL against the local DB."""

    def __init__(
        self,
        gemini: Optional[GeminiService] = None,
        product_repo: Optional[ProductRepository] = None,
        sales_repo: Optional[SalesRepository] = None,
        db_path: Optional[str] = None,
    ) -> None:
        self.gemini = gemini or get_gemini_service()
        self.product_repo = product_repo or get_product_repository()
        self.sales_repo = sales_repo or get_sales_repository()
        self.db_path = db_path or settings.db_path

    # ------------------------------------------------------------------ #
    # Natural language -> analytics
    # ------------------------------------------------------------------ #
    def ask(self, question: str) -> MerchantAskResult:
        plan: SqlPlan = self.gemini.generate_json(
            self._build_sql_prompt(question),
            SqlPlan,
            system_instruction=SQL_SYSTEM,
            temperature=0.1,
        )

        try:
            safe_sql = validate_sql(plan.sql)
        except SqlSafetyError as exc:
            logger.warning("Blocked unsafe SQL for question %r: %s", question, exc)
            raise

        columns, rows = self._run_read_only(safe_sql)
        insight = self._generate_insight(
            question, safe_sql, plan.explanation, columns, rows
        )

        chart_type = (
            plan.chart_type
            if plan.chart_type in get_args(ChartType)
            else "table"
        )
        return MerchantAskResult(
            sql=safe_sql,
            columns=columns,
            rows=rows,
            insight=insight,
            chart_type=chart_type,
        )

    def _build_sql_prompt(self, question: str) -> str:
        today = date.today().isoformat()
        return (
            DB_SCHEMA_PROMPT.format(today=today)
            + f'\nBusiness question: "{question}"\n'
            'Produce JSON with keys: "sql", "explanation", "chart_type". '
            'chart_type is one of: bar, line, pie, table, number. '
            "Prefer table or number unless the question clearly asks for a trend "
            "(bar/line) or a breakdown (bar/pie)."
        )

    def _run_read_only(self, sql: str) -> tuple[list[str], list[list]]:
        uri = f"file:{Path(self.db_path).as_posix()}?mode=ro"
        try:
            conn = sqlite3.connect(uri, uri=True, timeout=30)
            try:
                cursor = conn.execute(sql)
                columns = [description[0] for description in cursor.description or []]
                rows = [list(row) for row in cursor.fetchall()]
            finally:
                conn.close()
        except sqlite3.Error as exc:
            logger.exception("Read-only query failed: %s", sql)
            raise RuntimeError(f"SQL execution failed: {exc}") from exc
        return columns, rows

    def _generate_insight(
        self,
        question: str,
        sql: str,
        explanation: str,
        columns: list[str],
        rows: list[list],
    ) -> str:
        sample = rows[:50]
        prompt = (
            f"Business question: {question}\n"
            f"SQL executed: {sql}\n"
            f"Query intent: {explanation}\n"
            f"Columns: {columns}\n"
            f"Result rows (max 50 shown): {sample}\n\n"
            "Write a 2-3 sentence plain-English insight answering the question and "
            "highlighting anything actionable."
        )
        return self.gemini.generate_text(
            prompt, system_instruction=INSIGHT_SYSTEM, temperature=0.2
        ).strip()

    # ------------------------------------------------------------------ #
    # Alerts: low stock, fast selling
    # ------------------------------------------------------------------ #
    def alerts(self, window_days: int = ALERT_WINDOW_DAYS) -> list[AlertItem]:
        """Flag low-stock products that are selling quickly."""
        since = date.today() - timedelta(days=window_days)
        sales = self.sales_repo.list(since=since)

        quantity_by_product: Counter = Counter()
        for record in sales:
            quantity_by_product[record.product_id] += record.quantity

        candidates: list[AlertItem] = []
        for product in self.product_repo.list():
            if product.id is None:
                continue
            units = quantity_by_product.get(product.id, 0)
            if product.stock > ALERT_MAX_STOCK or units < ALERT_MIN_UNITS_SOLD:
                continue
            units_per_day = units / window_days
            days_until_out = (
                round(product.stock / units_per_day, 1) if units_per_day > 0 else 0.0
            )
            candidates.append(
                AlertItem(
                    product_id=product.id,
                    name=product.name,
                    category=product.category,
                    stock=product.stock,
                    units_sold_30_days=units,
                    days_until_out=days_until_out,
                )
            )

        candidates.sort(key=lambda item: item.days_until_out if item.days_until_out is not None else float("inf"))
        top = candidates[:10]

        if not top:
            return []

        recommendations = self._recommend(top, window_days)
        by_id = {rec.product_id: rec.recommendation for rec in recommendations}
        for item in top:
            item.recommendation = by_id.get(item.product_id, "")
        return top

    def _recommend(self, items: list[AlertItem], window_days: int) -> list[AlertRecommendation]:
        payload = [
            {
                "product_id": it.product_id,
                "name": it.name,
                "category": it.category,
                "stock": it.stock,
                "units_sold_30_days": it.units_sold_30_days,
                "days_until_out": it.days_until_out,
            }
            for it in items
        ]
        prompt = (
            f"Here are products selling fast relative to their remaining stock "
            f"(last {window_days} days):\n{payload}\n"
            "For each product_id recommend one concrete action, including a reorder "
            "quantity estimate based on units sold per day."
        )
        try:
            plan: AlertsPlan = self.gemini.generate_json(
                prompt, AlertsPlan, system_instruction=ALERT_SYSTEM, temperature=0.3
            )
        except Exception:  # noqa: BLE001 - recommendations are best-effort
            logger.exception("Failed to get alert recommendations.")
            return []
        return plan.recommendations


@lru_cache
def get_merchant_service() -> MerchantService:
    return MerchantService()