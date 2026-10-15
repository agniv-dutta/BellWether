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
from app.models.product import Customer, Persona, Product, SalesRecord  # noqa: E402
from app.repositories.sqlite import (  # noqa: E402
    SqliteCustomerRepository,
    SqlitePersonaRepository,
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
    "Terracotta", "Madder Red", "Deep Rust", "Coral", "Hibiscus Pink",
    "Peach Blush", "Vermilion", "Oxblood", "Sandstone Pink", "Ivory",
    "Natural Beige", "Henna", "Rosewood", "Wine", "Almond", "Cocoa",
    "Warm Brass", "Mustard", "Marigold", "Turmeric", "Ochre", "Indigo",
]

PERSONAS: list[dict] = [
    {
        "id": "aarav",
        "name": "Aarav · Streetwear",
        "category_affinity": {"Footwear": 1.0, "Apparel": 0.8, "Accessories": 0.6},
        "price_min": 800,
        "price_max": 5000,
    },
    {
        "id": "meera",
        "name": "Meera · Minimal home",
        "category_affinity": {"Home & Living": 1.0, "Kitchen": 0.7, "Beauty": 0.4},
        "price_min": 1500,
        "price_max": 10000,
    },
    {
        "id": "riya",
        "name": "Riya · Budget-first",
        "category_affinity": {
            "Accessories": 0.5, "Beauty": 0.5, "Kitchen": 0.5,
            "Apparel": 0.4, "Footwear": 0.3, "Home & Living": 0.3,
        },
        "price_min": 0,
        "price_max": 1500,
    },
]

CUSTOMER_NAMES = [
    "Aarav Mehta", "Meera Iyer", "Riya Sharma", "Kabir Rao", "Anaya Gupta",
    "Vikram Nair", "Diya Patel", "Arjun Malhotra", "Ishita Bose", "Rohan Verma",
    "Sneha Kulkarni", "Aditya Rao", "Priya Nambiar", "Karan Joshi", "Nisha Reddy",
    "Varun Menon", "Pooja Agarwal", "Nikhil Shah", "Kavya Menon", "Sahil Khan",
]

CUSTOMER_CITIES = [
    "Mumbai", "Delhi", "Bengaluru", "Jaipur", "Pune",
    "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Kochi",
]

# category -> (items, materials, (price_low, price_high), occasions)
# General retail across six categories; INR prices between 299 and 6999.
CATALOG: dict[str, dict] = {
    "Apparel": {
        "items": ["Linen Shirt", "Relaxed Trousers", "Co-ord Set", "Denim Jacket", "Summer Dress", "Knit Sweater"],
        "materials": ["Linen", "Cotton", "Denim", "Knit", "Canvas"],
        "price": (499, 2499),
        "occasions": ["everyday wear", "weekend", "work", "winter layering"],
    },
    "Footwear": {
        "items": ["Everyday Sneakers", "Running Shoes", "Leather Loafers", "Canvas Slip-ons", "Strappy Sandals", "Ankle Boots"],
        "materials": ["Canvas", "Leather", "Mesh", "Suede"],
        "price": (899, 3499),
        "occasions": ["everyday", "travel", "weekend", "work"],
    },
    "Home & Living": {
        "items": ["Ceramic Table Lamp", "Throw Blanket", "Cushion Cover", "Wall Mirror", "Scented Candle Set", "Cotton Dhurrie"],
        "materials": ["Ceramic", "Cotton", "Brass", "Glass", "Soy Wax"],
        "price": (499, 3999),
        "occasions": ["reading corner", "living room", "gifting", "housewarming"],
    },
    "Beauty": {
        "items": ["Skincare Set", "Face Serum", "Bath Salt Trio", "Hand Cream Duo", "Clay Mask Kit", "Lip Balm Set"],
        "materials": ["Vitamin C", "Shea Butter", "Kaolin Clay", "Hyaluronic", "Almond Oil"],
        "price": (299, 1799),
        "occasions": ["daily ritual", "gifting", "winter care", "self-care Sunday"],
    },
    "Kitchen": {
        "items": ["Serving Tray", "Chai Kulhar Set", "Copper Bottle", "Dinner Plates", "Storage Jar Set", "Cast Iron Skillet"],
        "materials": ["Terracotta", "Copper", "Stoneware", "Sheesham Wood", "Cast Iron"],
        "price": (399, 2499),
        "occasions": ["daily rituals", "festive hosting", "gifting", "brunch"],
    },
    "Accessories": {
        "items": ["Canvas Tote", "Leather Belt", "Silk Scarf", "Sunglasses", "Cotton Cap", "Day Backpack"],
        "materials": ["Canvas", "Leather", "Silk", "Acetate"],
        "price": (299, 2499),
        "occasions": ["everyday", "travel", "gifting", "weekend"],
    },
}


