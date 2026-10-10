"""Vertex AI service wrapper built on the google-genai SDK.

Centralises all interaction with Gemini so routes/services never touch the SDK
directly. Uses Application Default Credentials (ADC) - no API keys.

The client is constructed in Vertex AI mode::

    genai.Client(vertexai=True, project=..., location=...)
"""

from __future__ import annotations

import logging
import time
from functools import lru_cache
from typing import Optional, Type, TypeVar

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

_DEFAULT_TIMEOUT_MS = 60_000


class GeminiServiceError(RuntimeError):
    """Raised when a Gemini call fails after retries."""


class GeminiService:
    """Thin, typed wrapper around the google-genai client (Vertex AI mode)."""

    def __init__(
        self,
        model: Optional[str] = None,
        embedding_model: Optional[str] = None,
        project: Optional[str] = None,
        location: Optional[str] = None,
        timeout_ms: int = _DEFAULT_TIMEOUT_MS,
    ) -> None:
        self.model = model or settings.gemini_model
        self.embedding_model = embedding_model or settings.embedding_model
        self._client = genai.Client(
            vertexai=True,
            project=project or settings.project,
            location=location or settings.location,
            http_options=types.HttpOptions(timeout=timeout_ms),
        )

    @property
    def client(self) -> genai.Client:
        """Expose the underlying client for advanced tool-calling flows."""
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
        """Generate free-form text. Returns the model's text response."""
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
        )
        last_error: Optional[Exception] = None
        for attempt in range(max_retries + 1):
            try:
                response = self._client.models.generate_content(
                    model=self.model, contents=prompt, config=config
                )
                text = getattr(response, "text", None)
                if text:
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
                response = self._client.models.generate_content(
                    model=self.model, contents=parts, config=config
                )
                parsed = getattr(response, "parsed", None)
                if isinstance(parsed, schema):
                    return parsed
                text = getattr(response, "text", None) or ""
                return schema.model_validate_json(text)
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
            last_error: Optional[Exception] = None
            for attempt in range(max_retries + 1):
                try:
                    response = self._client.models.embed_content(
                        model=self.embedding_model, contents=batch, config=config
                    )
                    vectors.extend(list(e.values) for e in response.embeddings)
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
