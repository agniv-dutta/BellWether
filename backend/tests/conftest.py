"""Shared test fixtures.

Environment is configured *before* ``app`` is imported anywhere so the
settings singleton points at a throwaway database instead of the dev one.
"""

from __future__ import annotations

import os
import tempfile

os.environ.setdefault(
    "DB_PATH", os.path.join(tempfile.gettempdir(), "bellwether_test.db")
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    """TestClient sharing the FastAPI app, lifespan included."""
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()