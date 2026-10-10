"""Smoke test for the Vertex AI integration.

Calls each Gemini wrapper method once and prints the results. Run this after
configuring ADC and billing::

    python scripts/smoke_test_ai.py

If this passes, your auth, APIs, and billing are set up correctly.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pydantic import BaseModel  # noqa: E402

from app.config import settings  # noqa: E402
from app.services.gemini_service import get_gemini_service  # noqa: E402


class Widget(BaseModel):
    name: str
    color: str
    price_usd: float
    tags: list[str]


def main() -> None:
    print(f"Project : {settings.project}")
    print(f"Location: {settings.location}")
    print(f"Chat    : {settings.gemini_model}")
    print(f"Embed   : {settings.embedding_model}")
    print("-" * 60)

    service = get_gemini_service()

    print("[1/3] generate_text ...")
    text = service.generate_text(
        "In one short sentence, describe what a retail recommendation engine does.",
        system_instruction="You are a concise technical assistant.",
    )
    print("   ->", text.strip())
    print()

    print("[2/3] generate_json ...")
    widget = service.generate_json(
        "Invent a single product for an online store with a name, color, "
        "price in USD, and 3 tags.",
        Widget,
    )
    print("   ->", widget.model_dump())
    print()

    print("[3/3] embed_texts ...")
    vectors = service.embed_texts(
        ["a red wool winter coat", "a lightweight summer linen dress"],
        task_type="SEMANTIC_SIMILARITY",
    )
    print(f"   -> got {len(vectors)} vectors, dim={len(vectors[0])}")
    print()

    print("Smoke test passed.")


if __name__ == "__main__":
    main()
