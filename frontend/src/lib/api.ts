import type {
  SearchResult,
  VisualSearchResult,
  ChatResponse,
  MerchantAskResponse,
  MerchantAlertsResponse
} from './types';
import {
  MOCK_PRODUCTS,
  MOCK_VISUAL_SEARCH_RESULTS,
  MOCK_CHAT_RESPONSES,
  MOCK_MERCHANT_ALERTS,
  MOCK_MERCHANT_ANSWERS
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
  limit = 20
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

  const response = await fetch(`${API_BASE_URL}/api/search?${params.toString()}`);
  if (!response.ok) throw new Error(`Search failed: ${response.statusText}`);
  return response.json();
}

export async function searchVisual(imageFile: File, hint?: string): Promise<VisualSearchResult> {
  if (getMockMode()) {
    await mockDelay(1000);
    return MOCK_VISUAL_SEARCH_RESULTS;
  }

  const formData = new FormData();
  formData.append('image', imageFile);
  if (hint) formData.append('hint', hint);

  const response = await fetch(`${API_BASE_URL}/api/search/visual`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error(`Visual search failed: ${response.statusText}`);
  return response.json();
}

export async function sendChat(sessionId: string, message: string): Promise<ChatResponse> {
  if (getMockMode()) {
    await mockDelay(800);
    const msg = message.toLowerCase();
    if (msg.includes('saree') || msg.includes('silk') || msg.includes('wedding')) {
      return MOCK_CHAT_RESPONSES.saree;
    }
    if (msg.includes('decor') || msg.includes('lamp') || msg.includes('bowl') || msg.includes('urli')) {
      return MOCK_CHAT_RESPONSES.decor;
    }
    return MOCK_CHAT_RESPONSES.default;
  }

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (!response.ok) throw new Error(`Chat failed: ${response.statusText}`);
  return response.json();
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

  if (!response.ok) throw new Error(`Merchant query failed: ${response.statusText}`);
  return response.json();
}

export async function getMerchantAlerts(): Promise<MerchantAlertsResponse> {
  if (getMockMode()) {
    await mockDelay(600);
    return MOCK_MERCHANT_ALERTS;
  }

  const response = await fetch(`${API_BASE_URL}/api/merchant/alerts`);
  if (!response.ok) throw new Error(`Merchant alerts failed: ${response.statusText}`);
  return response.json();
}
