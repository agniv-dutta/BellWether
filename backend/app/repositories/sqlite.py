"""SQLite implementation of the repository interfaces.

Connections are opened per call (SQLite connections are not thread-safe) which
keeps the code simple and safe under FastAPI's threadpool. Embeddings are stored
as JSON text.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import date
from pathlib import Path
from typing import Any, Optional

from app.models.product import Product, SalesRecord
from app.repositories.base import ProductRepository, SalesRepository

_SCHEMA = """
CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY,
    name        TEXT    NOT NULL,
    category    TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    price       REAL    NOT NULL DEFAULT 0,
    color       TEXT    NOT NULL DEFAULT '',
    image_url   TEXT    NOT NULL DEFAULT '',
    stock       INTEGER NOT NULL DEFAULT 0,
    embedding   TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS sales (
    id         INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL,
    quantity   INTEGER NOT NULL,
    sale_date  TEXT    NOT NULL,
    revenue    REAL    NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
"""


class _SqliteMixin:
    """Shared connection handling for the SQLite repositories."""

    def __init__(self, db_path: str) -> None:
        self.db_path = str(db_path)

    def _connect(self, readonly: bool = False) -> sqlite3.Connection:
        if readonly:
            uri = f"file:{Path(self.db_path).as_posix()}?mode=ro"
            conn = sqlite3.connect(uri, uri=True, timeout=30)
        else:
            conn = sqlite3.connect(self.db_path, timeout=30)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn


class SqliteProductRepository(_SqliteMixin, ProductRepository):
    """SQLite-backed :class:`ProductRepository`."""

    @staticmethod
    def _row_to_product(row: sqlite3.Row) -> Product:
        raw = row["embedding"]
        embedding = json.loads(raw) if raw else None
        return Product(
            id=row["id"],
            name=row["name"],
            category=row["category"],
            description=row["description"],
            price=row["price"],
            color=row["color"],
            image_url=row["image_url"],
            stock=row["stock"],
            embedding=embedding,
        )

    def get(self, product_id: int) -> Optional[Product]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM products WHERE id = ?", (product_id,)
            ).fetchone()
        return self._row_to_product(row) if row else None

    def list(
        self,
        category: Optional[str] = None,
        max_price: Optional[float] = None,
        min_price: Optional[float] = None,
        in_stock: Optional[bool] = None,
        name_contains: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> list[Product]:
        clauses: list[str] = []
        params: list[Any] = []
        if category:
            clauses.append("LOWER(category) = LOWER(?)")
            params.append(category)
        if max_price is not None:
            clauses.append("price <= ?")
            params.append(max_price)
        if min_price is not None:
            clauses.append("price >= ?")
            params.append(min_price)
        if in_stock is True:
            clauses.append("stock > 0")
        elif in_stock is False:
            clauses.append("stock <= 0")
        if name_contains:
            clauses.append("LOWER(name) LIKE ?")
            params.append(f"%{name_contains.lower()}%")

        sql = "SELECT * FROM products"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        sql += " ORDER BY name"
        if limit is not None:
            sql += " LIMIT ?"
            params.append(limit)

        with self._connect() as conn:
            rows = conn.execute(sql, params).fetchall()
        return [self._row_to_product(r) for r in rows]

    def all_with_embeddings(self) -> list[Product]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM products WHERE embedding IS NOT NULL"
            ).fetchall()
        return [self._row_to_product(r) for r in rows]

    def upsert(self, product: Product) -> Product:
        scalar_fields = (
            product.name,
            product.category,
            product.description,
            product.price,
            product.color,
            product.image_url,
            product.stock,
        )
        embedding_json = (
            json.dumps(product.embedding) if product.embedding is not None else None
        )

        with self._connect() as conn:
            if product.id is None:
                cur = conn.execute(
                    """
                    INSERT INTO products
                        (name, category, description, price, color, image_url,
                         stock, embedding)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (*scalar_fields, embedding_json),
                )
                product.id = int(cur.lastrowid)
            else:
                exists = conn.execute(
                    "SELECT 1 FROM products WHERE id = ?", (product.id,)
                ).fetchone()
                if exists:
                    if product.embedding is not None:
                        conn.execute(
                            """
                            UPDATE products
                            SET name = ?, category = ?, description = ?, price = ?,
                                color = ?, image_url = ?, stock = ?, embedding = ?
                            WHERE id = ?
                            """,
                            (*scalar_fields, embedding_json, product.id),
                        )
                    else:
                        conn.execute(
                            """
                            UPDATE products
                            SET name = ?, category = ?, description = ?, price = ?,
                                color = ?, image_url = ?, stock = ?
                            WHERE id = ?
                            """,
                            (*scalar_fields, product.id),
                        )
                else:
                    conn.execute(
                        """
                        INSERT INTO products
                            (id, name, category, description, price, color,
                             image_url, stock, embedding)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (product.id, *scalar_fields, embedding_json),
                    )
            conn.commit()
        return product

    def update_embedding(self, product_id: int, vector: list[float]) -> None:
        with self._connect() as conn:
            conn.execute(
                "UPDATE products SET embedding = ? WHERE id = ?",
                (json.dumps(vector), product_id),
            )
            conn.commit()

    def count(self) -> int:
        with self._connect() as conn:
            return int(conn.execute("SELECT COUNT(*) FROM products").fetchone()[0])


class SqliteSalesRepository(_SqliteMixin, SalesRepository):
    """SQLite-backed :class:`SalesRepository`."""

    @staticmethod
    def _row_to_record(row: sqlite3.Row) -> SalesRecord:
        return SalesRecord(
            id=row["id"],
            product_id=row["product_id"],
            quantity=row["quantity"],
            sale_date=date.fromisoformat(row["sale_date"]),
            revenue=row["revenue"],
        )

    def add(self, record: SalesRecord) -> SalesRecord:
        with self._connect() as conn:
            cur = conn.execute(
                """
                INSERT INTO sales (product_id, quantity, sale_date, revenue)
                VALUES (?, ?, ?, ?)
                """,
                (
                    record.product_id,
                    record.quantity,
                    record.sale_date.isoformat(),
                    record.revenue,
                ),
            )
            conn.commit()
            record.id = int(cur.lastrowid)
        return record

    def add_many(self, records: list[SalesRecord]) -> int:
        rows = [
            (r.product_id, r.quantity, r.sale_date.isoformat(), r.revenue)
            for r in records
        ]
        with self._connect() as conn:
            conn.executemany(
                """
                INSERT INTO sales (product_id, quantity, sale_date, revenue)
                VALUES (?, ?, ?, ?)
                """,
                rows,
            )
            conn.commit()
        return len(rows)

    def list(
        self,
        product_id: Optional[int] = None,
        since: Optional[date] = None,
        until: Optional[date] = None,
        limit: Optional[int] = None,
    ) -> list[SalesRecord]:
        clauses: list[str] = []
        params: list[Any] = []
        if product_id is not None:
            clauses.append("product_id = ?")
            params.append(product_id)
        if since is not None:
            clauses.append("sale_date >= ?")
            params.append(since.isoformat())
        if until is not None:
            clauses.append("sale_date <= ?")
            params.append(until.isoformat())

        sql = "SELECT * FROM sales"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        sql += " ORDER BY sale_date DESC"
        if limit is not None:
            sql += " LIMIT ?"
            params.append(limit)

        with self._connect() as conn:
            rows = conn.execute(sql, params).fetchall()
        return [self._row_to_record(r) for r in rows]

    def count(self) -> int:
        with self._connect() as conn:
            return int(conn.execute("SELECT COUNT(*) FROM sales").fetchone()[0])


def init_db(db_path: str) -> None:
    """Create the schema if it does not already exist."""
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(_SCHEMA)
        conn.commit()
    finally:
        conn.close()
