import type {
  Product,
  SearchResult,
  VisualSearchResult,
  ChatResponse,
  MerchantAskResponse,
  MerchantAlertsResponse,
  MerchantAlert,
  MerchantOverview,
  DemandGapsResponse,
  ForecastResponse
} from './types';
import {
  MOCK_PRODUCTS,
  MOCK_VISUAL_SEARCH_RESULTS,
  MOCK_CHAT_RESPONSES,
  MOCK_MERCHANT_ALERTS,
  MOCK_MERCHANT_ANSWERS,
  MOCK_MERCHANT_OVERVIEW,
  MOCK_DEMAND_GAPS,
  MOCK_TRENDING
} from './mocks';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function getMockMode(): boolean {
  const stored = localStorage.getItem('bellwether_use_mocks');
  if (stored !== null) {
    return stored === 'true';
  }
  return import.meta.env.VITE_USE_MOCKS === 'true';
}

export function setMockMode(enabled: boolean): void {
  localStorage.setItem('bellwether_use_mocks', String(enabled));
}

async function mockDelay(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type RawProduct = Partial<Product> & {
  id?: string | number;
  similarity?: number;
  explanation?: string;
  note?: string;
};

// The backend uses integer ids; the UI works with string ids. Normalise here so
// components and React keys stay consistent whether data is mocked or live.
function normalizeProduct(raw: RawProduct): Product {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    category: raw.category ?? '',
    description: raw.description ?? '',
    price: Number(raw.price ?? 0),
    color: raw.color ?? '',
    image_url: raw.image_url ?? '',
    stock: Number(raw.stock ?? 0),
    score: raw.score ?? raw.similarity ?? undefined,
    match_reason: raw.match_reason ?? raw.note ?? raw.explanation ?? undefined,
    boosted: raw.boosted ?? undefined,
    reason: raw.reason ?? undefined,
  };
}

async function extractError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  } catch {
    /* ignore non-JSON bodies */
  }
  return `${fallback}: ${response.status} ${response.statusText}`;
}

export async function getHealth(): Promise<{ status: string; project?: string }> {
  if (getMockMode()) {
    await mockDelay(300);
    return { status: 'ok', project: 'bellwether-mock-env' };
  }
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error(`Health check failed: ${response.statusText}`);
  return response.json();
}

export async function searchProducts(
  query = '',
  category = '',
  maxPrice?: number,
  limit = 20,
  personaId = ''
): Promise<SearchResult> {
  if (getMockMode()) {
    await mockDelay();
    let filtered = [...MOCK_PRODUCTS];

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) ||
               p.description.toLowerCase().includes(q) ||
               p.category.toLowerCase().includes(q) ||
               p.color.toLowerCase().includes(q)
      );
    }

    if (category) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (maxPrice && maxPrice > 0) {
      filtered = filtered.filter((p) => p.price <= maxPrice);
    }

    return { results: filtered.slice(0, limit) };
  }

  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (category) params.append('category', category);
  if (maxPrice) params.append('max_price', String(maxPrice));
  if (limit) params.append('limit', String(limit));
  if (personaId) params.append('persona_id', personaId);

  const response = await fetch(`${API_BASE_URL}/api/search?${params.toString()}`);
  if (!response.ok) throw new Error(await extractError(response, 'Search failed'));
  const data = await response.json();
  return { results: (data.results ?? []).map(normalizeProduct) };
}

export async function searchVisual(imageFile: File, hint?: string, personaId = ''): Promise<VisualSearchResult> {
  if (getMockMode()) {
    await mockDelay(1000);
    return MOCK_VISUAL_SEARCH_RESULTS;
  }

  const formData = new FormData();
  formData.append('image', imageFile);
  if (hint) formData.append('hint', hint);
  if (personaId) formData.append('persona_id', personaId);

  const response = await fetch(`${API_BASE_URL}/api/search/visual`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error(await extractError(response, 'Visual search failed'));
  const data = await response.json();
  const explanations: Record<string, string> = data.explanations ?? {};
  const results = (data.results ?? []).map((raw: RawProduct) =>
    normalizeProduct({
      ...raw,
      match_reason: raw.match_reason ?? explanations[String(raw.id)] ?? undefined,
    })
  );
  return {
    attributes: {
      category: data.attributes?.category ?? '',
      color: data.attributes?.color ?? '',
      style: data.attributes?.style ?? [],
      occasion: data.attributes?.occasion ?? '',
    },
    results,
    explanations,
  };
}

export async function sendChat(sessionId: string, message: string, personaId = ''): Promise<ChatResponse> {
  if (getMockMode()) {
    await mockDelay(800);
    const msg = message.toLowerCase();
    if (msg.includes('shirt') || msg.includes('linen') || msg.includes('sweater') || msg.includes('apparel')) {
      return MOCK_CHAT_RESPONSES.shirt;
    }
    if (msg.includes('lamp') || msg.includes('home') || msg.includes('corner') || msg.includes('candle')) {
      return MOCK_CHAT_RESPONSES.home;
    }
    return MOCK_CHAT_RESPONSES.default;
  }

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message, persona_id: personaId }),
  });

  if (!response.ok) throw new Error(await extractError(response, 'Chat failed'));
  const data = await response.json();
  return {
    reply: data.reply ?? '',
    products_mentioned: (data.products_mentioned ?? []).map(normalizeProduct),
  };
}

