import type {
  Product,
  SearchResult,
  VisualSearchResult,
  ChatResponse,
  MerchantAskResponse,
  MerchantAlertsResponse,
  MerchantOverview,
  DemandGapsResponse
} from './types';

function img(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&q=80`;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'mock-001',
    name: 'Terracotta Linen Shirt',
    category: 'Apparel',
    description: 'A breathable terracotta linen shirt, cut relaxed for everyday wear.',
    price: 1499,
    color: 'Terracotta',
    image_url: img('photo-1598033129183-c4f50c736f10'),
    stock: 14,
    score: 0.94,
    match_reason: 'Relaxed linen weave in warm sunset tones.'
  },
  {
    id: 'mock-002',
    name: 'Ivory Everyday Sneakers',
    category: 'Footwear',
    description: 'Clean ivory canvas sneakers with cushioned soles for all-day wear.',
    price: 2499,
    color: 'Ivory',
    image_url: img('photo-1544441893-675973e31985'),
    stock: 22,
    score: 0.91,
    match_reason: 'Goes with everything, from denim to dresses.'
  },
  {
    id: 'mock-003',
    name: 'Sandstone Ceramic Table Lamp',
    category: 'Home & Living',
    description: 'A sandstone ceramic lamp that pools warm light in a reading corner.',
    price: 3299,
    color: 'Sandstone Pink',
    image_url: img('photo-1507652313519-d4e9174996dd'),
    stock: 7,
    score: 0.89,
    match_reason: 'Warm glow sized for a small reading corner.'
  },
  {
    id: 'mock-004',
    name: 'Ochre Clay Mask Kit',
    category: 'Beauty',
    description: 'Kaolin clay mask kit with almond oil for a gentle Sunday reset.',
    price: 899,
    color: 'Ochre',
    image_url: img('photo-1630019852942-f89202989a59'),
    stock: 30,
    score: 0.86,
    match_reason: 'Gentle weekly ritual for dry winter air.'
  },
  {
    id: 'mock-005',
    name: 'Warm Brass Copper Bottle',
    category: 'Kitchen',
    description: 'A warm brass copper bottle for daily rituals, 1 litre.',
    price: 1199,
    color: 'Warm Brass',
    image_url: img('photo-1584308666744-24d5c474f2ae'),
    stock: 4,
    score: 0.93,
    match_reason: 'Keeps water cool the traditional way.'
  },
  {
    id: 'mock-006',
    name: 'Natural Beige Canvas Tote',
    category: 'Accessories',
    description: 'A sturdy natural beige tote that fits groceries and a novel.',
    price: 799,
    color: 'Natural Beige',
    image_url: img('photo-1566150905458-1bf1fc113f0d'),
    stock: 40,
    score: 0.88,
    match_reason: 'Carries the everyday without trying.'
  },
  {
    id: 'mock-007',
    name: 'Rust Knit Sweater',
    category: 'Apparel',
    description: 'A rust knit sweater in soft cotton for winter layering.',
    price: 1999,
    color: 'Deep Rust',
    image_url: img('photo-1601924994987-69e26d50dc26'),
    stock: 3,
    score: 0.9,
    match_reason: 'Layers kindly over shirts and tees.'
  },
  {
    id: 'mock-008',
    name: 'Henna Cotton Dhurrie',
    category: 'Home & Living',
    description: 'A handwoven henna cotton dhurrie for the living room floor.',
    price: 4599,
    color: 'Henna',
    image_url: img('photo-1584100936595-c0654b55a2e2'),
    stock: 6,
    score: 0.85,
    match_reason: 'Grounds a room in warm earth tones.'
  },
  {
    id: 'mock-009',
    name: 'Almond Chai Kulhar Set',
    category: 'Kitchen',
    description: 'Set of six almond terracotta kulhars for slow evening chai.',
    price: 699,
    color: 'Almond',
    image_url: img('photo-1578749556568-bc2c40e68b61'),
    stock: 2,
    score: 0.92,
    match_reason: 'Hand-thrown cups for daily tea rituals.'
  },
  {
    id: 'mock-010',
    name: 'Cocoa Leather Belt',
    category: 'Accessories',
    description: 'A cocoa leather belt with a brushed brass buckle.',
    price: 1099,
    color: 'Cocoa',
    image_url: img('photo-1566150905458-1bf1fc113f0d'),
    stock: 18,
    score: 0.84,
    match_reason: 'Finishes trousers and denim alike.'
  },
  {
    id: 'mock-011',
    name: 'Marigold Bath Salt Trio',
    category: 'Beauty',
    description: 'Three marigold bath salts with turmeric and almond oil.',
    price: 649,
    color: 'Marigold',
    image_url: img('photo-1578749556568-bc2c40e68b61'),
    stock: 25,
    score: 0.83,
    match_reason: 'A small gift for someone who soaks.'
  },
  {
    id: 'mock-012',
    name: 'Brass Wall Mirror',
    category: 'Home & Living',
    description: 'A round brass-framed mirror that doubles morning light.',
    price: 5499,
    color: 'Warm Brass',
    image_url: img('photo-1615529182904-14819c35db37'),
    stock: 5,
    score: 0.87,
    match_reason: 'Opens up small rooms and dark corners.'
  }
];

export const MOCK_TRENDING: Product[] = [
  MOCK_PRODUCTS[4],
  MOCK_PRODUCTS[0],
  MOCK_PRODUCTS[1],
  MOCK_PRODUCTS[8],
  MOCK_PRODUCTS[2],
  MOCK_PRODUCTS[6],
  MOCK_PRODUCTS[11],
  MOCK_PRODUCTS[5]
];

export const MOCK_SEARCH_RESULTS: SearchResult = {
  results: MOCK_PRODUCTS
};

export const MOCK_VISUAL_SEARCH_RESULTS: VisualSearchResult = {
  attributes: {
    category: 'Apparel',
    color: 'Terracotta',
    style: ['Relaxed', 'Linen', 'Everyday'],
    occasion: 'Weekend mornings'
  },
  results: [
    MOCK_PRODUCTS[0],
    MOCK_PRODUCTS[6],
    MOCK_PRODUCTS[1],
    MOCK_PRODUCTS[5]
  ],
  explanations: {
    'mock-001': 'Direct visual match on the relaxed weave and terracotta tone.',
    'mock-007': 'Same warm rust family in a winter layer.',
    'mock-002': 'Pairs with the easy weekend silhouette.',
    'mock-006': 'Completes the casual daytime look.'
  }
};

export const MOCK_CHAT_RESPONSES: Record<string, ChatResponse> = {
  default: {
    reply:
      'I found a few pieces that share that warm, easy feeling. The Terracotta Linen Shirt and the Ivory Everyday Sneakers are an effortless pair. Want to see more in these tones?',
    products_mentioned: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]]
  },
  shirt: {
    reply:
      'For an easy weekend, the Terracotta Linen Shirt works untucked or layered. The Rust Knit Sweater goes over it on cooler evenings. Which fit do you prefer?',
    products_mentioned: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[6]]
  },
  home: {
    reply:
      'For a small reading corner, the Sandstone Ceramic Table Lamp pools light exactly where you need it. The Henna Cotton Dhurrie grounds the space. Shall I find more for that corner?',
    products_mentioned: [MOCK_PRODUCTS[2], MOCK_PRODUCTS[7]]
  }
};

export const MOCK_MERCHANT_ALERTS: MerchantAlertsResponse = {
  alerts: [
    {
      product: MOCK_PRODUCTS[8],
      stock: 2,
      velocity: 4.8,
      recommendation: 'Only 2 sets left at 4.8 sales a day. Reorder 50 sets now.',
      days_until_out: 0.4
    },
    {
      product: MOCK_PRODUCTS[4],
      stock: 4,
      velocity: 3.2,
      recommendation: '4 bottles left and demand rising. Reorder 40 units this week.',
      days_until_out: 1.3
    },
    {
      product: MOCK_PRODUCTS[6],
      stock: 3,
      velocity: 1.5,
      recommendation: '3 sweaters left as winter demand builds. Reorder 25 units.',
      days_until_out: 2.0
    },
    {
      product: MOCK_PRODUCTS[11],
      stock: 5,
      velocity: 2.1,
      recommendation: '5 mirrors left with strong conversion. Raise the safety threshold.',
      days_until_out: 2.4
    }
  ]
};

export const MOCK_MERCHANT_OVERVIEW: MerchantOverview = {
  revenue_30d: 2845000,
  revenue_prev_30d: 2510000,
  revenue_delta_pct: 13.3,
  units_30d: 2140,
  at_risk_count: 4,
  unmet_demand_week: 47
};

export const MOCK_DEMAND_GAPS: DemandGapsResponse = {
  gaps: [
    {
      theme: 'Linen co-ord sets',
      query_count: 47,
      example_queries: ['linen co-ord set', 'matching linen set', 'co-ord set plus size'],
      suggested_action: 'Source 2-3 linen co-ord sets in core sizes before the weekend.'
    },
    {
      theme: 'Wireless earbuds under ₹1,500',
      query_count: 31,
      example_queries: ['wireless earbuds under 1500', 'cheap earbuds', 'bluetooth earphones'],
      suggested_action: 'Electronics sit outside the catalog — consider a curated partner shelf.'
    },
    {
      theme: 'Yoga mats',
      query_count: 18,
      example_queries: ['yoga mat', 'exercise mat', 'non-slip mat'],
      suggested_action: 'Add a small fitness corner: mats plus steel bottles you already stock.'
    }
  ]
};

export const MOCK_MERCHANT_ANSWERS: Record<string, MerchantAskResponse> = {
  default: {
    sql: 'SELECT category, SUM(revenue) AS total_revenue, COUNT(*) AS lines FROM sales JOIN products ON sales.product_id = products.id GROUP BY category ORDER BY total_revenue DESC;',
    columns: ['category', 'total_revenue', 'lines'],
    rows: [
      ['Apparel', 684000, 820],
      ['Footwear', 592000, 640],
      ['Home & Living', 518000, 590],
      ['Kitchen', 402000, 610],
      ['Accessories', 356000, 640],
      ['Beauty', 293000, 700]
    ],
    insight: {
      headline: 'Apparel leads at ₹6.84L, about 15% ahead of Footwear at ₹5.92L.',
      why: 'Shirts and co-ord sets sell steadily through the week with the highest repeat rate.',
      action: 'Restock the top 3 Apparel lines before the weekend rush.'
    },
    chart_type: 'bar'
  },
  stockout: {
    sql: 'SELECT name, category, stock, price FROM products WHERE stock < 5 ORDER BY stock ASC;',
    columns: ['name', 'category', 'stock', 'price'],
    rows: [
      ['Almond Chai Kulhar Set', 'Kitchen', 2, 699],
      ['Rust Knit Sweater', 'Apparel', 3, 1999],
      ['Warm Brass Copper Bottle', 'Kitchen', 4, 1199],
      ['Brass Wall Mirror', 'Home & Living', 5, 5499]
    ],
    insight: {
      headline: '4 products sit under 6 units, led by the Chai Kulhar Set at just 2 left.',
      why: 'Kitchen lines are moving 3x faster than their safety stock assumes.',
      action: 'Place the kulhar and copper bottle reorder today.'
    },
    chart_type: 'table'
  },
  revenue: {
    sql: "SELECT strftime('%Y-%m', sale_date) AS month, SUM(revenue) AS revenue FROM sales GROUP BY month ORDER BY month DESC LIMIT 6;",
    columns: ['month', 'revenue'],
    rows: [
      ['2026-09', 2845000],
      ['2026-08', 2510000],
      ['2026-07', 2230000],
      ['2026-06', 2470000],
      ['2026-05', 1980000],
      ['2026-04', 1740000]
    ],
    insight: {
      headline: 'September revenue hit ₹28.45L, up 13.3% over August.',
      why: 'Festive hosting drove Kitchen and Home & Living to their best month yet.',
      action: 'Carry the hosting assortment into October with deeper lamp stock.'
    },
    chart_type: 'line',
    comparison_sql: "SELECT strftime('%Y-%m', sale_date) AS month, SUM(revenue) AS revenue FROM sales GROUP BY month ORDER BY month DESC LIMIT 6 OFFSET 6;",
    comparison_columns: ['month', 'revenue'],
    comparison_rows: [['2026-03', 1620000]],
    delta_pct: 13.3
  }
};
