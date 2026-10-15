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
    embedding: Optional[list[float]] = Field(default=None, exclude=True)


class SalesRecord(BaseModel):
    """A single sales transaction line."""

    id: Optional[int] = None
    product_id: int
    quantity: int
    sale_date: date
    revenue: float
    order_id: Optional[int] = None


class Customer(BaseModel):
    """A store customer (used for personas and basket analysis)."""

    id: Optional[int] = None
    name: str
    persona: str = ""
    city: str = ""


class Persona(BaseModel):
    """A shopper persona for personalised ranking."""

    id: str
    name: str
    category_affinity: dict[str, float] = Field(default_factory=dict)
    price_min: float = 0.0
    price_max: float = 0.0


class SearchEvent(BaseModel):
    """One shopper search/chat/visual query, logged for Demand Radar."""

    id: Optional[int] = None
    ts: str = ""
    query: str = ""
    mode: str = "text"
    result_count: int = 0
    top_score: float = 0.0
    persona_id: str = ""


class ScoredProduct(BaseModel):
    """A product returned by search, with a similarity score."""

    product: Product
    score: float = Field(..., description="Cosine similarity in [-1, 1].")
    boosted: bool = Field(
        default=False, description="True when a persona re-rank lifted this item."
    )
    note: str = Field(
        default="",
        description="Shopper-facing note, e.g. out-of-stock substitution.",
    )