def _description(color: str, material: str, item: str, occasion: str) -> str:
    return (
        f"A {color.lower()} {item.lower()} in {material.lower()}, made for {occasion}. "
        f"An easy, well-made staple with a warm hand-finished feel."
    )


def _unsplash(photo_id: str) -> str:
    return f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=600&q=80"


# Deterministic product photography: one matching photo per catalog item, so
# the image always depicts what the name and caption describe. Photo IDs are
# the same ones used by the frontend mock catalog.
ITEM_IMAGES: dict[str, str] = {
    # Apparel
    "Linen Shirt": _unsplash("photo-1598033129183-c4f50c736f10"),
    "Summer Dress": _unsplash("photo-1598033129183-c4f50c736f10"),
    "Co-ord Set": _unsplash("photo-1544441893-675973e31985"),
    "Denim Jacket": _unsplash("photo-1544441893-675973e31985"),
    "Relaxed Trousers": _unsplash("photo-1544441893-675973e31985"),
    "Knit Sweater": _unsplash("photo-1601924994987-69e26d50dc26"),
    # Footwear (closest available product photography)
    "Everyday Sneakers": _unsplash("photo-1544441893-675973e31985"),
    "Running Shoes": _unsplash("photo-1544441893-675973e31985"),
    "Leather Loafers": _unsplash("photo-1544441893-675973e31985"),
    "Canvas Slip-ons": _unsplash("photo-1544441893-675973e31985"),
    "Strappy Sandals": _unsplash("photo-1544441893-675973e31985"),
    "Ankle Boots": _unsplash("photo-1544441893-675973e31985"),
    # Home & Living
    "Ceramic Table Lamp": _unsplash("photo-1507652313519-d4e9174996dd"),
    "Scented Candle Set": _unsplash("photo-1507652313519-d4e9174996dd"),
    "Wall Mirror": _unsplash("photo-1615529182904-14819c35db37"),
    "Throw Blanket": _unsplash("photo-1584100936595-c0654b55a2e2"),
    "Cushion Cover": _unsplash("photo-1584100936595-c0654b55a2e2"),
    "Cotton Dhurrie": _unsplash("photo-1584100936595-c0654b55a2e2"),
    # Beauty
    "Skincare Set": _unsplash("photo-1630019852942-f89202989a59"),
    "Face Serum": _unsplash("photo-1630019852942-f89202989a59"),
    "Clay Mask Kit": _unsplash("photo-1630019852942-f89202989a59"),
    "Bath Salt Trio": _unsplash("photo-1578749556568-bc2c40e68b61"),
    "Hand Cream Duo": _unsplash("photo-1578749556568-bc2c40e68b61"),
    "Lip Balm Set": _unsplash("photo-1578749556568-bc2c40e68b61"),
    # Kitchen
    "Chai Kulhar Set": _unsplash("photo-1578749556568-bc2c40e68b61"),
    "Dinner Plates": _unsplash("photo-1578749556568-bc2c40e68b61"),
    "Storage Jar Set": _unsplash("photo-1535632066927-ab7c9ab60908"),
    "Serving Tray": _unsplash("photo-1584308666744-24d5c474f2ae"),
    "Copper Bottle": _unsplash("photo-1584308666744-24d5c474f2ae"),
    "Cast Iron Skillet": _unsplash("photo-1584308666744-24d5c474f2ae"),
    # Accessories
    "Canvas Tote": _unsplash("photo-1566150905458-1bf1fc113f0d"),
    "Day Backpack": _unsplash("photo-1566150905458-1bf1fc113f0d"),
    "Leather Belt": _unsplash("photo-1566150905458-1bf1fc113f0d"),
    "Cotton Cap": _unsplash("photo-1566150905458-1bf1fc113f0d"),
    "Sunglasses": _unsplash("photo-1566150905458-1bf1fc113f0d"),
    "Silk Scarf": _unsplash("photo-1601924994987-69e26d50dc26"),
}


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
        low, high = spec["price"]
        # Weight prices toward the low end so monthly revenue stays realistic.
        price = round(random.triangular(low, high, low + (high - low) * 0.15), 2)

        name = f"{color} {item}"

        products.append(
            Product(
                name=name,
                category=category,
                description=_description(color, material, item, occasion),
                price=price,
                color=color,
                image_url=ITEM_IMAGES.get(item, _unsplash("photo-1598033129183-c4f50c736f10")),
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
    """Generate sales rows grouped into baskets (2-4 lines per order)."""
    ids = [p.id for p in products if p.id is not None]
    weight_values = [weights[i] for i in ids]
    price_by_id = {p.id: p.price for p in products if p.id is not None}

    today = date.today()
    records: list[SalesRecord] = []
    order_id = 0
    while len(records) < TARGET_SALES:
        order_id += 1
        lines = random.choices([2, 3, 4], weights=[50, 30, 20], k=1)[0]
        days_ago = random.randint(0, DAYS_OF_HISTORY - 1)
        sale_date = today - timedelta(days=days_ago)
        for _ in range(lines):
            if len(records) >= TARGET_SALES:
                break
            product_id = random.choices(ids, weights=weight_values, k=1)[0]
            quantity = random.choices([1, 2, 3], weights=[72, 20, 8], k=1)[0]
            discount = random.choice([1.0, 1.0, 1.0, 0.9, 0.85])
            revenue = round(price_by_id[product_id] * quantity * discount, 2)
            records.append(
                SalesRecord(
                    product_id=product_id,
                    quantity=quantity,
                    sale_date=sale_date,
                    revenue=revenue,
                    order_id=order_id,
                )
            )
    return records


def build_customers(count: int = 120) -> list[Customer]:
    """Generate customers spread across the three personas."""
    persona_ids = [p["id"] for p in PERSONAS]
    customers = []
    for i in range(count):
        name = CUSTOMER_NAMES[i % len(CUSTOMER_NAMES)]
        if i >= len(CUSTOMER_NAMES):
            name = f"{name} {i // len(CUSTOMER_NAMES) + 1}"
        customers.append(
            Customer(
                name=name,
                persona=random.choice(persona_ids),
                city=random.choice(CUSTOMER_CITIES),
            )
        )
    return customers


def main() -> None:
    db_path = settings.db_path
    print(f"Seeding database at: {db_path}")

    # Fresh start for a deterministic seed.
    Path(db_path).unlink(missing_ok=True)
    init_db(db_path)

    product_repo = SqliteProductRepository(db_path)
    sales_repo = SqliteSalesRepository(db_path)
    customer_repo = SqliteCustomerRepository(db_path)
    persona_repo = SqlitePersonaRepository(db_path)

    products = build_products()
    for product in products:
        product_repo.upsert(product)

    weights = assign_stock_and_popularity(products)
    # Persist the adjusted stock values.
    for product in products:
        product_repo.upsert(product)

    sales = build_sales(products, weights)
    sales_repo.add_many(sales)

    for spec in PERSONAS:
        persona_repo.upsert(Persona(**spec))
    customers = build_customers()
    customer_repo.add_many(customers)

    print(f"Inserted {product_repo.count()} products.")
    print(f"Inserted {sales_repo.count()} sales rows.")
    print(f"Inserted {customer_repo.count()} customers.")
    print(f"Inserted {len(persona_repo.list())} personas.")


if __name__ == "__main__":
    main()
