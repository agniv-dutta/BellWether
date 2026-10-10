"""Seed the SQLite database with synthetic retail data.

Generates ~200 realistic fashion/home products and ~5000 sales rows spanning
the last 90 days. Some products are intentionally fast-selling with low stock
so the merchant copilot / alerts have interesting answers.

Usage::

    python scripts/seed.py
"""

from __future__ import annotations

import random
import sys
from datetime import date, timedelta
from pathlib import Path

# Make ``app`` importable when run as ``python scripts/seed.py``.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings  # noqa: E402
from app.models.product import Product, SalesRecord  # noqa: E402
from app.repositories.sqlite import (  # noqa: E402
    SqliteProductRepository,
    SqliteSalesRepository,
    init_db,
)

random.seed(42)

TARGET_PRODUCTS = 200
TARGET_SALES = 5000
HOT_PRODUCT_COUNT = 18
DAYS_OF_HISTORY = 90

COLORS = [
    "Black", "White", "Navy", "Beige", "Olive", "Burgundy", "Grey",
    "Charcoal", "Cream", "Rust", "Sage", "Camel", "Blush", "Cobalt",
    "Bottle Green", "Chocolate", "Lavender", "Sand", "Terracotta", "Mocha",
]

# category -> (items, materials, (price_low, price_high), occasions)
CATALOG: dict[str, dict] = {
    "Women's Tops": {
        "items": ["Blouse", "T-Shirt", "Tank Top", "Sweater", "Cardigan", "Bodysuit"],
        "materials": ["Cotton", "Linen", "Silk", "Ribbed Knit", "Chiffon"],
        "price": (15, 60),
        "occasions": ["everyday", "office", "evening out"],
    },
    "Men's Shirts": {
        "items": ["Oxford Shirt", "Flannel Shirt", "Polo Shirt", "Henley", "Overshirt"],
        "materials": ["Cotton", "Linen", "Chambray", "Corduroy", "Twill"],
        "price": (20, 75),
        "occasions": ["everyday", "office", "weekend"],
    },
    "Dresses": {
        "items": ["Midi Dress", "Maxi Dress", "Wrap Dress", "Slip Dress", "Shirt Dress"],
        "materials": ["Satin", "Cotton", "Linen", "Jersey", "Crepe"],
        "price": (30, 120),
        "occasions": ["wedding guest", "summer", "evening", "office"],
    },
    "Denim": {
        "items": ["Straight Jeans", "Skinny Jeans", "Wide-Leg Jeans", "Denim Jacket", "Shorts"],
        "materials": ["Rigid Denim", "Stretch Denim", "Selvedge Denim"],
        "price": (40, 110),
        "occasions": ["everyday", "weekend", "concert"],
    },
    "Outerwear": {
        "items": ["Trench Coat", "Puffer Jacket", "Wool Coat", "Bomber Jacket", "Parka"],
        "materials": ["Wool", "Nylon", "Cotton Twill", "Down", "Polyester"],
        "price": (60, 220),
        "occasions": ["winter", "rainy days", "commuting"],
    },
    "Shoes": {
        "items": ["Sneakers", "Loafers", "Chelsea Boots", "Heeled Sandals", "Ballet Flats"],
        "materials": ["Leather", "Suede", "Canvas", "Vegan Leather"],
        "price": (35, 160),
        "occasions": ["everyday", "office", "evening"],
    },
    "Bags": {
        "items": ["Tote Bag", "Crossbody Bag", "Shoulder Bag", "Backpack", "Clutch"],
        "materials": ["Leather", "Canvas", "Suede", "Nylon"],
        "price": (30, 190),
        "occasions": ["everyday", "travel", "evening"],
    },
    "Accessories": {
        "items": ["Silk Scarf", "Leather Belt", "Sunglasses", "Beanie", "Wool Socks"],
        "materials": ["Silk", "Leather", "Acetate", "Merino Wool"],
        "price": (10, 65),
        "occasions": ["everyday", "gifting", "winter"],
    },
    "Home Decor": {
        "items": ["Ceramic Vase", "Wall Mirror", "Picture Frame", "Candle Holder", "Sculpture"],
        "materials": ["Ceramic", "Brass", "Oak", "Marble", "Rattan"],
        "price": (15, 90),
        "occasions": ["gifting", "living room", "housewarming"],
    },
    "Kitchen": {
        "items": ["Mug Set", "Cast Iron Pan", "Serving Board", "Mixing Bowls", "Kettle"],
        "materials": ["Stoneware", "Cast Iron", "Acacia", "Bamboo", "Enamel"],
        "price": (12, 70),
        "occasions": ["gifting", "everyday cooking", "brunch"],
    },
    "Bedding": {
        "items": ["Duvet Cover", "Sheet Set", "Pillowcase Pair", "Throw Blanket", "Quilt"],
        "materials": ["Cotton Percale", "Linen", "Bamboo", "Flannel", "Waffle Weave"],
        "price": (25, 150),
        "occasions": ["bedroom refresh", "gifting", "winter"],
    },
    "Lighting": {
        "items": ["Table Lamp", "Floor Lamp", "Pendant Light", "Wall Sconce", "String Lights"],
        "materials": ["Brass", "Ceramic", "Rattan", "Glass", "Linen Shade"],
        "price": (20, 130),
        "occasions": ["living room", "bedroom", "mood lighting"],
    },
    "Rugs": {
        "items": ["Area Rug", "Runner Rug", "Jute Rug", "Shag Rug", "Wool Rug"],
        "materials": ["Jute", "Wool", "Cotton", "Polypropylene", "Viscose"],
        "price": (40, 210),
        "occasions": ["living room", "bedroom", "hallway"],
    },
}


