"""Conversational shopping assistant with Gemini function calling.

Sessions are kept in an in-memory dict (swap for Firestore later). The model is
given three tools and the backend runs the tool-execution loop until the model
produces a final answer.
"""

from __future__ import annotations

import logging
import threading
from functools import lru_cache
from typing import Any, Optional

from google.genai import types
from pydantic import BaseModel, Field

from app.models.product import Product, ScoredProduct
from app.repositories import get_product_repository
from app.repositories.base import ProductRepository
from app.services.gemini_service import GeminiService, get_gemini_service
from app.services.search_service import SearchService, get_search_service

logger = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 5
MAX_HISTORY_TURNS = 20

SYSTEM_PROMPT = (
    "You are BellWether, a friendly and helpful shopping assistant for an online "
    "store selling fashion, accessories and home goods. "
    "IMPORTANT: Never invent or guess products, prices or stock levels. Only ever "
    "recommend items that are returned by the search_products or get_product tools. "
    "If a tool returns no matches, say so honestly and suggest a different search. "
    "Keep replies concise and conversational."
)


class ProductSummary(BaseModel):
    id: int
    name: str
    category: str
    price: float
    color: str
    image_url: str
    stock: int


class ChatResult(BaseModel):
    reply: str
    products_mentioned: list[ProductSummary] = Field(default_factory=list)


def _product_summary(product: Product, score: Optional[float] = None) -> dict[str, Any]:
    summary: dict[str, Any] = {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "price": product.price,
        "color": product.color,
        "stock": product.stock,
        "description": product.description,
    }
    if score is not None:
        summary["similarity"] = round(score, 3)
    return summary


class ShoppingTools:
    """Executes the tools the model can call."""

    def __init__(
        self,
        search_service: SearchService,
        product_repo: ProductRepository,
    ) -> None:
        self.search_service = search_service
        self.product_repo = product_repo
        self.mentioned: dict[int, ProductSummary] = {}

    def _remember(self, product: Product) -> None:
        if product.id is not None:
            self.mentioned[product.id] = ProductSummary(
                id=product.id,
                name=product.name,
                category=product.category,
                price=product.price,
                color=product.color,
                image_url=product.image_url,
                stock=product.stock,
            )

    def search_products(
        self,
        query: str,
        max_price: Optional[float] = None,
        category: Optional[str] = None,
    ) -> dict[str, Any]:
        results: list[ScoredProduct] = self.search_service.semantic_search(
            query, top_k=5, category=category, max_price=max_price
        )
        products = []
        for scored in results:
            self._remember(scored.product)
            products.append(_product_summary(scored.product, scored.score))
        return {"count": len(products), "products": products}

    def get_product(self, id: int) -> dict[str, Any]:
        product = self.product_repo.get(int(id))
        if product is None:
            return {"error": f"No product found with id {id}."}
        self._remember(product)
        return _product_summary(product)

    def check_stock(self, id: int) -> dict[str, Any]:
        product = self.product_repo.get(int(id))
        if product is None:
            return {"error": f"No product found with id {id}."}
        self._remember(product)
        return {
            "id": product.id,
            "name": product.name,
            "stock": product.stock,
            "in_stock": product.stock > 0,
        }

    def dispatch(self, name: str, args: dict[str, Any]) -> dict[str, Any]:
        handlers = {
            "search_products": self.search_products,
            "get_product": self.get_product,
            "check_stock": self.check_stock,
        }
        handler = handlers.get(name)
        if handler is None:
            return {"error": f"Unknown tool '{name}'."}
        try:
            return handler(**(args or {}))
        except TypeError as exc:
            return {"error": f"Invalid arguments for {name}: {exc}"}
        except Exception as exc:  # noqa: BLE001
            logger.exception("Tool %s failed", name)
            return {"error": f"Tool {name} failed: {exc}"}


def _build_tools() -> types.Tool:
    return types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="search_products",
                description=(
                    "Search the product catalog for items matching a natural-language "
                    "query. Returns up to 5 relevant products with id, name, category, "
                    "price, color and stock."
                ),
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "query": types.Schema(
                            type=types.Type.STRING,
                            description="What the shopper is looking for.",
                        ),
                        "max_price": types.Schema(
                            type=types.Type.NUMBER,
                            description="Optional maximum price in USD.",
                        ),
                        "category": types.Schema(
                            type=types.Type.STRING,
                            description="Optional category filter.",
                        ),
                    },
                    required=["query"],
                ),
            ),
            types.FunctionDeclaration(
                name="get_product",
                description="Get full details for a single product by its id.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "id": types.Schema(
                            type=types.Type.INTEGER, description="The product id."
                        ),
                    },
                    required=["id"],
                ),
            ),
            types.FunctionDeclaration(
                name="check_stock",
                description="Check whether a product is in stock and how many remain.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "id": types.Schema(
                            type=types.Type.INTEGER, description="The product id."
                        ),
                    },
                    required=["id"],
                ),
            ),
        ]
    )


class ChatService:
    """Stateful chat orchestration with an in-memory session store."""

    def __init__(
        self,
        gemini: Optional[GeminiService] = None,
        search_service: Optional[SearchService] = None,
        product_repo: Optional[ProductRepository] = None,
    ) -> None:
        self.gemini = gemini or get_gemini_service()
        self.search_service = search_service or get_search_service()
        self.product_repo = product_repo or get_product_repository()
        self.tools = _build_tools()
        self._sessions: dict[str, list[types.Content]] = {}
        self._lock = threading.Lock()

    def _config(self) -> types.GenerateContentConfig:
        return types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=[self.tools],
            temperature=0.4,
        )

    def reset(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)

    def _history(self, session_id: str) -> list[types.Content]:
        return self._sessions.setdefault(session_id, [])

    def chat(self, session_id: str, message: str) -> ChatResult:
        """Run one user turn through the tool-execution loop."""
        executor = ShoppingTools(self.search_service, self.product_repo)

        with self._lock:
            history = self._history(session_id)
            history.append(
                types.Content(
                    role="user", parts=[types.Part.from_text(text=message)]
                )
            )

            reply = ""
            for _ in range(MAX_TOOL_ROUNDS):
                response = self.gemini.client.models.generate_content(
                    model=self.gemini.model,
                    contents=history,
                    config=self._config(),
                )
                if not response.candidates:
                    reply = "I'm sorry, I couldn't process that request."
                    break

                model_content = response.candidates[0].content
                if model_content is not None:
                    history.append(model_content)

                function_calls = response.function_calls
                if not function_calls:
                    reply = (response.text or "").strip() or (
                        "I'm sorry, I couldn't find an answer to that."
                    )
                    break

                response_parts: list[types.Part] = []
                for call in function_calls:
                    result = executor.dispatch(call.name, dict(call.args or {}))
                    response_parts.append(
                        types.Part.from_function_response(
                            name=call.name, response=result
                        )
                    )
                history.append(types.Content(role="user", parts=response_parts))
            else:
                reply = (
                    "I needed more steps than expected to answer that. "
                    "Could you rephrase your question?"
                )

            # Trim history so sessions don't grow without bound.
            if len(history) > MAX_HISTORY_TURNS:
                del history[:-MAX_HISTORY_TURNS]

        return ChatResult(
            reply=reply, products_mentioned=list(executor.mentioned.values())
        )


@lru_cache
def get_chat_service() -> ChatService:
    return ChatService()
