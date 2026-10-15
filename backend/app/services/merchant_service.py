"""Merchant copilot: natural language to read-only SQL analytics + alerts."""

from __future__ import annotations

import logging
import sqlite3
import time
from collections import Counter
from datetime import date, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Literal, Optional, get_args

from pydantic import BaseModel, Field

from app.config import settings
from app.models.product import Product
from app.repositories import (
    get_product_repository,
    get_sales_repository,
    get_search_event_repository,
)
from app.repositories.base import ProductRepository, SalesRepository
from app.repositories.sqlite import SqliteSearchEventRepository
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

DEMAND_GAPS_CACHE_TTL = 600
FORECAST_DAYS = 14
FORECAST_HORIZON = 14


class SqlPlan(BaseModel):
    sql: str
    explanation: str = ""
    chart_type: ChartType = "table"
    comparison_sql: str = ""
    headline: str = ""
    why: str = ""
    action: str = ""


class AskInsight(BaseModel):
    headline: str = ""
    why: str = ""
    action: str = ""


class MerchantAskResult(BaseModel):
    sql: str
    columns: list[str]
    rows: list[list]
    insight: AskInsight = Field(default_factory=AskInsight)
    chart_type: str = "table"
    comparison_sql: str = ""
    comparison_columns: list[str] = Field(default_factory=list)
    comparison_rows: list[list] = Field(default_factory=list)
    delta_pct: Optional[float] = None


class DemandGap(BaseModel):
    theme: str
    query_count: int
    example_queries: list[str] = Field(default_factory=list)
    suggested_action: str = ""


class DemandGapsPlan(BaseModel):
    gaps: list[DemandGap] = Field(default_factory=list)


class ForecastPoint(BaseModel):
    date: str
    expected_units: float


class ForecastResult(BaseModel):
    product_id: int
    days_of_cover: Optional[float] = None
    stockout_date: Optional[str] = None
    series: list[ForecastPoint] = Field(default_factory=list)
    recommendation: str = ""


class MerchantOverview(BaseModel):
    revenue_30d: float = 0.0
    revenue_prev_30d: float = 0.0
    revenue_delta_pct: Optional[float] = None
    units_30d: int = 0
    at_risk_count: int = 0
    unmet_demand_week: int = 0


class AlertRecommendation(BaseModel):
    product_id: int
    recommendation: str


class AlertsPlan(BaseModel):
    recommendations: list[AlertRecommendation] = Field(default_factory=list)


class AlertItem(BaseModel):
    product: Product
    stock: int
    velocity: float = Field(..., description="Units sold per day over the window.")
    recommendation: str = ""
    # Extra context that the merchant UI may surface later.
    units_sold_30_days: int = 0
    days_until_out: Optional[float] = None


def _single_number_delta(
    rows: list[list], comparison_rows: list[list]
) -> Optional[float]:
    """Percent change when both current and comparison are a single number."""
    try:
        if len(rows) == 1 and len(rows[0]) == 2 and len(comparison_rows) == 1:
            current = float(rows[0][1])
            previous = float(comparison_rows[0][1])
        elif (
            len(rows) == 1
            and len(rows[0]) == 1
            and len(comparison_rows) == 1
            and len(comparison_rows[0]) == 1
        ):
            current = float(rows[0][0])
            previous = float(comparison_rows[0][0])
        else:
            return None
        if previous == 0:
            return None
        return round((current - previous) / abs(previous) * 100, 1)
    except (TypeError, ValueError, IndexError):
        return None


