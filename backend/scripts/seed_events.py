"""Seed realistic shopper search events, including recurring misses.

Each query is run through the real search service so result counts and scores
are truthful. Recurring misses (things the store does not stock) give Demand
Radar something to cluster in the demo.

Usage::

    python scripts/seed_events.py
"""

from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Make ``app`` importable when run as ``python scripts/seed_events.py``.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings  # noqa: E402
from app.repositories import (  # noqa: E402
    get_product_repository,
    get_search_event_repository,
)
from app.services.search_service import SearchService, get_search_service  # noqa: E402

random.seed(7)

TARGET_EVENTS = 400
DAYS_OF_HISTORY = 14

# Things shoppers want that the store does not stock -> Demand Radar clusters.
RECURRING_MISSES = [
    "wireless earbuds under 1500",
    "silk saree",
    "gold necklace",
    "yoga mat",
    "dog bed",
    "espresso machine",
    "linen co-ord set plus size",
    "baby stroller",
]

# Ordinary queries a store like this would see (mostly hits).
HIT_QUERIES = [
    "linen shirt",
    "sneakers",
    "lamp for reading corner",
    "scented candle",
    "canvas tote",
    "face serum",
    "copper bottle",
    "throw blanket",
    "leather loafers",
    "dinner plates",
    "sunglasses",
    "summer dress",
    "hand cream",
    "cushion cover",
    "running shoes",
    "silk scarf",
    "wall mirror",
    "chai kulhar",
    "denim jacket",
    "lip balm",
]

MODES = ["text", "text", "text", "visual", "chat"]
PERSONAS = ["", "aarav", "meera", "riya"]


def main() -> None:
    get_product_repository()  # ensure schema exists
    service: SearchService = get_search_service()
    repo = get_search_event_repository()

    queries: list[str] = []
    # Recurring misses appear several times each across the fortnight.
    for miss in RECURRING_MISSES:
        queries.extend([miss] * random.randint(8, 16))
    # Fill the rest with everyday queries.
    while len(queries) < TARGET_EVENTS:
        queries.append(random.choice(HIT_QUERIES))
    random.shuffle(queries)
    queries = queries[:TARGET_EVENTS]

    now = datetime.now(timezone.utc)
    logged = 0
    for query in queries:
        results = service.semantic_search(query, top_k=5)
        top_score = max((r.score for r in results), default=0.0)
        ts = now - timedelta(
            days=random.randint(0, DAYS_OF_HISTORY - 1),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )
        with repo._connect() as conn:
            conn.execute(
                """
                INSERT INTO search_events (ts, query, mode, result_count, top_score, persona_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    ts.isoformat(),
                    query,
                    random.choice(MODES),
                    len(results),
                    float(top_score),
                    random.choice(PERSONAS),
                ),
            )
            conn.commit()
        logged += 1

    print(f"Logged {logged} search events at: {settings.db_path}")


if __name__ == "__main__":
    main()
