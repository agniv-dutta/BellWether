"""FastAPI application entrypoint for BellWether.

Run locally with::

    uvicorn app.main:app --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.middleware import RateLimitMiddleware, RequestLoggingMiddleware
from app.routers import chat, merchant, search

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm the in-memory search index at startup (best effort)."""
    try:
        from app.services.search_service import get_search_service

        service = get_search_service()
        logger.info("Search index ready: %s products embedded.", service.indexed_count)
    except Exception:  # noqa: BLE001 - never block startup on a cold cache
        logger.exception("Could not warm the search index at startup.")
    yield


app = FastAPI(
    title="BellWether",
    description="AI retail backend for the Google AI Builder Cup 2026.",
    version="0.1.0",
    lifespan=lifespan,
)

# Middleware order: the LAST one added runs FIRST for each request, so the
# request logger sees everything and CORS stays outermost.
app.add_middleware(RateLimitMiddleware, limit=settings.rate_limit_per_minute)
app.add_middleware(RequestLoggingMiddleware)
# CORS: permissive for the hackathon. Tighten before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Turn any unhandled exception into a clean JSON 500."""
    logger.exception(
        "Unhandled error on %s %s", request.method, request.url.path
    )
    return JSONResponse(
        status_code=500, content={"detail": "Internal server error."}
    )


app.include_router(search.router)
app.include_router(chat.router)
app.include_router(merchant.router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {
        "status": "ok",
        "project": settings.project,
        "location": settings.location,
        "chat_model": settings.gemini_model,
        "embedding_model": settings.embedding_model,
    }
