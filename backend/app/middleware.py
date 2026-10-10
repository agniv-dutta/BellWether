"""ASGI middleware: request logging, rate limiting, error responses.

Kept simple and dependency-free for the hackathon.
"""

from __future__ import annotations

import logging
import threading
import time
from collections import deque

from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

_API_PREFIX = "/api/"


class RequestLoggingMiddleware:
    """Log one line per HTTP request with method, path, status and duration."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        start = time.perf_counter()
        status_holder: dict[str, int] = {}

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_holder["status"] = message["status"]
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception:
            status_holder.setdefault("status", 500)
            raise
        finally:
            duration_ms = (time.perf_counter() - start) * 1000
            logger.info(
                "%s %s -> %s (%.1f ms)",
                scope.get("method", "?"),
                scope.get("path", "?"),
                status_holder.get("status", "?"),
                duration_ms,
            )


class _RateLimiter:
    """Fixed-window in-memory rate limiter keyed by client IP."""

    def __init__(self, limit: int, window_seconds: float = 60.0) -> None:
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque] = {}
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            queue = self._hits.setdefault(key, deque())
            while queue and queue[0] <= now - self.window:
                queue.popleft()
            if len(queue) >= self.limit:
                return False
            queue.append(now)
            return True


class RateLimitMiddleware:
    """Rate-limit ``/api/*`` requests per client IP."""

    def __init__(self, app, limit: int, window_seconds: float = 60.0) -> None:
        self.app = app
        self.limiter = _RateLimiter(limit=limit, window_seconds=window_seconds)

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        path = scope.get("path", "")
        if not path.startswith(_API_PREFIX):
            return await self.app(scope, receive, send)

        client = scope.get("client")
        ip = client[0] if client else "unknown"
        if not self.limiter.allow(ip):
            response = JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."},
            )
            return await response(scope, receive, send)

        await self.app(scope, receive, send)