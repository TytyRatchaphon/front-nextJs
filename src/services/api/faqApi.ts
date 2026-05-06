import apiClient from "../apiClient";
import { cachedRequest } from "../requestCache";

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export const fetchFaqs = async (): Promise<FaqItem[]> => {
  try {
    return await cachedRequest<FaqItem[]>(
      'faq:list',
      async () => {
        const response = await apiClient.get<{ code: number; data: FaqItem[] }>('/faq');
        return response.data?.data || [];
      },
      { ttlMs: 10 * 60 * 1000 }
    );
  } catch {
    return [];
  }
};
