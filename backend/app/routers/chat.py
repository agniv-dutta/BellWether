"""Conversational shopping assistant route."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.services.chat_service import (
    ChatService,
    ProductSummary,
    get_chat_service,
)
from app.services.gemini_service import GeminiServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    reply: str
    products_mentioned: list[ProductSummary] = Field(default_factory=list)


def _get_service() -> ChatService:
    return get_chat_service()


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    service: ChatService = Depends(_get_service),
) -> ChatResponse:
    """Continue a shopping conversation, executing tools as needed."""
    try:
        result = service.chat(payload.session_id, payload.message)
    except GeminiServiceError as exc:
        logger.exception("Chat failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Assistant backend error: {exc}",
        ) from exc
    return ChatResponse(
        reply=result.reply, products_mentioned=result.products_mentioned
    )
