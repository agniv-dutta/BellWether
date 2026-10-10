export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  color: string;
  image_url: string;
  stock: number;
  score?: number;
  match_reason?: string;
}

export interface SearchResult {
  results: Product[];
}

export interface VisualSearchResult {
  attributes: {
    category: string;
    color: string;
    style: string[];
    occasion: string;
  };
  results: Product[];
  explanations: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products_mentioned?: Product[];
  timestamp?: string;
}

export interface ChatRequest {
  session_id: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  products_mentioned: Product[];
}

export interface MerchantAskRequest {
  question: string;
}

export interface MerchantAskResponse {
  sql: string;
  columns: string[];
  rows: (string | number)[][];
  insight: string;
  chart_type: 'bar' | 'line' | 'pie' | 'table';
}

export interface MerchantAlert {
  product: Product;
  stock: number;
  velocity: number; // units sold per day
  recommendation: string;
}

export interface MerchantAlertsResponse {
  alerts: MerchantAlert[];
}
