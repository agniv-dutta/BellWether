"""Gemini service wrapper built on the google-genai SDK.

Centralises all interaction with Gemini so routes/services never touch the SDK
directly. The client backend is driven by settings::

    api    -> genai.Client(api_key=settings.gemini_api_key)
    vertex -> genai.Client(vertexai=True, project=..., location=...)

Identical prompts and embedding batches are cached in memory (5-minute TTL) so
free-tier rate limits don't break a demo.
"""

from __future__ import annotations

import logging
import time
from functools import lru_cache
from typing import Any, Optional, Type, TypeVar

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

_DEFAULT_TIMEOUT_MS = 60_000
_CACHE_TTL_SECONDS = 300


class GeminiServiceError(RuntimeError):
    """Raised when a Gemini call fails after retries."""


class _TtlCache:
    """Tiny in-memory TTL cache for identical prompts/embeddings."""

    def __init__(self, ttl_seconds: int = _CACHE_TTL_SECONDS) -> None:
        self._ttl = ttl_seconds
        self._store: dict[Any, tuple[float, Any]] = {}

    def get(self, key: Any) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: Any, value: Any) -> None:
        self._store[key] = (time.monotonic() + self._ttl, value)


class GeminiService:
    """Thin, typed wrapper around the google-genai client."""

    def __init__(
        self,
        model: Optional[str] = None,
        embedding_model: Optional[str] = None,
        api_key: Optional[str] = None,
        backend: Optional[str] = None,
        project: Optional[str] = None,
        location: Optional[str] = None,
        timeout_ms: int = _DEFAULT_TIMEOUT_MS,
    ) -> None:
        self.model = model or settings.gemini_model
        self.embedding_model = embedding_model or settings.embedding_model
        self._api_key = api_key if api_key is not None else settings.gemini_api_key
        self._backend = (backend or settings.gemini_backend).lower()
        self._project = project or settings.google_cloud_project
        self._location = location or settings.google_cloud_location
        self._timeout_ms = timeout_ms
        self._client: Optional[genai.Client] = None
        self._cache = _TtlCache()

    @property
    def backend(self) -> str:
        return self._backend

    @property
    def client(self) -> genai.Client:
        """Expose the underlying client for advanced tool-calling flows.

        The client is created lazily so the app can boot (and tests can run)
        without credentials; missing credentials surface as a
        ``GeminiServiceError`` on first use instead of a crash at import time.
        """
        if self._client is None:
            options = types.HttpOptions(timeout=self._timeout_ms)
            if self._backend == "vertex":
                if not self._project.strip():
                    raise GeminiServiceError(
                        "GEMINI_BACKEND=vertex but GOOGLE_CLOUD_PROJECT is not set."
                    )
                self._client = genai.Client(
                    vertexai=True,
                    project=self._project,
                    location=self._location,
                    http_options=options,
                )
            else:
                api_key = self._api_key.strip()
                if not api_key:
                    raise GeminiServiceError(
                        "GEMINI_API_KEY is not set. Add it to backend/.env to enable "
                        "AI features (get one at https://aistudio.google.com/apikey)."
                    )
                self._client = genai.Client(api_key=api_key, http_options=options)
        return self._client

    # ------------------------------------------------------------------ #
    # Text generation
    # ------------------------------------------------------------------ #
    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_retries: int = 2,
    ) -> str:
        """Generate free-form text. Returns the model's text response.

        Identical calls are served from a 5-minute cache; failures (including
        429/503 rate limits) retry with exponential backoff.
        """
        cache_key = ("text", self.model, prompt, system_instruction, temperature)
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
        )
        last_error: Optional[Exception] = None
        for attempt in range(max_retries + 1):
            try:
                response = self.client.models.generate_content(
                    model=self.model, contents=prompt, config=config
                )
                text = getattr(response, "text", None)
                if text:
                    self._cache.set(cache_key, text)
                    return text
                last_error = GeminiServiceError("Empty text response from Gemini.")
            except Exception as exc:  # noqa: BLE001 - surfaced as GeminiServiceError
                last_error = exc
                logger.warning("generate_text attempt %s failed: %s", attempt + 1, exc)
            time.sleep(min(2**attempt, 5))
        raise GeminiServiceError(f"generate_text failed: {last_error}")

    # ------------------------------------------------------------------ #
    # Structured (JSON) generation
    # ------------------------------------------------------------------ #
    def generate_json(
        self,
        prompt: str,
        schema: Type[T],
        image_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
        max_retries: int = 3,
    ) -> T:
        """Generate a JSON response parsed into ``schema``.

        Optionally accepts an inline image (used by visual search). Retries on
        parse/validation failure before giving up.
        """
        cacheable = image_bytes is None
        cache_key = ("json", self.model, schema.__name__, prompt, system_instruction, temperature)
        if cacheable:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached

        parts: list[types.Part] = []
        if image_bytes is not None:
            parts.append(
                types.Part.from_bytes(
                    data=image_bytes, mime_type=mime_type or "image/jpeg"
                )
            )
        parts.append(types.Part.from_text(text=prompt))

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            system_instruction=system_instruction,
            temperature=temperature,
        )

        last_error: Optional[Exception] = None
        for attempt in range(max_retries + 1):
            try:
                response = self.client.models.generate_content(
                    model=self.model, contents=parts, config=config
                )
                parsed = getattr(response, "parsed", None)
                if isinstance(parsed, schema):
                    if cacheable:
                        self._cache.set(cache_key, parsed)
                    return parsed
                text = getattr(response, "text", None) or ""
                validated = schema.model_validate_json(text)
                if cacheable:
                    self._cache.set(cache_key, validated)
                return validated
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.warning(
                    "generate_json attempt %s failed for %s: %s",
                    attempt + 1,
                    schema.__name__,
                    exc,
                )
            time.sleep(min(2**attempt, 5))
        raise GeminiServiceError(
            f"generate_json failed for {schema.__name__}: {last_error}"
        )

    # ------------------------------------------------------------------ #
    # Embeddings
    # ------------------------------------------------------------------ #
    def embed_texts(
        self,
        texts: list[str],
        task_type: Optional[str] = None,
        batch_size: int = 50,
        max_retries: int = 2,
    ) -> list[list[float]]:
        """Embed a list of strings, returning one vector per input.

        ``task_type`` (e.g. ``RETRIEVAL_DOCUMENT`` / ``RETRIEVAL_QUERY``) is
        passed through to the embedding model when provided.
        """
        if not texts:
            return []

        config = types.EmbedContentConfig(task_type=task_type) if task_type else None
        vectors: list[list[float]] = []
        for start in range(0, len(texts), batch_size):
            batch = texts[start : start + batch_size]
            batch_key = ("embed", self.embedding_model, task_type, tuple(batch))
            cached = self._cache.get(batch_key)
            if cached is not None:
                vectors.extend(cached)
                continue
            last_error: Optional[Exception] = None
            for attempt in range(max_retries + 1):
                try:
                    response = self.client.models.embed_content(
                        model=self.embedding_model, contents=batch, config=config
                    )
                    batch_vectors = [list(e.values) for e in response.embeddings]
                    self._cache.set(batch_key, batch_vectors)
                    vectors.extend(batch_vectors)
                    break
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    logger.warning(
                        "embed_texts batch %s attempt %s failed: %s",
                        start,
                        attempt + 1,
                        exc,
                    )
                    time.sleep(min(2**attempt, 5))
            else:
                raise GeminiServiceError(f"embed_texts failed: {last_error}")
        return vectors


@lru_cache
def get_gemini_service() -> GeminiService:
    """Return the shared :class:`GeminiService` instance."""
    return GeminiService()
