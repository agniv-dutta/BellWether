"""Pydantic models for the retail domain."""

from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class Product(BaseModel):
    """A catalog product.

    ``id`` is optional on input (assigned by the database on first insert).
    ``embedding`` is a dense vector and is persisted as JSON text by the
    SQLite repository.
    """

    id: Optional[int] = None
    name: str
    category: str
    description: str = ""
    price: float = 0.0
    color: str = ""
    image_url: str = ""
    stock: int = 0
    embedding: Optional[list[float]] = None


class SalesRecord(BaseModel):
    """A single sales transaction line."""

    id: Optional[int] = None
    product_id: int
    quantity: int
    sale_date: date
    revenue: float


class ScoredProduct(BaseModel):
    """A product returned by search, with a similarity score."""

    product: Product
    score: float = Field(..., description="Cosine similarity in [-1, 1].")
