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
  boosted?: boolean;
  reason?: string;
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

export interface AskInsight {
  headline: string;
  why: string;
  action: string;
}

export interface MerchantAskResponse {
  sql: string;
  columns: string[];
  rows: (string | number)[][];
  insight: AskInsight;
  chart_type: 'bar' | 'line' | 'pie' | 'table' | 'number';
  comparison_sql?: string;
  comparison_columns?: string[];
  comparison_rows?: (string | number)[][];
  delta_pct?: number | null;
}

export interface MerchantAlert {
  product: Product;
  stock: number;
  velocity: number; // units sold per day
  recommendation: string;
  days_until_out?: number | null;
}

export interface MerchantOverview {
  revenue_30d: number;
  revenue_prev_30d: number;
  revenue_delta_pct: number | null;
  units_30d: number;
  at_risk_count: number;
  unmet_demand_week: number;
}

export interface DemandGap {
  theme: string;
  query_count: number;
  example_queries: string[];
  suggested_action: string;
}

export interface DemandGapsResponse {
  gaps: DemandGap[];
}

export interface ForecastPoint {
  date: string;
  expected_units: number;
}

export interface ForecastResponse {
  product_id: number;
  days_of_cover: number | null;
  stockout_date: string | null;
  series: ForecastPoint[];
  recommendation: string;
}

export interface Persona {
  id: string;
  name: string;
  tag: string;
}

export interface MerchantAlertsResponse {
  alerts: MerchantAlert[];
}
