"""Repository factory + schema bootstrap.

Routes and services depend on these accessors rather than concrete SQLite
classes, which keeps the data layer swappable.
"""

from __future__ import annotations

from functools import lru_cache

from app.config import settings
from app.repositories.sqlite import (
    SqliteProductRepository,
    SqliteSalesRepository,
    init_db,
)


@lru_cache
def get_product_repository() -> SqliteProductRepository:
    """Return the (singleton) product repository, ensuring the schema exists."""
    init_db(settings.db_path)
    return SqliteProductRepository(settings.db_path)


@lru_cache
def get_sales_repository() -> SqliteSalesRepository:
    """Return the (singleton) sales repository, ensuring the schema exists."""
    init_db(settings.db_path)
    return SqliteSalesRepository(settings.db_path)
