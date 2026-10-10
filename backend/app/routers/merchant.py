"""Merchant copilot routes: natural-language analytics and alerts."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.services.gemini_service import GeminiServiceError
from app.services.merchant_service import (
    AlertItem,
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
    insight: str
    chart_type: str


class AlertsResponse(BaseModel):
    alerts: list[AlertItem]


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
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        ) from exc
    except GeminiServiceError as exc:
        logger.exception("Merchant ask failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Analytics backend error: {exc}",
        ) from exc

    return MerchantAskResponse(
        sql=result.sql,
        columns=result.columns,
        rows=result.rows,
        insight=result.insight,
        chart_type=result.chart_type,
    )


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