def _description(color: str, material: str, item: str, occasion: str) -> str:
    return (
        f"A {color.lower()} {material.lower()} {item.lower()} designed for {occasion}. "
        f"Thoughtfully made with quality materials and an easy, versatile fit that "
        f"works across the season."
    )


def build_products() -> list[Product]:
    """Generate a balanced catalog across all categories."""
    categories = list(CATALOG.keys())
    products: list[Product] = []

    for i in range(TARGET_PRODUCTS):
        category = categories[i % len(categories)]
        spec = CATALOG[category]
        item = random.choice(spec["items"])
        material = random.choice(spec["materials"])
        color = random.choice(COLORS)
        occasion = random.choice(spec["occasions"])
        price = round(random.uniform(*spec["price"]), 2)

        name_prefix = f"{color} {material}"
        if category in {"Home Decor", "Kitchen", "Bedding", "Lighting", "Rugs"}:
            name = f"{name_prefix} {item}"
        else:
            name = f"{name_prefix} {item}"

        products.append(
            Product(
                name=name,
                category=category,
                description=_description(color, material, item, occasion),
                price=price,
                color=color,
                image_url=f"https://picsum.photos/seed/bellwether{i}/600/600",
                stock=random.randint(0, 120),
            )
        )
    return products


def assign_stock_and_popularity(products: list[Product]) -> dict[int, float]:
    """Assign per-product sales popularity weights.

    A handful of products are made "hot": fast-selling but low on stock.
    """
    hot_ids = set(random.sample(range(1, len(products) + 1), HOT_PRODUCT_COUNT))
    weights: dict[int, float] = {}

    for product in products:
        assert product.id is not None
        if product.id in hot_ids:
            # Fast-selling, low stock -> interesting merchant alerts.
            product.stock = random.randint(0, 6)
            weights[product.id] = random.uniform(7.0, 14.0)
        else:
            weights[product.id] = random.uniform(0.2, 2.0)

    # A few clearly out-of-stock items.
    for product in products[:5]:
        product.stock = 0
    return weights


def build_sales(
    products: list[Product], weights: dict[int, float]
) -> list[SalesRecord]:
    """Generate sales rows weighted toward popular products."""
    ids = [p.id for p in products if p.id is not None]
    weight_values = [weights[i] for i in ids]
    price_by_id = {p.id: p.price for p in products if p.id is not None}

    today = date.today()
    records: list[SalesRecord] = []
    for _ in range(TARGET_SALES):
        product_id = random.choices(ids, weights=weight_values, k=1)[0]
        days_ago = random.randint(0, DAYS_OF_HISTORY - 1)
        sale_date = today - timedelta(days=days_ago)
        quantity = random.choices([1, 2, 3, 4, 5], weights=[50, 25, 13, 7, 5], k=1)[0]
        discount = random.choice([1.0, 1.0, 1.0, 0.9, 0.85, 0.75])
        revenue = round(price_by_id[product_id] * quantity * discount, 2)
        records.append(
            SalesRecord(
                product_id=product_id,
                quantity=quantity,
                sale_date=sale_date,
                revenue=revenue,
            )
        )
    return records


def main() -> None:
    db_path = settings.db_path
    print(f"Seeding database at: {db_path}")

    # Fresh start for a deterministic seed.
    Path(db_path).unlink(missing_ok=True)
    init_db(db_path)

    product_repo = SqliteProductRepository(db_path)
    sales_repo = SqliteSalesRepository(db_path)

    products = build_products()
    for product in products:
        product_repo.upsert(product)

    weights = assign_stock_and_popularity(products)
    # Persist the adjusted stock values.
    for product in products:
        product_repo.upsert(product)

    sales = build_sales(products, weights)
    sales_repo.add_many(sales)

    print(f"Inserted {product_repo.count()} products.")
    print(f"Inserted {sales_repo.count()} sales rows.")


if __name__ == "__main__":
    main()
