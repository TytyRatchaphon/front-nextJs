
import apiClient from "../apiClient";
import type { ArticleResponse } from "@/types/api";
import { cachedRequest } from "../requestCache";

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
    return await cachedRequest<PopularArticle[]>(
      'articles:popular',
      async () => {
        const response = await apiClient.get<{ code: number; status: string; data: { list: PopularArticle[] } }>("/articles/popular");
        return response.data?.data?.list || [];
      },
      { ttlMs: 2 * 60 * 1000 }
    );
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

export const fetchLatestArticles = async (page: number = 1, limit: number = 8): Promise<{ list: LatestArticle[]; pagination: ArticlePagination }> => {
  try {
    return await cachedRequest<{ list: LatestArticle[]; pagination: ArticlePagination }>(
      `articles:latest:${page}:${limit}`,
      async () => {
        const response = await apiClient.get<LatestArticlesResponse>(`/articles?limit=${limit}&page=${page}`);
        return response.data?.data || { list: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
      },
      { ttlMs: 60 * 1000 }
    );
  } catch {
    return { list: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  }
};

export const fetchArticleDetail = async (articleId: string | number): Promise<ArticleResponse | null> => {
  try {
    return await cachedRequest<ArticleResponse | null>(
      `articles:detail:${articleId}`,
      async () => {
        const response = await apiClient.get<ArticleResponse>(`/articles/${articleId}`);
        return response.data || null;
      },
      {
        ttlMs: 60 * 1000,
        shouldCache: (value) => value !== null,
      }
    );
  } catch {
    return null;
  }
};