class MerchantService:
    """Generates, validates, runs and explains SQL against the local DB."""

    def __init__(
        self,
        gemini: Optional[GeminiService] = None,
        product_repo: Optional[ProductRepository] = None,
        sales_repo: Optional[SalesRepository] = None,
        event_repo: Optional[SqliteSearchEventRepository] = None,
        db_path: Optional[str] = None,
    ) -> None:
        self.gemini = gemini or get_gemini_service()
        self.product_repo = product_repo or get_product_repository()
        self.sales_repo = sales_repo or get_sales_repository()
        self.event_repo = event_repo or get_search_event_repository()
        self.db_path = db_path or settings.db_path
        self._gaps_cache: dict[str, tuple[float, list[DemandGap]]] = {}

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

        comparison_sql = ""
        comparison_columns: list[str] = []
        comparison_rows: list[list] = []
        if plan.comparison_sql.strip():
            try:
                comparison_sql = validate_sql(plan.comparison_sql)
                comparison_columns, comparison_rows = self._run_read_only(
                    comparison_sql
                )
            except (SqlSafetyError, RuntimeError) as exc:
                logger.warning("Comparison query rejected: %s", exc)

        insight = self._generate_insight(
            question, safe_sql, plan, columns, rows,
            comparison_columns, comparison_rows,
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
            comparison_sql=comparison_sql,
            comparison_columns=comparison_columns,
            comparison_rows=comparison_rows,
            delta_pct=_single_number_delta(rows, comparison_rows),
        )

    def _build_sql_prompt(self, question: str) -> str:
        today = date.today().isoformat()
        return (
            DB_SCHEMA_PROMPT.format(today=today)
            + f'\nBusiness question: "{question}"\n'
            'Produce JSON with keys: "sql", "explanation", "chart_type", '
            '"comparison_sql", "headline", "why", "action". '
            'chart_type is one of: bar, line, pie, table, number. '
            "Prefer table or number unless the question clearly asks for a trend "
            "(bar/line) or a breakdown (bar/pie). "
            "If the question is about a time window (last month, this week, monsoon "
            "season), also produce comparison_sql: the same query shifted to the "
            "previous equivalent period, otherwise leave it empty. "
            "headline is one punchy sentence answering the question with the actual "
            "numbers formatted in Indian rupees (use lakh/crore for large values, "
            "never USD). why is one sentence explaining the driver, citing the "
            "numbers and the delta when a comparison exists. action is one concrete "
            "next step for the merchant. Never write generic advice such as "
            '"compare to previous months" - do the comparison yourself.'
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
        plan: SqlPlan,
        columns: list[str],
        rows: list[list],
        comparison_columns: list[str],
        comparison_rows: list[list],
    ) -> AskInsight:
        sample = rows[:50]
        comparison = (
            f"\nComparison columns: {comparison_columns}\n"
            f"Comparison rows: {comparison_rows[:10]}"
            if comparison_rows
            else "\nNo comparison query was produced."
        )
        prompt = (
            f"Business question: {question}\n"
            f"SQL executed: {sql}\n"
            f"Query intent: {plan.explanation}\n"
            f"Columns: {columns}\n"
            f"Result rows (max 50 shown): {sample}"
            f"{comparison}\n\n"
            "Draft answer (may be empty): headline={plan.headline!r} "
            f"why={plan.why!r} action={plan.action!r}\n"
            "Return JSON with keys headline, why, action. headline answers the "
            "question in one sentence with the actual numbers in Indian rupees "
            "(lakh/crore for large values, never USD). why explains the driver in "
            "one sentence, citing the delta when a comparison exists. action is "
            "one concrete next step. No generic advice."
        )
        try:
            return self.gemini.generate_json(
                prompt, AskInsight, system_instruction=INSIGHT_SYSTEM, temperature=0.2
            )
        except Exception:  # noqa: BLE001 - fall back to the plan draft
            logger.exception("Structured insight failed; using plan draft.")
            return AskInsight(
                headline=plan.headline or "Here is what the data shows.",
                why=plan.why,
                action=plan.action,
            )

    # ------------------------------------------------------------------ #
    # Alerts: low stock, fast selling
    # ------------------------------------------------------------------ #
    def _candidates(self, window_days: int = ALERT_WINDOW_DAYS) -> list[AlertItem]:
        """Low-stock, fast-selling products without AI recommendations."""
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
                    product=product,
                    stock=product.stock,
                    velocity=round(units_per_day, 2),
                    units_sold_30_days=units,
                    days_until_out=days_until_out,
                )
            )

        candidates.sort(key=lambda item: item.days_until_out if item.days_until_out is not None else float("inf"))
        return candidates

    def alerts(self, window_days: int = ALERT_WINDOW_DAYS) -> list[AlertItem]:
        """Flag low-stock products that are selling quickly."""
        top = self._candidates(window_days)[:10]

        if not top:
            return []

        recommendations = self._recommend(top, window_days)
        by_id = {rec.product_id: rec.recommendation for rec in recommendations}
        for item in top:
            item.recommendation = by_id.get(item.product.id or 0, "")
        return top

    # ------------------------------------------------------------------ #
    # Overview KPIs
    # ------------------------------------------------------------------ #
    def overview(self) -> MerchantOverview:
        """Revenue/units for the last 30 vs previous 30 days, fast and key-free."""
        today = date.today()
        current = self.sales_repo.list(since=today - timedelta(days=30))
        previous = self.sales_repo.list(
            since=today - timedelta(days=60), until=today - timedelta(days=31)
        )
        revenue = round(sum(r.revenue for r in current), 2)
        revenue_prev = round(sum(r.revenue for r in previous), 2)
        delta = (
            round((revenue - revenue_prev) / abs(revenue_prev) * 100, 1)
            if revenue_prev
            else None
        )
        return MerchantOverview(
            revenue_30d=revenue,
            revenue_prev_30d=revenue_prev,
            revenue_delta_pct=delta,
            units_30d=sum(r.quantity for r in current),
            at_risk_count=len(self._candidates()),
            unmet_demand_week=self.event_repo.unmet_count_since(
                7, settings.demand_miss_threshold
            ),
        )

    # ------------------------------------------------------------------ #
    # Demand Radar
    # ------------------------------------------------------------------ #
    def demand_gaps(self, days: int = 14) -> list[DemandGap]:
        """Cluster recent search misses into restocking themes (10-min cache)."""
        cache_key = f"gaps:{days}"
        cached = self._gaps_cache.get(cache_key)
        if cached and time.monotonic() - cached[0] < DEMAND_GAPS_CACHE_TTL:
            return cached[1]

        misses = self.event_repo.misses_since(
            days, settings.demand_miss_threshold, limit=200
        )
        if not misses:
            return []

        queries = [m.query for m in misses if m.query.strip()]
        try:
            plan = self.gemini.generate_json(
                "These are failed shopper search queries from the last "
                f"{days} days (each on its own line):\n" + "\n".join(queries[:200])
                + "\n\nCluster them into demand themes. Return JSON with gaps: "
                "a list of {theme, query_count, example_queries (up to 3 real "
                "queries from the list), suggested_action (one concrete restocking "
                "or sourcing step)}. Sort by query_count descending, max 6 gaps.",
                DemandGapsPlan,
                temperature=0.2,
            )
            gaps = sorted(plan.gaps, key=lambda g: g.query_count, reverse=True)[:6]
        except Exception:  # noqa: BLE001 - offline grouping fallback
            logger.exception("Gemini demand clustering failed; grouping locally.")
            gaps = self._group_misses_locally(queries)[:6]

        self._gaps_cache[cache_key] = (time.monotonic(), gaps)
        return gaps

    @staticmethod
    def _group_misses_locally(queries: list[str]) -> list[DemandGap]:
        """Group identical normalised queries when Gemini is unreachable."""
        counts: Counter = Counter(q.strip().lower() for q in queries if q.strip())
        gaps = []
        for query, count in counts.most_common(6):
            example = next(q for q in queries if q.strip().lower() == query)
            gaps.append(
                DemandGap(
                    theme=query,
                    query_count=count,
                    example_queries=[example],
                    suggested_action=(
                        f"{count} shoppers asked for this - source it or add a "
                        "close substitute to the catalog."
                    ),
                )
            )
        return gaps

    # ------------------------------------------------------------------ #
    # Forecast
    # ------------------------------------------------------------------ #
    def forecast(self, product_id: int) -> ForecastResult:
        """Days of cover plus a 14-day explainable forecast."""
        product = self.product_repo.get(product_id)
        if product is None:
            raise ValueError(f"No product found with id {product_id}.")

        today = date.today()
        recent = self.sales_repo.list(
            product_id=product_id, since=today - timedelta(days=FORECAST_DAYS)
        )
        daily: Counter = Counter()
        for record in recent:
            daily[record.sale_date.isoformat()] += record.quantity

        velocity = (
            sum(daily.values()) / FORECAST_DAYS if daily else 0.0
        )
        weekday_avg: dict[int, float] = {}
        for i in range(7):
            values = [
                qty
                for iso, qty in daily.items()
                if date.fromisoformat(iso).weekday() == i
            ]
            weekday_avg[i] = sum(values) / len(values) if values else velocity

        series: list[ForecastPoint] = []
        cumulative = 0.0
        stockout_date: Optional[str] = None
        for offset in range(1, FORECAST_HORIZON + 1):
            day = today + timedelta(days=offset)
            expected = round(weekday_avg.get(day.weekday(), velocity), 2)
            cumulative += expected
            series.append(ForecastPoint(date=day.isoformat(), expected_units=expected))
            if stockout_date is None and cumulative >= product.stock > 0:
                stockout_date = day.isoformat()

        days_of_cover = round(product.stock / velocity, 1) if velocity > 0 else None

        if product.stock <= 0:
            recommendation = (
                f"{product.name} is already out of stock - reorder now to "
                "capture the demand."
            )
        elif velocity <= 0:
            recommendation = (
                f"{product.name} has no sales in the last {FORECAST_DAYS} days - "
                "no restock needed."
            )
        else:
            try:
                recommendation = self.gemini.generate_text(
                    f"Product: {product.name}, stock {product.stock}, selling "
                    f"{velocity:.1f} units/day, days of cover {days_of_cover}, "
                    f"projected stockout {stockout_date}. In ONE sentence, tell "
                    "the merchant what to do, with a reorder quantity.",
                    temperature=0.2,
                ).strip()
            except Exception:  # noqa: BLE001 - template fallback
                logger.exception("Forecast explanation failed.")
                reorder = max(int(velocity * 30 - product.stock), 0)
                recommendation = (
                    f"At {velocity:.1f} units a day, stock runs out around "
                    f"{stockout_date} - reorder about {reorder} units."
                )

        return ForecastResult(
            product_id=product_id,
            days_of_cover=days_of_cover,
            stockout_date=stockout_date,
            series=series,
            recommendation=recommendation,
        )

    def _recommend(self, items: list[AlertItem], window_days: int) -> list[AlertRecommendation]:
        payload = [
            {
                "product_id": it.product.id,
                "name": it.product.name,
                "category": it.product.category,
                "stock": it.stock,
                "velocity": it.velocity,
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