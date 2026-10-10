"""Visual search: extract style attributes from an image, then match products.

Flow:
1. Ask Gemini to describe the image as structured ``StyleAttributes``.
2. Build a semantic query from those attributes and reuse ``SearchService``.
3. Ask Gemini for a one-line explanation of why each top result matches.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Optional

from pydantic import BaseModel, Field

from app.models.product import ScoredProduct
from app.services.gemini_service import GeminiService, get_gemini_service
from app.services.search_service import SearchService, get_search_service

logger = logging.getLogger(__name__)

_STYLE_SYSTEM = (
    "You are an expert fashion and home-goods visual analyst. "
    "Describe products precisely and concisely."
)

_EXPLAIN_SYSTEM = (
    "You are a helpful shopping assistant. Explain matches honestly and briefly."
)


class StyleAttributes(BaseModel):
    """Structured style attributes extracted from an image."""

    category: str = Field(..., description="Best-matching product category.")
    colors: list[str] = Field(default_factory=list, description="Dominant colors.")
    style_keywords: list[str] = Field(
        default_factory=list, description="Style descriptors, e.g. minimalist."
    )
    material: str = Field("", description="Apparent material, if any.")
    occasion: str = Field("", description="Likely occasion / use.")
    description: str = Field("", description="One-sentence description of the item.")


class MatchExplanation(BaseModel):
    product_id: int
    explanation: str


class MatchExplanations(BaseModel):
    matches: list[MatchExplanation] = Field(default_factory=list)


class VisualSearchResult(BaseModel):
    attributes: StyleAttributes
    results: list[ScoredProduct]
    explanations: dict[int, str] = Field(default_factory=dict)


class VisualSearchService:
    """Orchestrates image -> attributes -> semantic matches -> explanations."""

    def __init__(
        self,
        gemini: Optional[GeminiService] = None,
        search: Optional[SearchService] = None,
    ) -> None:
        self.gemini = gemini or get_gemini_service()
        self.search = search or get_search_service()

    def extract_attributes(
        self,
        image_bytes: bytes,
        mime_type: str,
        hint: Optional[str] = None,
    ) -> StyleAttributes:
        prompt = (
            "Analyse this product image and extract its style attributes. "
            "Choose the single best-fitting category (for example: Women's Tops, "
            "Men's Shirts, Dresses, Denim, Outerwear, Shoes, Bags, Accessories, "
            "Home Decor, Kitchen, Bedding, Lighting, Rugs)."
        )
        if hint:
            prompt += f"\nThe shopper also added this hint: {hint}"
        return self.gemini.generate_json(
            prompt,
            StyleAttributes,
            image_bytes=image_bytes,
            mime_type=mime_type,
            system_instruction=_STYLE_SYSTEM,
        )

    @staticmethod
    def build_query(attributes: StyleAttributes) -> str:
        parts = [
            attributes.description,
            attributes.category,
            attributes.material,
            attributes.occasion,
            " ".join(attributes.colors),
            " ".join(attributes.style_keywords),
        ]
        query = " ".join(part for part in parts if part).strip()
        return query or "product"

    def explain_matches(
        self,
        attributes: StyleAttributes,
        results: list[ScoredProduct],
    ) -> dict[int, str]:
        if not results:
            return {}

        catalog_lines = []
        for item in results:
            product = item.product
            catalog_lines.append(
                f"- id={product.id}: {product.name} | category={product.category} "
                f"| color={product.color} | {product.description}"
            )
        prompt = (
            f"The shopper uploaded an image described as: {attributes.model_dump_json()}.\n"
            "Here are the candidate products:\n"
            + "\n".join(catalog_lines)
            + "\n\nFor each candidate id, write ONE short sentence (max 20 words) "
            "explaining why it does or does not match the shopper's image. "
            "Return one entry per candidate id."
        )
        parsed = self.gemini.generate_json(
            prompt, MatchExplanations, system_instruction=_EXPLAIN_SYSTEM
        )
        return {match.product_id: match.explanation for match in parsed.matches}

    def search_by_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        hint: Optional[str] = None,
        limit: int = 10,
    ) -> VisualSearchResult:
        attributes = self.extract_attributes(image_bytes, mime_type, hint=hint)
        results = self.search.semantic_search(
            self.build_query(attributes), top_k=limit
        )
        try:
            explanations = self.explain_matches(attributes, results)
        except Exception:  # noqa: BLE001 - explanations are best-effort
            logger.exception("Failed to generate match explanations.")
            explanations = {}
        return VisualSearchResult(
            attributes=attributes, results=results, explanations=explanations
        )


@lru_cache
def get_visual_search_service() -> VisualSearchService:
    return VisualSearchService()
