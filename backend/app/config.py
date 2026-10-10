"""Application configuration loaded from environment variables.

All configuration is provided via environment variables (optionally a ``.env``
file) and parsed with pydantic-settings. Nothing is hardcoded: project IDs,
locations, model names and the database path can all be swapped without code
changes.
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

    # Google Cloud / Vertex AI
    google_cloud_project: str = "your-project-id"
    google_cloud_location: str = "us-central1"

    # Model IDs (keep configurable so they can be swapped easily)
    gemini_model: str = "gemini-2.5-flash"
    embedding_model: str = "gemini-embedding-001"

    # Data layer
    db_path: str = "./bellwether.db"

    # Rate limiting on API endpoints (requests per minute, per client IP)
    rate_limit_per_minute: int = 30

    # Convenience aliases used by the google-genai client.
    @property
    def project(self) -> str:
        return self.google_cloud_project

    @property
    def location(self) -> str:
        return self.google_cloud_location


@lru_cache
def get_settings() -> Settings:
    """Return a cached :class:`Settings` instance."""
    return Settings()


settings = get_settings()
