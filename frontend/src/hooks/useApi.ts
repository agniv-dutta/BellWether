import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getHealth,
  searchProducts,
  searchVisual,
  sendChat,
  askMerchant,
  getMerchantAlerts,
  getTrending,
  getCompleteLook,
  getMerchantOverview,
  getDemandGaps,
  getForecast
} from '../lib/api';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    staleTime: 60000,
  });
}

export function useSearchProducts(query = '', category = '', maxPrice?: number, personaId = '') {
  return useQuery({
    queryKey: ['search', query, category, maxPrice, personaId],
    queryFn: () => searchProducts(query, category, maxPrice, 20, personaId),
    staleTime: 30000,
    // The backend requires a non-empty query; skip until the user searches.
    enabled: query.trim().length > 0,
  });
}

export function useTrending(enabled = true) {
  return useQuery({
    queryKey: ['trending'],
    queryFn: () => getTrending(8),
    staleTime: 60000,
    enabled,
  });
}

export function useCompleteLook(productId: string, enabled = false) {
  return useQuery({
    queryKey: ['complete-the-look', productId],
    queryFn: () => getCompleteLook(productId, 4),
    staleTime: 60000,
    enabled,
  });
}

export function useVisualSearch() {
  return useMutation({
    mutationFn: ({ image, hint, personaId }: { image: File; hint?: string; personaId?: string }) =>
      searchVisual(image, hint, personaId ?? ''),
  });
}

export function useSendChat() {
  return useMutation({
    mutationFn: ({ sessionId, message, personaId }: { sessionId: string; message: string; personaId?: string }) =>
      sendChat(sessionId, message, personaId ?? ''),
  });
}

export function useMerchantAsk() {
  return useMutation({
    mutationFn: (question: string) => askMerchant(question),
  });
}

export function useMerchantAlerts() {
  return useQuery({
    queryKey: ['merchant-alerts'],
    queryFn: getMerchantAlerts,
    staleTime: 30000,
  });
}

export function useMerchantOverview() {
  return useQuery({
    queryKey: ['merchant-overview'],
    queryFn: getMerchantOverview,
    staleTime: 30000,
  });
}

export function useDemandGaps(days = 14) {
  return useQuery({
    queryKey: ['demand-gaps', days],
    queryFn: () => getDemandGaps(days),
    staleTime: 60000,
  });
}

export function useForecast(productId: string, enabled = false) {
  return useQuery({
    queryKey: ['forecast', productId],
    queryFn: () => getForecast(productId),
    staleTime: 60000,
    enabled,
  });
}
