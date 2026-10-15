"""Semantic search over the product catalog.

All product embeddings are loaded into memory on first use (the catalog is
small), normalised, and ranked against the embedded query with cosine
similarity via numpy. Reload after running ``scripts/embed_catalog.py``.
"""

from __future__ import annotations

import logging
import re
from functools import lru_cache
from typing import Optional

import numpy as np

from app.models.product import Product, ScoredProduct
from app.repositories import get_persona_repository, get_product_repository
from app.repositories.base import ProductRepository
from app.repositories.sqlite import SqlitePersonaRepository
from app.services.gemini_service import GeminiService, get_gemini_service

logger = logging.getLogger(__name__)

# Task types keep document/query embeddings aligned for retrieval.
DOC_TASK_TYPE = "RETRIEVAL_DOCUMENT"
QUERY_TASK_TYPE = "RETRIEVAL_QUERY"

# Persona re-rank weights.
AFFINITY_WEIGHT = 0.15
PRICE_BAND_BONUS = 0.05


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
        persona_repo: Optional[SqlitePersonaRepository] = None,
    ) -> None:
        self.product_repo = product_repo or get_product_repository()
        self.gemini = gemini or get_gemini_service()
        self.persona_repo = persona_repo or get_persona_repository()
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
        persona_id: Optional[str] = None,
    ) -> list[ScoredProduct]:
        """Rank products by cosine similarity to ``query``, then filter.

        Falls back to a lexical keyword search when no embeddings are available
        or when the embedding backend fails, so the app stays usable before the
        catalog has been embedded. Applies persona re-ranking when
        ``persona_id`` is given, and swaps out-of-stock hits for the nearest
        in-stock substitute.
        """
        if self._products and self._matrix.size:
            try:
                ranked = self._vector_rank(query, category, max_price, min_price)
            except Exception:  # noqa: BLE001 - degrade gracefully
                logger.exception("Semantic search failed; using lexical fallback.")
                ranked = self._lexical_rank(query, category, max_price, min_price)
        else:
            ranked = self._lexical_rank(query, category, max_price, min_price)
        ranked = self._apply_persona(ranked, persona_id)
        return self._with_substitutes(ranked, top_k)

    def _vector_rank(
        self,
        query: str,
        category: Optional[str],
        max_price: Optional[float],
        min_price: Optional[float],
    ) -> list[tuple[float, Product]]:
        [query_vector] = self.gemini.embed_texts([query], task_type=QUERY_TASK_TYPE)
        query_array = np.asarray(query_vector, dtype=np.float32)
        norm = float(np.linalg.norm(query_array))
        if norm > 0:
            query_array = query_array / norm

        scores = self._matrix @ query_array

        ranked: list[tuple[float, Product]] = []
        for product, score in zip(self._products, scores):
            if not self._passes_filters(product, category, max_price, min_price):
                continue
            ranked.append((float(score), product))

        ranked.sort(key=lambda item: item[0], reverse=True)
        return ranked

    @staticmethod
    def _passes_filters(
        product: Product,
        category: Optional[str],
        max_price: Optional[float],
        min_price: Optional[float],
    ) -> bool:
        if category and product.category.lower() != category.lower():
            return False
        if max_price is not None and product.price > max_price:
            return False
        if min_price is not None and product.price < min_price:
            return False
        return True

    def _lexical_rank(
        self,
        query: str,
        category: Optional[str],
        max_price: Optional[float],
        min_price: Optional[float],
    ) -> list[tuple[float, Product]]:
        """Keyword-overlap fallback over the full catalog (no embeddings)."""
        tokens = [tok for tok in re.findall(r"[a-z0-9]+", query.lower()) if len(tok) > 2]

        scored: list[tuple[float, Product]] = []
        for product in self.product_repo.list():
            if not self._passes_filters(product, category, max_price, min_price):
                continue
            if tokens:
                name = product.name.lower()
                haystack = (
                    f"{product.name} {product.category} {product.color} "
                    f"{product.description}"
                ).lower()
                score = float(
                    sum((3 if tok in name else 0) + (1 if tok in haystack else 0)
                        for tok in tokens)
                )
                if score <= 0:
                    continue
            else:
                score = 0.0
            scored.append((score, product))

        if not scored:
            return []

        best = max(score for score, _ in scored) or 1.0
        scored.sort(key=lambda item: (-item[0], item[1].stock))
        return [
            (round(min(score / best, 1.0), 4), product) for score, product in scored
        ]

    def _apply_persona(
        self,
        ranked: list[tuple[float, Product]],
        persona_id: Optional[str],
    ) -> list[tuple[float, Product, bool]]:
        """Re-rank by persona affinity. Returns (score, product, boosted)."""
        if not persona_id:
            return [(score, product, False) for score, product in ranked]
        try:
            persona = self.persona_repo.get(persona_id)
        except Exception:  # noqa: BLE001 - personalisation is best-effort
            logger.exception("Persona lookup failed.")
            return [(score, product, False) for score, product in ranked]
        if persona is None:
            return [(score, product, False) for score, product in ranked]

        reranked: list[tuple[float, Product, bool]] = []
        for score, product in ranked:
            bonus = AFFINITY_WEIGHT * float(
                persona.category_affinity.get(product.category, 0.0)
            )
            if persona.price_min <= product.price <= persona.price_max:
                bonus += PRICE_BAND_BONUS
            boosted = bonus > 0
            reranked.append((round(score + bonus, 4), product, boosted))
        reranked.sort(key=lambda item: item[0], reverse=True)
        return reranked

    def _with_substitutes(
        self,
        ranked: list[tuple[float, Product, bool]],
        top_k: int,
    ) -> list[ScoredProduct]:
        """Swap out-of-stock hits for the nearest in-stock substitute.

        The substitute keeps the original rank/score and carries a note, so the
        shopper always sees something buyable and knows why.
        """
        in_stock = [item for item in ranked if item[1].stock > 0]
        results: list[ScoredProduct] = []
        used_ids: set[int | None] = set()
        for score, product, boosted in ranked:
            if len(results) >= top_k:
                break
            if product.stock > 0:
                if product.id in used_ids:
                    continue
                used_ids.add(product.id)
                results.append(
                    ScoredProduct(product=product, score=score, boosted=boosted)
                )
                continue
            substitute = next(
                (item for item in in_stock if item[1].id not in used_ids),
                None,
            )
            if substitute is None:
                continue
            sub_score, sub_product, sub_boosted = substitute
            used_ids.add(sub_product.id)
            results.append(
                ScoredProduct(
                    product=sub_product,
                    score=score,
                    boosted=sub_boosted or boosted,
                    note=(
                        f"Out of stock — showing the closest in-stock match "
                        f"for {product.name}."
                    ),
                )
            )
        return results


@lru_cache
def get_search_service() -> SearchService:
    """Return the shared :class:`SearchService` (loads the index on first use)."""
    return SearchService()
