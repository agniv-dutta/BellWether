"""Shopper product helpers: trending and complete-the-look."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.routers.search import SearchResultItem
from app.services.product_service import ProductService, get_product_service

router = APIRouter(prefix="/api/products", tags=["products"])


def _get_service() -> ProductService:
    return get_product_service()


@router.get("/trending")
def trending(
    limit: int = Query(8, ge=1, le=20),
    service: ProductService = Depends(_get_service),
) -> dict:
    """Top sellers by recent units. Never needs AI, always available."""
    products = service.trending(limit=limit)
    return {
        "results": [
            SearchResultItem(
                id=p.id or 0,
                name=p.name,
                category=p.category,
                description=p.description,
                price=p.price,
                color=p.color,
                image_url=p.image_url,
                stock=p.stock,
                score=1.0,
            )
            for p in products
        ]
    }


@router.get("/{product_id}/complete-the-look")
def complete_the_look(
    product_id: int,
    limit: int = Query(4, ge=1, le=8),
    service: ProductService = Depends(_get_service),
) -> dict:
    """Products frequently bought with ``product_id``, ranked by lift."""
    product, items = service.complete_the_look(product_id, limit=limit)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found."
        )
    return {
        "results": [
            {
                **SearchResultItem(
                    id=item.product.id or 0,
                    name=item.product.name,
                    category=item.product.category,
                    description=item.product.description,
                    price=item.product.price,
                    color=item.product.color,
                    image_url=item.product.image_url,
                    stock=item.product.stock,
                    score=1.0,
                ).model_dump(),
                "reason": item.reason,
            }
            for item in items
        ]
    }
