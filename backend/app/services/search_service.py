"""Semantic search over the product catalog.

All product embeddings are loaded into memory on first use (the catalog is
small), normalised, and ranked against the embedded query with cosine
similarity via numpy. Reload after running ``scripts/embed_catalog.py``.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Optional

import numpy as np

from app.models.product import Product, ScoredProduct
from app.repositories import get_product_repository
from app.repositories.base import ProductRepository
from app.services.gemini_service import GeminiService, get_gemini_service

logger = logging.getLogger(__name__)

# Task types keep document/query embeddings aligned for retrieval.
DOC_TASK_TYPE = "RETRIEVAL_DOCUMENT"
QUERY_TASK_TYPE = "RETRIEVAL_QUERY"


def product_document(product: Product) -> str:
    """Build the text used to embed a product."""
    return (
        f"{product.name}. Category: {product.category}. "
        f"Color: {product.color}. {product.description}"
    ).strip()


class SearchService:
    """In-memory vector index over the product catalog."""

    def __init__(
        self,
        product_repo: Optional[ProductRepository] = None,
        gemini: Optional[GeminiService] = None,
    ) -> None:
        self.product_repo = product_repo or get_product_repository()
        self.gemini = gemini or get_gemini_service()
        self._products: list[Product] = []
        self._matrix: np.ndarray = np.zeros((0, 0), dtype=np.float32)
        self._index()

    def _index(self) -> None:
        """Load and normalise all embeddings into memory."""
        products = self.product_repo.all_with_embeddings()
        vectors = [p.embedding for p in products if p.embedding is not None]
        self._products = products

        if not vectors:
            self._matrix = np.zeros((0, 0), dtype=np.float32)
            logger.info("Search index built with 0 embedded products.")
            return

        matrix = np.asarray(vectors, dtype=np.float32)
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self._matrix = matrix / norms
        logger.info("Search index built with %s embedded products.", len(products))

    def reload(self) -> None:
        """Rebuild the in-memory index (e.g. after embedding the catalog)."""
        self._index()

    @property
    def indexed_count(self) -> int:
        return len(self._products)

    def semantic_search(
        self,
        query: str,
        top_k: int = 10,
        category: Optional[str] = None,
        max_price: Optional[float] = None,
        min_price: Optional[float] = None,
    ) -> list[ScoredProduct]:
        """Rank products by cosine similarity to ``query``, then filter."""
        if not self._products or self._matrix.size == 0:
            return []

        [query_vector] = self.gemini.embed_texts([query], task_type=QUERY_TASK_TYPE)
        query_array = np.asarray(query_vector, dtype=np.float32)
        norm = float(np.linalg.norm(query_array))
        if norm > 0:
            query_array = query_array / norm

        scores = self._matrix @ query_array

        ranked: list[tuple[float, Product]] = []
        for product, score in zip(self._products, scores):
            if category and product.category.lower() != category.lower():
                continue
            if max_price is not None and product.price > max_price:
                continue
            if min_price is not None and product.price < min_price:
                continue
            ranked.append((float(score), product))

        ranked.sort(key=lambda item: item[0], reverse=True)
        return [
            ScoredProduct(product=product, score=score)
            for score, product in ranked[:top_k]
        ]


@lru_cache
def get_search_service() -> SearchService:
    """Return the shared :class:`SearchService` (loads the index on first use)."""
    return SearchService()
