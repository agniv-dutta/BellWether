"""Application configuration loaded from environment variables.

All configuration is provided via environment variables (optionally a ``.env``
file) and parsed with pydantic-settings. Nothing is hardcoded: the API key,
model names and the database path can all be swapped without code changes.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for BellWether."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Gemini backend: "api" (Google AI Studio key) or "vertex" (GCP project).
    gemini_backend: str = "api"

    # Gemini API (Google AI Studio). Get a key at https://aistudio.google.com/apikey
    gemini_api_key: str = ""

    # Only used when GEMINI_BACKEND=vertex.
    google_cloud_project: str = ""
    google_cloud_location: str = "us-central1"

    # Model IDs (keep configurable so they can be swapped easily)
    gemini_model: str = "gemini-2.5-flash"
    embedding_model: str = "gemini-embedding-001"

    # Data layer
    db_path: str = "./bellwether.db"

    # Rate limiting on API endpoints (requests per minute, per client IP)
    rate_limit_per_minute: int = 30

    # Demand Radar: a search is a "miss" when it returns nothing or the top
    # score falls below this threshold.
    demand_miss_threshold: float = 0.55

    @property
    def api_key_configured(self) -> bool:
        return bool(self.gemini_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    """Return a cached :class:`Settings` instance."""
    return Settings()


settings = get_settings()
