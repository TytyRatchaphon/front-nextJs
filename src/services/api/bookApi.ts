
import apiClient from "../apiClient";
import type { BookTrans, BookDetail, BookDetailResponse, BookPurchaseDetailsResponse, LatestReadEpisodeResponse, BookPromotionOption } from "@/types/api";

export const fetchBookTrans = async (): Promise<BookTrans[]> => {
  try {
    const response = await apiClient.get<{ data: BookTrans[] }>("/getAllBookHome");
    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }
    return response.data;
  } catch {
    return [];
  }
}

export const fetchBookTransById = async (id: string): Promise<BookTrans> => {
  try {
    const response = await apiClient.get(`/book/${id}`);

    if (!response.data) {
      throw new Error('ไม่พบข้อมูลจาก API');
    }

    if (Array.isArray(response.data.data)) {
      if (response.data.data.length === 0) {
        throw new Error('ไม่พบข้อมูลหนังสือ');
      }
      return response.data.data[0];
    }

    if (response.data.data && response.data.data.book) {
      return response.data.data.book;
    }

    if (response.data.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }

    throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');

  } catch (error) {
    throw error;
  }
};

export const fetchBookDetail = async (bookId: string): Promise<BookDetail> => {
  try {
    try {
      const resp = await apiClient.get(`/bookdetail/${bookId}`);
      if (resp?.data) {
        const payload = resp.data.data ?? resp.data;
        if (payload) {
          return payload as BookDetail;
        }
      }
    } catch {
    }

    const response = await apiClient.get<BookDetailResponse>(`/bookdetail/${bookId}`);
    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('ไม่พบข้อมูลหนังสือ');
  } catch (error) {
    throw error;
  }
};

export const fetchMyBookDetail = async (bookId: string): Promise<BookDetail> => {
  try {
    try {
      const resp = await apiClient.get(`/bookdetail/${bookId}`);
      if (resp?.data) {
        const payload = resp.data.data ?? resp.data;
        if (payload) {
          return payload as BookDetail;
        }
      }
    } catch {
    }

    const response = await apiClient.get<BookDetailResponse>(`/bookdetail/${bookId}`);
    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('ไม่พบข้อมูลหนังสือ');
  } catch (error) {
    throw error;
  }
};

export const fetchBookEpisodes = async (bookId: string | number) => {
  try {
    const response = await apiClient.get(`/bookgroup/${bookId}`);

    if (response.data && response.data.code === 200 && response.data.data) {
      const groups = response.data.data.groups || [];

      if (groups.length > 0 && groups[0].list && groups[0].list.length > 0) {
      }

      return response.data.data;
    }

    throw new Error('ไม่พบข้อมูลตอน');
  } catch (error: any) {

    if (error.response) {
    }

    throw error;
  }
};

export const fetchBookPurchaseDetails = async (bookId: string | number) => {
  try {
    const response = await apiClient.get<BookPurchaseDetailsResponse>(`/bookdetail/purchase/${bookId}`);
    return response.data?.data;
  } catch {
    return null;
  }
};

export interface BookRecommendationResponse {
  code: number;
  status: string;
  message: string;
  data: any[];
}

export const fetchBookRecommendation = async (bookId: string | number): Promise<any[]> => {
  try {
    const response = await apiClient.get<BookRecommendationResponse>(`/bookdetail/recommend/${bookId}`, {
      params: { limit: 5 }
    });
    
    if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
        return response.data.data;
    }
    return [];
  } catch {
    return [];
  }
};

export const fetchBookPromotionOptions = async (bookId: number): Promise<BookPromotionOption[]> => {
  try {
    const response = await apiClient.get<any>(`/pack-campaign/buying-options/${bookId}`);

    if (response.data && response.data.code === 200 && response.data.data) {
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    }
    return [];
  } catch {
    return [];
  }
};

export interface NovelPackCheckData {
  btn_novel: number | null;
  btn_novel_pack: number | null;
  content_type: 'novel' | 'novel_pack' | string;
}

export const fetchNovelPackCheck = async (bookId: string | number): Promise<NovelPackCheckData | null> => {
  try {
    const response = await apiClient.get(`/check-novel-pack/${bookId}`);
    const payload = response?.data?.data;
    if (!payload) return null;
    return {
      btn_novel: payload.btn_novel ?? null,
      btn_novel_pack: payload.btn_novel_pack ?? null,
      content_type: payload.content_type ?? 'novel',
    };
  } catch {
    return null;
  }
};

export const fetchLatestReadEpisode = async (bookId: string | number): Promise<LatestReadEpisodeResponse | null> => {
  try {
    const response = await apiClient.get<LatestReadEpisodeResponse>(`/bookdetail/latest-read-ep/${bookId}`);
    return response.data;
  } catch {
    return null;
  }
};

export interface ResolveEpisodeResponse {
  code: number;
  status: string;
  message: string;
  data: {
    ep_id: number;
    book_id: number;
  };
}

export const resolveEpisodeId = async (epId: string): Promise<ResolveEpisodeResponse | null> => {
  try {
    const response = await apiClient.get<ResolveEpisodeResponse>(`/ep/resolve/${epId}`);
    return response.data;
  } catch {
    return null;
  }
};

export interface ResolveBookResponse {
  code: number;
  status: string;
  message: string;
  data: {
    book_id: number;
  };
}

export const resolveBookId = async (bookId: string): Promise<ResolveBookResponse | null> => {
  try {
    const response = await apiClient.get<ResolveBookResponse>(`/book/resolve/${bookId}`);
    return response.data;
  } catch {
    return null;
  }
};

export const buyGroupPromotion = async (data: { dfb_id: number; payWith: string }) => {
  try {
    const response = await apiClient.post("/buy/groupPromotion", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const postBookClick = async (bookId: string | number) => {
  try {
    const id = Number(bookId);
    if (!id || isNaN(id)) return;
    await apiClient.post('/bookdetail/click', { book_id: id });
  } catch {
  }
};

export const fetchBookPromotions = async (page = 1, limit = 20) => {
  try {
    const response = await apiClient.get('/books/promotions/ep', { params: { page, limit } });
    return response.data;
  } catch (err: any) {
    throw err;
  }
};
