"""Abstract repository interfaces.

The data layer lives behind these interfaces so that the SQLite implementation
can be swapped for BigQuery (or anything else) without touching route or
service code.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date
from typing import Optional

from app.models.product import Product, SalesRecord


class ProductRepository(ABC):
    """Read/write access to the product catalog."""

    @abstractmethod
    def get(self, product_id: int) -> Optional[Product]:
        """Return a single product by id, or ``None``."""

    @abstractmethod
    def list(
        self,
        category: Optional[str] = None,
        max_price: Optional[float] = None,
        min_price: Optional[float] = None,
        in_stock: Optional[bool] = None,
        name_contains: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> list[Product]:
        """Return products matching the given filters."""

    @abstractmethod
    def all_with_embeddings(self) -> list[Product]:
        """Return every product that has a stored embedding."""

    @abstractmethod
    def upsert(self, product: Product) -> Product:
        """Insert a new product or update an existing one. Returns the product."""

    @abstractmethod
    def update_embedding(self, product_id: int, vector: list[float]) -> None:
        """Persist an embedding for a product."""

    @abstractmethod
    def count(self) -> int:
        """Return the number of products."""


class SalesRepository(ABC):
    """Read/write access to sales transactions."""

    @abstractmethod
    def add(self, record: SalesRecord) -> SalesRecord:
        """Insert a single sales record."""

    @abstractmethod
    def add_many(self, records: list[SalesRecord]) -> int:
        """Bulk-insert sales records. Returns the number inserted."""

    @abstractmethod
    def list(
        self,
        product_id: Optional[int] = None,
        since: Optional[date] = None,
        until: Optional[date] = None,
        limit: Optional[int] = None,
    ) -> list[SalesRecord]:
        """Return sales records matching the given filters."""

    @abstractmethod
    def count(self) -> int:
        """Return the number of sales records."""
