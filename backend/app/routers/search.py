"""Search routes: semantic text search and visual search."""

from __future__ import annotations

import logging
import mimetypes

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from pydantic import BaseModel, Field

from app.models.product import Product, ScoredProduct
from app.services.gemini_service import GeminiServiceError
from app.services.search_service import SearchService, get_search_service
from app.services.visual_search_service import (
    StyleAttributes,
    VisualSearchResult,
    VisualSearchService,
    get_visual_search_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"])

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}
_ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}


class SearchResultItem(BaseModel):
    id: int
    name: str
    category: str
    description: str
    price: float
    color: str
    image_url: str
    stock: int
    score: float

    @classmethod
    def from_scored(cls, scored: ScoredProduct) -> "SearchResultItem":
        product: Product = scored.product
        return cls(
            id=product.id or 0,
            name=product.name,
            category=product.category,
            description=product.description,
            price=product.price,
            color=product.color,
            image_url=product.image_url,
            stock=product.stock,
            score=round(scored.score, 4),
        )


class SearchResponse(BaseModel):
    query: str
    count: int
    results: list[SearchResultItem]


def _get_service() -> SearchService:
    return get_search_service()


@router.get("", response_model=SearchResponse)
def semantic_search(
    q: str = Query(..., min_length=1, description="Natural-language query."),
    category: str | None = Query(None, description="Optional category filter."),
    max_price: float | None = Query(None, ge=0, description="Optional max price."),
    limit: int = Query(10, ge=1, le=50, description="Number of results."),
    service: SearchService = Depends(_get_service),
) -> SearchResponse:
    """Rank the catalog by semantic similarity to ``q``."""
    try:
        scored = service.semantic_search(
            q, top_k=limit, category=category, max_price=max_price
        )
    except GeminiServiceError as exc:
        logger.exception("Semantic search failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Search backend error: {exc}",
        ) from exc

    results = [SearchResultItem.from_scored(item) for item in scored]
    return SearchResponse(query=q, count=len(results), results=results)


# --------------------------------------------------------------------------- #
# Visual search
# --------------------------------------------------------------------------- #
class VisualResultItem(SearchResultItem):
    explanation: str = ""


class VisualSearchResponse(BaseModel):
    attributes: StyleAttributes
    count: int
    results: list[VisualResultItem]


def _get_visual_service() -> VisualSearchService:
    return get_visual_search_service()


def _resolve_mime_type(upload: UploadFile) -> str | None:
    """Return the upload's MIME type, inferring from the filename if needed."""
    if upload.content_type and upload.content_type in ALLOWED_IMAGE_TYPES:
        return upload.content_type
    guess, _ = mimetypes.guess_type(upload.filename or "")
    if guess in ALLOWED_IMAGE_TYPES:
        return guess
    return None


@router.post("/visual", response_model=VisualSearchResponse)
async def visual_search(
    image: UploadFile = File(..., description="Product image (max 5 MB)."),
    hint: str | None = Form(None, description="Optional text hint."),
    limit: int = Form(10, ge=1, le=30, description="Number of matches."),
    service: VisualSearchService = Depends(_get_visual_service),
) -> VisualSearchResponse:
    """Find catalog products that match an uploaded image."""
    mime_type = _resolve_mime_type(image)
    if mime_type is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image type. Use JPEG, PNG, WEBP or HEIC.",
        )

    data = await image.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Empty image upload."
        )
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the 5 MB limit.",
        )

    try:
        result: VisualSearchResult = service.search_by_image(
            data, mime_type, hint=hint, limit=limit
        )
    except GeminiServiceError as exc:
        logger.exception("Visual search failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Visual search backend error: {exc}",
        ) from exc

    results = [
        VisualResultItem(
            **SearchResultItem.from_scored(item).model_dump(),
            explanation=result.explanations.get(item.product.id or 0, ""),
        )
        for item in result.results
    ]
    return VisualSearchResponse(
        attributes=result.attributes, count=len(results), results=results
    )
