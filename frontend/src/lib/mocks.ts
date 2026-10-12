import type { Product, SearchResult, VisualSearchResult, ChatResponse, MerchantAskResponse, MerchantAlertsResponse } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    name: "Monsoon Chanderi Silk Saree",
    category: "Apparel",
    description: "Hand-woven Chanderi silk in twilight terracotta hues with subtle gold zari borders. Perfect for evening celebrations.",
    price: 18500,
    color: "Terracotta",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    stock: 4,
    score: 0.96,
    match_reason: "Matches your query for warm silk draped wear for festive evenings."
  },
  {
    id: "prod-002",
    name: "Raw Linen Relaxed Kurta",
    category: "Apparel",
    description: "Breathable unbleached organic linen shirt with coconut shell buttons and tailored mandarin collar.",
    price: 4200,
    color: "Apricot Cream",
    image_url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    stock: 14,
    score: 0.91,
    match_reason: "Soft organic textures with effortless relaxed silhouette."
  },
  {
    id: "prod-003",
    name: "Hand-Hammered Brass Urli Bowl",
    category: "Home & Craft",
    description: "Artisanal solid brass floating flower bowl handcrafted by traditional metal smiths of Moradabad.",
    price: 6800,
    color: "Warm Brass",
    image_url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80",
    stock: 3,
    score: 0.88,
    match_reason: "Warm metallic heirloom accents for entryway decor."
  },
  {
    id: "prod-004",
    name: "Kashmiri Papier-Mâché Jewellery Box",
    category: "Decor",
    description: "Intricately hand-painted lacquer box featuring traditional chinar leaf motifs in ruby red and coral.",
    price: 3500,
    color: "Hibiscus Pink",
    image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    stock: 9,
    score: 0.85,
    match_reason: "Artisanal keepsake storage with vibrant dye detailing."
  },
  {
    id: "prod-005",
    name: "Handloom Tussar Silk Stole",
    category: "Accessories",
    description: "Lightweight wild silk scarf with subtle fringed trim and natural peach hue variation.",
    price: 2900,
    color: "Peach Blush",
    image_url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80",
    stock: 22,
    score: 0.94,
    match_reason: "Versatile drape accentuating soft blush tones."
  },
  {
    id: "prod-006",
    name: "Terracotta Glazed Chai Kulhar Set",
    category: "Dining",
    description: "Set of six wood-fired ceramic tea cups featuring unglazed earthy rims and warm coral interior glaze.",
    price: 1800,
    color: "Earthy Rust",
    image_url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    stock: 2,
    score: 0.89,
    match_reason: "Hand-thrown pottery celebrating daily tea rituals."
  },
  {
    id: "prod-007",
    name: "Ajrakh Natural Dye Block Print Jacket",
    category: "Apparel",
    description: "Reversible quilted cotton jacket dyed using madder root and indigo substitute in timeless geometric patterns.",
    price: 8900,
    color: "Madder Red",
    image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    stock: 7,
    score: 0.92,
    match_reason: "Heritage block print tailored for contemporary layering."
  },
  {
    id: "prod-008",
    name: "Sandstone Carved Lotus Candle Holder",
    category: "Home & Craft",
    description: "Sculpted from Dholpur pink sandstone, this tealight holder projects petal-shaped shadow pools.",
    price: 2400,
    color: "Sandstone Pink",
    image_url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    stock: 18,
    score: 0.84,
    match_reason: "Subtle architectural mood lighting element."
  },
  {
    id: "prod-009",
    name: "Kanjivaram Zari Brocade Clutch",
    category: "Accessories",
    description: "Structured evening purse crafted from vintage silk sari borders with antiqued brass clasp.",
    price: 4600,
    color: "Vermilion Red",
    image_url: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80",
    stock: 5,
    score: 0.90,
    match_reason: "Upcycled luxury silk evening bag."
  },
  {
    id: "prod-010",
    name: "Rosewood & Brass Inlaid Tray",
    category: "Dining",
    description: "Solid Sheesham wood serving tray featuring fine floral brass inlay along the inner rim.",
    price: 5200,
    color: "Deep Oxblood",
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    stock: 11,
    score: 0.87,
    match_reason: "Substantial wooden tableware with metallic warmth."
  },
  {
    id: "prod-011",
    name: "Organic Khadi Cotton Throw Blanket",
    category: "Home & Craft",
    description: "Hand-spun khadi weave with tassel trim, dyed using pomegranate rind and hibiscus petals.",
    price: 3800,
    color: "Warm Flamingo",
    image_url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
    stock: 15,
    score: 0.93,
    match_reason: "Cozy artisanal textile for living spaces."
  },
  {
    id: "prod-012",
    name: "Meenakari Enamel Statement Drop Earrings",
    category: "Jewellery",
    description: "Hand-painted enamelled copper earrings studded with pearls and faceted ruby glass drops.",
    price: 7500,
    color: "Persimmon Red",
    image_url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
    stock: 3,
    score: 0.97,
    match_reason: "Signature jewellery piece featuring rich enamelling."
  }
];

export const MOCK_SEARCH_RESULTS: SearchResult = {
  results: MOCK_PRODUCTS
};

