import apiClient from "../apiClient";

export interface SearchHistoryItem {
  id: number;
  user_id: number;
  keyword: string;
  normalized_keyword: string;
  search_count: number;
  last_searched_at: string;
  created_at: string;
  updated_at: string;
}

export interface PopularSearchItem {
  normalized_keyword: string;
  total_search: number;
  type?: string;
  is_pinned?: boolean;
}

export const getSearchHistory = async (): Promise<SearchHistoryItem[]> => {
  try {
    const response = await apiClient.get<{ code: number; status: string; message: string; data: SearchHistoryItem[] }>('/book/search/history');
    if (response.data?.code === 200) {
      return response.data.data || [];
    }
    return [];
  } catch {
    return [];
  }
};

export const deleteSearchHistory = async (id: number): Promise<boolean> => {
  try {
    const response = await apiClient.delete<{ code: number; status: string; message: string }>(`/book/search/history/${id}`);
    return response.data?.code === 200;
  } catch {
    return false;
  }
};

export const saveSearchHistory = async (keyword: string): Promise<boolean> => {
  try {
    const response = await apiClient.post<{ code: number; status: string; message: string }>('/book/search/history', { keyword });
    return response.data?.code === 200;
  } catch {
    return false;
  }
};

export const clearSearchHistory = async (): Promise<boolean> => {
  try {
    const response = await apiClient.delete<{ code: number; status: string; message: string }>('/book/search/history');
    return response.data?.code === 200;
  } catch {
    return false;
  }
};

export const fetchPopularSearches = async (limit: number = 5): Promise<PopularSearchItem[]> => {
  try {
    const response = await apiClient.get<{ code: number; status: string; message: string; data: PopularSearchItem[] }>('/book/search/popular', {
      params: { limit }
    });
    if (response.data?.code === 200) {
      return response.data.data || [];
    }
    return [];
  } catch {
    return [];
  }
};

export const fetchSearchSuggestions = async (query: string): Promise<PopularSearchItem[]> => {
  try {
    const response = await apiClient.get<{ code: number; status: string; message: string; data: PopularSearchItem[] }>('/book/search/suggest', {
      params: { q: query }
    });
    if (response.data?.code === 200) {
      return response.data.data || [];
    }
    return [];
  } catch {
    return [];
  }
};