export async function askMerchant(question: string): Promise<MerchantAskResponse> {
  if (getMockMode()) {
    await mockDelay(900);
    const q = question.toLowerCase();
    if (q.includes('stockout') || q.includes('run out') || q.includes('low stock')) {
      return MOCK_MERCHANT_ANSWERS.stockout;
    }
    if (q.includes('revenue') || q.includes('month') || q.includes('sales')) {
      return MOCK_MERCHANT_ANSWERS.revenue;
    }
    return MOCK_MERCHANT_ANSWERS.default;
  }

  const response = await fetch(`${API_BASE_URL}/api/merchant/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) throw new Error(await extractError(response, 'Merchant query failed'));
  return response.json();
}

export async function getMerchantAlerts(): Promise<MerchantAlertsResponse> {
  if (getMockMode()) {
    await mockDelay(600);
    return MOCK_MERCHANT_ALERTS;
  }

  const response = await fetch(`${API_BASE_URL}/api/merchant/alerts`);
  if (!response.ok) throw new Error(await extractError(response, 'Merchant alerts failed'));
  const data = await response.json();
  const alerts: MerchantAlert[] = (data.alerts ?? []).map(
    (alert: { product: RawProduct; stock: number; velocity: number; recommendation?: string; days_until_out?: number | null }) => ({
      product: normalizeProduct(alert.product),
      stock: Number(alert.stock ?? 0),
      velocity: Number(alert.velocity ?? 0),
      recommendation: alert.recommendation ?? '',
      days_until_out: alert.days_until_out ?? null,
    })
  );
  return { alerts };
}

export async function getTrending(limit = 8): Promise<SearchResult> {
  if (getMockMode()) {
    await mockDelay(500);
    return { results: MOCK_TRENDING.slice(0, limit) };
  }
  const response = await fetch(`${API_BASE_URL}/api/products/trending?limit=${limit}`);
  if (!response.ok) throw new Error(await extractError(response, 'Trending failed'));
  const data = await response.json();
  return { results: (data.results ?? []).map(normalizeProduct) };
}

export async function getCompleteLook(productId: string, limit = 4): Promise<SearchResult> {
  if (getMockMode()) {
    await mockDelay(500);
    return { results: MOCK_PRODUCTS.slice(0, limit) };
  }
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/complete-the-look?limit=${limit}`);
  if (!response.ok) throw new Error(await extractError(response, 'Complete the look failed'));
  const data = await response.json();
  return { results: (data.results ?? []).map(normalizeProduct) };
}

export async function getMerchantOverview(): Promise<MerchantOverview> {
  if (getMockMode()) {
    await mockDelay(600);
    return MOCK_MERCHANT_OVERVIEW;
  }
  const response = await fetch(`${API_BASE_URL}/api/merchant/overview`);
  if (!response.ok) throw new Error(await extractError(response, 'Overview failed'));
  return response.json();
}

export async function getDemandGaps(days = 14): Promise<DemandGapsResponse> {
  if (getMockMode()) {
    await mockDelay(700);
    return MOCK_DEMAND_GAPS;
  }
  const response = await fetch(`${API_BASE_URL}/api/merchant/demand-gaps?days=${days}`);
  if (!response.ok) throw new Error(await extractError(response, 'Demand gaps failed'));
  return response.json();
}

export async function getForecast(productId: string): Promise<ForecastResponse> {
  if (getMockMode()) {
    await mockDelay(500);
    return {
      product_id: Number(productId) || 0,
      days_of_cover: 12.5,
      stockout_date: null,
      series: [],
      recommendation: 'Stock looks comfortable for the next fortnight.',
    };
  }
  const response = await fetch(`${API_BASE_URL}/api/merchant/forecast?product_id=${productId}`);
  if (!response.ok) throw new Error(await extractError(response, 'Forecast failed'));
  return response.json();
}
