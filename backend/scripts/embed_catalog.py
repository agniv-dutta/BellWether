"""Embed the entire product catalog and persist the vectors.

Embeds ``name + category + description + color`` for every product in batches
and stores the vectors via the repository.

Usage::

    python scripts/embed_catalog.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.repositories import get_product_repository  # noqa: E402
from app.services.gemini_service import get_gemini_service  # noqa: E402
from app.services.search_service import DOC_TASK_TYPE, product_document  # noqa: E402

BATCH_SIZE = 50


def main() -> None:
    repo = get_product_repository()
    service = get_gemini_service()

    products = repo.list()
    if not products:
        print("No products found. Run scripts/seed.py first.")
        return

    print(f"Embedding {len(products)} products with model '{service.embedding_model}'...")
    documents = [product_document(p) for p in products]
    vectors = service.embed_texts(
        documents, task_type=DOC_TASK_TYPE, batch_size=BATCH_SIZE
    )

    if len(vectors) != len(products):
        raise RuntimeError(
            f"Expected {len(products)} vectors, received {len(vectors)}."
        )

    for product, vector in zip(products, vectors):
        assert product.id is not None
        repo.update_embedding(product.id, vector)

    embedded = len(repo.all_with_embeddings())
    print(f"Stored embeddings for {embedded} products.")


if __name__ == "__main__":
    main()
