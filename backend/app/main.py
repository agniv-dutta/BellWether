"""FastAPI application entrypoint for BellWether.

Run locally with::

    uvicorn app.main:app --reload
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.middleware import RateLimitMiddleware, RequestLoggingMiddleware
from app.routers import chat, merchant, products, search

logger = logging.getLogger(__name__)

# Cache for the cheap Gemini latency probe behind /health (60s TTL).
_health_probe: dict[str, float | Optional[float]] = {"at": 0.0, "latency": None}
_HEALTH_PROBE_TTL = 60.0


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
app.include_router(products.router)


def _gemini_latency_ms() -> Optional[float]:
    """Cheap latency probe, cached for 60s. ``None`` when unreachable."""
    now = time.monotonic()
    if now - float(_health_probe["at"]) < _HEALTH_PROBE_TTL:
        latency = _health_probe["latency"]
        return float(latency) if latency is not None else None
    latency: Optional[float] = None
    try:
        from app.services.gemini_service import get_gemini_service

        service = get_gemini_service()
        credentials_present = (
            service.backend == "vertex"
            or settings.api_key_configured
        )
        if credentials_present:
            start = time.monotonic()
            service.generate_text("Reply with exactly: ok", max_retries=0)
            latency = round((time.monotonic() - start) * 1000, 1)
    except Exception:  # noqa: BLE001 - health must never fail
        logger.warning("Health latency probe failed.", exc_info=True)
    _health_probe["at"] = now
    _health_probe["latency"] = latency
    return latency


@app.get("/health", tags=["system"])
async def health() -> dict[str, object]:
    """Liveness probe with backend identity and cached model latency."""
    service_backend = settings.gemini_backend.lower()
    return {
        "status": "ok",
        "backend": service_backend,
        "model": settings.gemini_model,
        "latency_ms": _gemini_latency_ms(),
    }
