"""Shopper-facing product helpers: trending and complete-the-look."""

from __future__ import annotations

from collections import Counter
from datetime import date, timedelta
from functools import lru_cache
from typing import Optional

from pydantic import BaseModel, Field

from app.models.product import Product
from app.repositories import get_product_repository, get_sales_repository
from app.repositories.base import ProductRepository, SalesRepository

TRENDING_DAYS = 14
TRENDING_LIMIT = 8


class LookItem(BaseModel):
    product: Product
    reason: str = ""


class ProductService:
    """Trending rankings and basket-affinity recommendations."""

    def __init__(
        self,
        product_repo: Optional[ProductRepository] = None,
        sales_repo: Optional[SalesRepository] = None,
    ) -> None:
        self.product_repo = product_repo or get_product_repository()
        self.sales_repo = sales_repo or get_sales_repository()

    def trending(self, limit: int = TRENDING_LIMIT) -> list[Product]:
        """Top sellers by units over the last ``TRENDING_DAYS`` days."""
        since = date.today() - timedelta(days=TRENDING_DAYS)
        units: Counter = Counter()
        for record in self.sales_repo.list(since=since):
            units[record.product_id] += record.quantity
        top_ids = [pid for pid, _ in units.most_common(limit)]
        by_id = {p.id: p for p in self.product_repo.list() if p.id is not None}
        return [by_id[pid] for pid in top_ids if pid in by_id]

    def complete_the_look(
        self, product_id: int, limit: int = 4
    ) -> tuple[Product | None, list[LookItem]]:
        """Top co-purchased products by lift, with one-line reasons."""
        product = self.product_repo.get(product_id)
        if product is None:
            return None, []

        baskets = self.sales_repo.baskets()
        if not baskets:
            return product, []

        with_target = [b for b in baskets if product_id in b]
        if not with_target:
            return product, []

        co_counts: Counter = Counter()
        for basket in with_target:
            for other in basket:
                if other != product_id:
                    co_counts[other] += 1

        total_baskets = len(baskets)
        target_baskets = len(with_target)
        by_id = {p.id: p for p in self.product_repo.list() if p.id is not None}

        scored: list[tuple[float, Product]] = []
        for other_id, together in co_counts.items():
            other_baskets = sum(1 for b in baskets if other_id in b)
            if not other_baskets or other_id not in by_id:
                continue
            # Lift = P(other | target) / P(other).
            lift = (together / target_baskets) / (other_baskets / total_baskets)
            scored.append((lift, by_id[other_id]))
        scored.sort(key=lambda item: item[0], reverse=True)

        items = [
            LookItem(
                product=other,
                reason=(
                    f"Shoppers who picked up the {product.name} "
                    f"also took home the {other.name}."
                ),
            )
            for _, other in scored[:limit]
        ]
        return product, items


@lru_cache
def get_product_service() -> ProductService:
    return ProductService()
