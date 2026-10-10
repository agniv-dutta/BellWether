import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getHealth,
  searchProducts,
  searchVisual,
  sendChat,
  askMerchant,
  getMerchantAlerts
} from '../lib/api';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    staleTime: 60000,
  });
}

export function useSearchProducts(query = '', category = '', maxPrice?: number) {
  return useQuery({
    queryKey: ['search', query, category, maxPrice],
    queryFn: () => searchProducts(query, category, maxPrice),
    staleTime: 30000,
  });
}

export function useVisualSearch() {
  return useMutation({
    mutationFn: ({ image, hint }: { image: File; hint?: string }) => searchVisual(image, hint),
  });
}

export function useSendChat() {
  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      sendChat(sessionId, message),
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
