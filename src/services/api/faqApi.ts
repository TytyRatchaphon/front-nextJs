import apiClient from "../apiClient";

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export const fetchFaqs = async (): Promise<FaqItem[]> => {
  try {
    const response = await apiClient.get<{ code: number; data: FaqItem[] }>('/faq');
    return response.data?.data || [];
  } catch {
    return [];
  }
};
