import apiClient from "../apiClient";
import type { CategoryDetail, CategoryAllResponse, CategoryBookListResponse } from "@/types/api";
import type { Slide } from "./homeApi";
import { categorySchemas } from "./apiResponseSchemas";
import { validateApiPayload } from "./apiResponseValidation";

export const fetchBookCategoryAll = async (): Promise<CategoryDetail[]> => {
  try {
    const response = await apiClient.get<CategoryAllResponse>("/book-category/all");
    const payload = validateApiPayload(categorySchemas.all, response.data, "/book-category/all");
    return payload.data as unknown as CategoryDetail[];
  } catch {
    return [];
  }
};

export const fetchAllCategories = async (): Promise<CategoryDetail[]> => {
  try {
    const response = await apiClient.get<CategoryAllResponse>('/book-category/all');
    const payload = validateApiPayload(categorySchemas.all, response.data, "/book-category/all");
    return payload.data as unknown as CategoryDetail[];
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
    return validateApiPayload(categorySchemas.bookList, response.data, "/book-category/list") as unknown as CategoryBookListResponse;
  } catch {
    return null;
  }
};

export const fetchCategoryBanners = async (): Promise<Slide[]> => {
  try {
    const response = await apiClient.get<{ data?: Slide[] }>("/book-category/banner");
    const payload = validateApiPayload(categorySchemas.banners, response.data, "/book-category/banner");
    return payload.data as unknown as Slide[];
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
    const payload = validateApiPayload(categorySchemas.activeTypes, response.data, "/active-types");
    return payload.data as unknown as ActiveType[];
  } catch {
    return [];
  }
};

export const fetchActiveCategories = async (type: string = 'all'): Promise<ActiveCategory[]> => {
  try {
    const response = await apiClient.get<{ code: number; data: ActiveCategory[] }>('/active-categories', {
      params: { type }
    });
    const payload = validateApiPayload(categorySchemas.activeCategories, response.data, "/active-categories");
    return payload.data as unknown as ActiveCategory[];
  } catch {
    return [];
  }
};