export const MOCK_VISUAL_SEARCH_RESULTS: VisualSearchResult = {
  attributes: {
    category: "Festive Ethnic Wear",
    color: "Terracotta & Warm Coral",
    style: ["Handloom", "Silk Drape", "Traditional Zari"],
    occasion: "Sunset Weddings & Evening Galas"
  },
  results: [
    MOCK_PRODUCTS[0],
    MOCK_PRODUCTS[4],
    MOCK_PRODUCTS[8],
    MOCK_PRODUCTS[11]
  ],
  explanations: {
    "prod-001": "Direct visual match on weave weight, terracotta tone, and gold metallic selvedge.",
    "prod-005": "Complements the drape structure with matching warm peach undertones.",
    "prod-009": "Echoes the traditional zari border motifs in an evening accessory.",
    "prod-012": "Harmonizes with the warm persimmon-red color palette."
  }
};

export const MOCK_CHAT_RESPONSES: Record<string, ChatResponse> = {
  default: {
    reply: "I found a few pieces that capture that warm, quiet elegance. The Monsoon Chanderi Silk Saree and the Meenakari Drop Earrings share the same sunset dye tones and hand-crafted feel.",
    products_mentioned: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[11]]
  },
  saree: {
    reply: "For a sunset wedding, the Chanderi Silk Saree drapes beautifully without feeling heavy. You can pair it with the Kanjivaram Brocade Clutch.",
    products_mentioned: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[8]]
  },
  decor: {
    reply: "If you're curating warm entryway pieces, the Hand-Hammered Brass Urli and Sandstone Lotus Candle Holder pair exceptionally well together.",
    products_mentioned: [MOCK_PRODUCTS[2], MOCK_PRODUCTS[7]]
  }
};

export const MOCK_MERCHANT_ALERTS: MerchantAlertsResponse = {
  alerts: [
    {
      product: MOCK_PRODUCTS[0],
      stock: 4,
      velocity: 3.2,
      recommendation: "Stock running critically low (4 remaining). Demand surged 45% following sunset wedding season feature. Reorder 15 units from Chanderi weavers immediately."
    },
    {
      product: MOCK_PRODUCTS[5],
      stock: 2,
      velocity: 4.8,
      recommendation: "Only 2 units in inventory. Highly viral item with 4.8 daily sales velocity. Reorder batch of 50."
    },
    {
      product: MOCK_PRODUCTS[2],
      stock: 3,
      velocity: 1.5,
      recommendation: "3 units remaining. Lead time for Moradabad brass artisans is 12 days. Place replenishment request today."
    },
    {
      product: MOCK_PRODUCTS[11],
      stock: 3,
      velocity: 2.1,
      recommendation: "3 pairs left. High search-to-cart conversion rate (28%). Increase safety stock threshold."
    }
  ]
};

export const MOCK_MERCHANT_ANSWERS: Record<string, MerchantAskResponse> = {
  default: {
    sql: "SELECT category, SUM(price * stock) AS total_inventory_value, COUNT(*) AS product_count FROM products GROUP BY category ORDER BY total_inventory_value DESC;",
    columns: ["category", "total_inventory_value", "product_count"],
    rows: [
      ["Apparel", 168400, 3],
      ["Jewellery", 22500, 1],
      ["Home & Craft", 71600, 3],
      ["Accessories", 37500, 2],
      ["Dining", 60800, 2],
      ["Decor", 31500, 1]
    ],
    insight: "Apparel holds your highest inventory valuation at ₹1,68,400 across 3 active SKUs, led by the high-value Chanderi Silk Saree collection. Home & Craft represents your second largest stock category.",
    chart_type: "bar"
  },
  "stockout": {
    sql: "SELECT name, category, stock, price FROM products WHERE stock < 5 ORDER BY stock ASC;",
    columns: ["name", "category", "stock", "price"],
    rows: [
      ["Terracotta Glazed Chai Kulhar Set", "Dining", 2, 1800],
      ["Hand-Hammered Brass Urli Bowl", "Home & Craft", 3, 6800],
      ["Meenakari Enamel Statement Drop Earrings", "Jewellery", 3, 7500],
      ["Monsoon Chanderi Silk Saree", "Apparel", 4, 18500]
    ],
    insight: "4 high-velocity products are at high risk of stockout within 72 hours. Terracotta Chai Kulhar Set has only 2 units remaining.",
    chart_type: "table"
  },
  "revenue": {
    sql: "SELECT strftime('%Y-%m', sale_date) AS month, SUM(amount) AS revenue FROM sales GROUP BY month ORDER BY month DESC LIMIT 6;",
    columns: ["month", "revenue"],
    rows: [
      ["2026-03", 425000],
      ["2026-02", 380000],
      ["2026-01", 310000],
      ["2025-12", 490000],
      ["2025-11", 410000],
      ["2025-10", 290000]
    ],
    insight: "Monthly revenue peaked in December 2025 at ₹4,90,000 during festive shopping, with steady 11.8% month-over-month growth through Q1 2026.",
    chart_type: "line"
  }
};
