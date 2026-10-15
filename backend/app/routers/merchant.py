"""Merchant copilot routes: natural-language analytics and alerts."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.services.gemini_service import GeminiServiceError
from app.services.merchant_service import (
    AlertItem,
    AskInsight,
    DemandGap,
    ForecastResult,
    MerchantOverview,
    MerchantService,
    get_merchant_service,
)
from app.utils.sql_safety import SqlSafetyError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/merchant", tags=["merchant"])


class MerchantAskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)


class MerchantAskResponse(BaseModel):
    sql: str
    columns: list[str]
    rows: list[list]
    insight: AskInsight
    chart_type: str
    comparison_sql: str = ""
    comparison_columns: list[str] = Field(default_factory=list)
    comparison_rows: list[list] = Field(default_factory=list)
    delta_pct: float | None = None


class AlertsResponse(BaseModel):
    alerts: list[AlertItem]


class OverviewResponse(MerchantOverview):
    pass


class DemandGapsResponse(BaseModel):
    gaps: list[DemandGap]


class ForecastResponse(ForecastResult):
    pass


def _get_service() -> MerchantService:
    return get_merchant_service()


@router.post("/ask", response_model=MerchantAskResponse)
def ask(
    payload: MerchantAskRequest,
    service: MerchantService = Depends(_get_service),
) -> MerchantAskResponse:
    """Answer a merchant's question with generated, validated analytics."""
    try:
        result = service.ask(payload.question)
    except SqlSafetyError as exc:
        logger.warning("Blocked unsafe SQL for %r: %s", payload.question, exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rejected unsafe query: {exc}",
        ) from exc
    except GeminiServiceError as exc:
        logger.exception("Merchant ask failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Analytics backend error: {exc}",
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        ) from exc

    return MerchantAskResponse(
        sql=result.sql,
        columns=result.columns,
        rows=result.rows,
        insight=result.insight,
        chart_type=result.chart_type,
        comparison_sql=result.comparison_sql,
        comparison_columns=result.comparison_columns,
        comparison_rows=result.comparison_rows,
        delta_pct=result.delta_pct,
    )


@router.get("/overview", response_model=OverviewResponse)
def overview(
    service: MerchantService = Depends(_get_service),
) -> OverviewResponse:
    """Revenue/units KPIs plus at-risk and unmet-demand counts."""
    result = service.overview()
    return OverviewResponse(**result.model_dump())


@router.get("/demand-gaps", response_model=DemandGapsResponse)
def demand_gaps(
    days: int = 14,
    service: MerchantService = Depends(_get_service),
) -> DemandGapsResponse:
    """Clustered unmet shopper demand (Demand Radar)."""
    if days < 1 or days > 90:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="days must be between 1 and 90.",
        )
    return DemandGapsResponse(gaps=service.demand_gaps(days=days))


@router.get("/forecast", response_model=ForecastResponse)
def forecast(
    product_id: int,
    service: MerchantService = Depends(_get_service),
) -> ForecastResponse:
    """Days of cover and a 14-day forecast for one product."""
    try:
        result = service.forecast(product_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    return ForecastResponse(**result.model_dump())


@router.get("/alerts", response_model=AlertsResponse)
def alerts(
    service: MerchantService = Depends(_get_service),
) -> AlertsResponse:
    """Low-stock-but-fast-selling items with AI recommendations."""
    try:
        items: list[AlertItem] = service.alerts()
    except GeminiServiceError as exc:
        logger.exception("Merchant alerts failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Alerts backend error: {exc}",
        ) from exc
    return AlertsResponse(alerts=items)