
import apiClient from "../apiClient";
import type { ArticleResponse } from "@/types/api";

export interface PopularArticle {
  id: number;
  name: string;
  img: string;
  post_by?: string;
  title: string;
  view: number;
  update_at: string;
}

export const fetchPopularArticles = async (): Promise<PopularArticle[]> => {
  try {
    const response = await apiClient.get<{ code: number; status: string; data: { list: PopularArticle[] } }>("/articles/popular");
    return response.data?.data?.list || [];
  } catch (error) {
    return [];
  }
};

export interface ArticlePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}

export interface LatestArticle {
  id: number;
  name: string;
  img: string;
  view: number;
  update_at: string;
}

export interface LatestArticlesResponse {
  code: number;
  status: string;
  message: string;
  data: {
    pagination: ArticlePagination;
    list: LatestArticle[];
  };
}

export const fetchLatestArticles = async (page: number = 1, limit: number = 8): Promise<{ list: LatestArticle[]; pagination: ArticlePagination }> => {
  try {
    const response = await apiClient.get<LatestArticlesResponse>(`/articles?limit=${limit}&page=${page}`);
    return response.data?.data || { list: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  } catch (error) {
    return { list: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  }
};

export const fetchArticleDetail = async (articleId: string | number): Promise<ArticleResponse | null> => {
  try {
    const response = await apiClient.get<ArticleResponse>(`/articles/${articleId}`);
    return response.data;
  } catch (error) {
    return null;
  }
};
