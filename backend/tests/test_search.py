"""Tests for /api/search with a mocked semantic search service."""

from __future__ import annotations

from app.models.product import Product, ScoredProduct
from app.routers.search import _get_service
from app.services.gemini_service import GeminiServiceError


class FakeSearchService:
    """Returns a fixed result set, never touching Gemini."""

    def semantic_search(
        self, query, top_k=10, category=None, max_price=None, min_price=None,
        persona_id=None,
    ):
        return [
            ScoredProduct(
                product=Product(
                    id=1,
                    name="Camel Wool Coat",
                    category="Outerwear",
                    description="Warm wool coat",
                    price=149.0,
                    color="Camel",
                    stock=4,
                ),
                score=0.91,
            )
        ]


class FailingSearchService:
    def semantic_search(self, query, **kwargs):
        raise GeminiServiceError("backend exploded")


def test_search_returns_scored_products(client):
    app = client.app
    app.dependency_overrides[_get_service] = lambda: FakeSearchService()

    response = client.get("/api/search", params={"q": "warm wool coat"})
    assert response.status_code == 200

    body = response.json()
    assert body["query"] == "warm wool coat"
    assert body["count"] == 1
    result = body["results"][0]
    assert result["name"] == "Camel Wool Coat"
    assert result["score"] == 0.91
    assert result["price"] == 149.0


def test_search_applies_filters(client):
    app = client.app
    seen = {}

    class RecordingService(FakeSearchService):
        def semantic_search(
            self, query, top_k=10, category=None, max_price=None, min_price=None,
            persona_id=None,
        ):
            seen.update(
                top_k=top_k, category=category, max_price=max_price,
                min_price=min_price, persona_id=persona_id,
            )
            return super().semantic_search(query, top_k=top_k)

    app.dependency_overrides[_get_service] = lambda: RecordingService()
    client.get(
        "/api/search",
        params={"q": "coat", "category": "Outerwear", "max_price": 200, "limit": 5},
    )
    assert seen["category"] == "Outerwear"
    assert seen["max_price"] == 200
    assert seen["top_k"] == 5


def test_search_missing_query_returns_422(client):
    response = client.get("/api/search")
    assert response.status_code == 422


def test_search_backend_error_returns_502(client):
    app = client.app
    app.dependency_overrides[_get_service] = lambda: FailingSearchService()

    response = client.get("/api/search", params={"q": "boom"})
    assert response.status_code == 502
    assert "detail" in response.json()