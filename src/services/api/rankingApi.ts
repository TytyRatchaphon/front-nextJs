
import apiClient from "../apiClient";
import { ArticlePagination } from "./articleApi";

export interface RankingBook {
  rank: number;
  book_id: number;
  name: string;
  img: string;
  user_id: number;
  view: number;
  end: string;
  status: string;
  tag?: string;
  img_full?: string;
  writer_name: string;
  chapter: number;
  shelve_count: number;
  isBestSeller: boolean;
  isNew: boolean;
  isNewEp: boolean;
  discount_ep_count?: number;
  title?: string;
}

export interface RankingResponse {
  code: number;
  status: string;
  message: string;
  data: {
    pagination: ArticlePagination;
    books: RankingBook[];
  };
}

export type RankingTimeRange = 'week' | 'month' | 'year' | 'all';

export const fetchRankingBooks = async (range: RankingTimeRange = 'week', page: number = 1, limit: number = 10, category_id?: number | string): Promise<{ books: RankingBook[]; pagination: ArticlePagination }> => {
  try {
    const response = await apiClient.get<RankingResponse>(`/books/ranks/${range}?limit=${limit}&page=${page}${category_id ? `&category_id=${category_id}` : ''}`);
    return response.data?.data || { books: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  } catch (error) {
    return { books: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  }
};

export interface RankingCategoryData {
  left: { id: number; name: string };
  right: { id: number; name: string };
}

export interface RankingCategoryResponse {
  code: number;
  status: string;
  message: string;
  data: RankingCategoryData;
}

export const fetchRankingCategories = async (): Promise<RankingCategoryData | null> => {
  try {
    const response = await apiClient.get<RankingCategoryResponse>("/books/ranking/categories");
    if (response.data && response.data.code === 200) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export interface CategoryRankingBookItem {
  rank: number;
  click_count: number;
  book_id: number;
  name: string;
  img: string;
  user_id: number;
  view: number;
  end: string;
  status: string;
  tag: string;
  img_full: string | null;
  bgimg: string | null;
  writer_name: string;
  chapter: number;
  shelve_count: number;
  isBestSeller: boolean;
  isNew: boolean;
  isNewEp: boolean;
  discount: number | null;
  discount_ep_count?: number;
}

export interface CategoryRankingBooksResponse {
  code: number;
  status: string;
  message: string;
  data: {
    pagination: any;
    range: number;
    categoryId: number;
    list_count: number;
    list: CategoryRankingBookItem[];
  };
}

export const fetchCategoryRankingBooks = async (categoryId: number, range: number | string, limit: number = 5): Promise<CategoryRankingBookItem[]> => {
  try {
    const url = `/books/ranking/${categoryId}/${range}?limit=${limit}`;
    const response = await apiClient.get<CategoryRankingBooksResponse>(url);

    if (response.data && response.data.code === 200 && response.data.data) {
      const list = response.data.data.list;
      if (Array.isArray(list)) {
        return list;
      }
      return [];
    }

    return [];
  } catch (error) {
    return [];
  }
};
