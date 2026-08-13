
import type { ArticleResponse } from "@/types/api";
import { logApiError } from "@/utils/apiErrorLogger";

import apiClient from "../apiClient";
import { articleSchemas } from "./apiResponseSchemas";
import { validateApiPayload } from "./apiResponseValidation";

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
    const payload = validateApiPayload(articleSchemas.popular, response.data, "/articles/popular");
    return payload.data.list as unknown as PopularArticle[];
  } catch {
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

export const fetchLatestArticlesPage = async (
  page: number = 1,
  limit: number = 8,
): Promise<{ list: LatestArticle[]; pagination: ArticlePagination }> => {
  const response = await apiClient.get<LatestArticlesResponse>(`/articles?limit=${limit}&page=${page}`);
  const payload = validateApiPayload(articleSchemas.latest, response.data, "/articles");
  return payload.data as unknown as { list: LatestArticle[]; pagination: ArticlePagination };
};

export const fetchLatestArticles = async (page: number = 1, limit: number = 8): Promise<{ list: LatestArticle[]; pagination: ArticlePagination }> => {
  try {
    return await fetchLatestArticlesPage(page, limit);
  } catch (error) {
    logApiError(`fetchLatestArticles(page=${page}, limit=${limit})`, error);
    return { list: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  }
};

export const fetchArticleDetail = async (articleId: string | number): Promise<ArticleResponse | null> => {
  try {
    const response = await apiClient.get<ArticleResponse>(`/articles/${articleId}`);
    return validateApiPayload(articleSchemas.detail, response.data, `/articles/${articleId}`) as unknown as ArticleResponse;
  } catch {
    return null;
  }
};
