import apiClient from "../apiClient";
import type { CategoryDetail, CategoryAllResponse, CategoryBookListResponse } from "@/types/api";
import type { Slide } from "./homeApi";

export const fetchBookCategoryAll = async (): Promise<CategoryDetail[]> => {
  try {
    const response = await apiClient.get<CategoryAllResponse>("/book-category/all");
    return response.data?.data || [];
  } catch {
    return [];
  }
};

export const fetchAllCategories = async (): Promise<CategoryDetail[]> => {
  try {
    const response = await apiClient.get<CategoryAllResponse>('/book-category/all');
    return response.data?.data ?? [];
  } catch {
    return [];
  }
};

export const fetchCategoryBooks = async (
  type: string,
  categoryId: string | number,
  tab: string = 'bestseller',
  page: number = 1,
  limit: number = 20,
  period?: string
): Promise<CategoryBookListResponse | null> => {
  try {
    const response = await apiClient.get<CategoryBookListResponse>(`/book-category/list`, {
      params: { type, categoryId, tab, limit, page, period }
    });
    return response.data;
  } catch {
    return null;
  }
};

export const fetchCategoryBanners = async (): Promise<Slide[]> => {
  try {
    const response = await apiClient.get<{ data?: Slide[] }>("/book-category/banner");
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch {
    return [];
  }
};

export interface ActiveType {
  type: string;
  label: string;
}

export interface ActiveCategory {
  id: string;
  name: string;
  color?: string;
  img_bg?: string;
  order_by?: number;
}

export const fetchActiveTypes = async (): Promise<ActiveType[]> => {
  try {
    const response = await apiClient.get<{ code: number; data: ActiveType[] }>('/active-types');
    return response.data?.data || [];
  } catch {
    return [];
  }
};

export const fetchActiveCategories = async (type: string = 'all'): Promise<ActiveCategory[]> => {
  try {
    const response = await apiClient.get<{ code: number; data: ActiveCategory[] }>('/active-categories', {
      params: { type }
    });
    return response.data?.data || [];
  } catch {
    return [];
  }
};
