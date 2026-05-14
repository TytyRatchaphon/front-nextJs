
import apiClient from "../apiClient";
import type { BookTrans, BookDetail, BookDetailResponse, BookPurchaseDetailsResponse, LatestReadEpisodeResponse, BookPromotionOption, CategoryPagination, UniversalBook } from "@/types/api";
import { bookSchemas } from "./apiResponseSchemas";
import { validateApiPayload } from "./apiResponseValidation";

export interface BookReportReason {
  id: number;
  code: string;
  title: string;
  description: string;
  requires_detail: boolean;
}

export interface BookReportType {
  id: number;
  code: string;
  title: string;
  description: string;
  reasons: BookReportReason[];
}

export interface BookReportTypesResponse {
  code: number;
  status: string;
  message: string;
  data?: {
    types?: unknown[];
  };
}

export interface SubmitBookReportPayload {
  detail: string | null;
  reports: {
    type_id: number;
    reason_id: number;
  }[];
}

const normalizeBookReportTypes = (payload: BookReportTypesResponse | any): BookReportType[] => {
  const rawTypes = payload?.data?.types;
  if (!Array.isArray(rawTypes)) return [];

  return rawTypes
    .map((rawType: any) => {
      const typeId = Number(rawType?.id);
      if (!Number.isFinite(typeId)) return null;

      const rawReasons = Array.isArray(rawType?.reasons) ? rawType.reasons : [];
      const reasons: BookReportReason[] = rawReasons
        .map((rawReason: any) => {
          const reasonId = Number(rawReason?.id);
          if (!Number.isFinite(reasonId)) return null;

          return {
            id: reasonId,
            code: String(rawReason?.code ?? ''),
            title: String(rawReason?.title ?? ''),
            description: String(rawReason?.description ?? ''),
            requires_detail: Boolean(rawReason?.requires_detail),
          };
        })
        .filter((reason: BookReportReason | null): reason is BookReportReason => reason !== null);

      return {
        id: typeId,
        code: String(rawType?.code ?? ''),
        title: String(rawType?.title ?? ''),
        description: String(rawType?.description ?? ''),
        reasons,
      };
    })
    .filter((type: BookReportType | null): type is BookReportType => type !== null);
};

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

export interface NewNovelListData {
  pagination: CategoryPagination;
  books: UniversalBook[];
  degradedMode?: boolean;
  source?: 'books_new' | 'book_search_fallback';
}

export interface NewNovelListResponse {
  code: number;
  status: string;
  message: string;
  data: NewNovelListData;
}

export type NewNovelContentType = 'all' | 'novel' | 'novel_pack';

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNullablePageNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const createPaginationFallback = (page: number, limit: number, total: number = 0): CategoryPagination => {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    nextPage: totalPages > safePage ? safePage + 1 : null,
    prevPage: safePage > 1 ? safePage - 1 : null,
  };
};

const normalizeContentTypeValue = (value: unknown): NewNovelContentType | '' => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'novel' || normalized === 'novel_pack') return normalized;
  return '';
};

const filterBooksByContentType = (books: UniversalBook[], contentType: NewNovelContentType): UniversalBook[] => {
  if (contentType === 'all') return books;
  return books.filter((book) => {
    const bookContentType = normalizeContentTypeValue(
      (book as any)?.content_type ?? (book as any)?.contentType ?? (book as any)?.type,
    );
    return bookContentType === contentType;
  });
};

const normalizeBooksNewResponse = (payload: any): NewNovelListData => {
  const validatedPayload = validateApiPayload(bookSchemas.newNovels, payload, "/books/new");
  const data = validatedPayload.data;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid /books/new response: missing data object');
  }
  if (!Array.isArray(data.books)) {
    throw new Error('Invalid /books/new response: data.books must be an array');
  }
  if (!data.pagination || typeof data.pagination !== 'object') {
    throw new Error('Invalid /books/new response: data.pagination must be an object');
  }

  const page = toFiniteNumber(data.pagination.page);
  const limit = toFiniteNumber(data.pagination.limit);
  const total = toFiniteNumber(data.pagination.total);
  const totalPages = toFiniteNumber(data.pagination.totalPages ?? data.pagination.total_pages);
  const nextPage = toNullablePageNumber(data.pagination.nextPage ?? data.pagination.next_page);
  const prevPage = toNullablePageNumber(data.pagination.prevPage ?? data.pagination.prev_page);

  if (
    page === null
    || limit === null
    || total === null
    || totalPages === null
  ) {
    throw new Error('Invalid /books/new response: malformed pagination contract');
  }

  return {
    books: data.books,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      nextPage,
      prevPage,
    },
    degradedMode: false,
    source: 'books_new',
  };
};

const normalizeBookSearchFallbackData = (
  payload: any,
  page: number,
  limit: number,
  contentType: NewNovelContentType,
): NewNovelListData => {
  const data = payload?.data ?? payload;
  const rawBooks = Array.isArray(data?.books)
    ? data.books
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.list)
        ? data.list
        : Array.isArray(payload)
          ? payload
          : [];
  const books = filterBooksByContentType(rawBooks, contentType);

  const paginationSource = data?.pagination ?? data?.paginate ?? payload?.pagination ?? payload?.paginate;
  const total = Number(paginationSource?.total ?? data?.total ?? payload?.total ?? books.length);
  const safeTotal = Number.isFinite(total) ? total : books.length;
  const pagination: CategoryPagination = paginationSource
    ? {
        page: Number(paginationSource.page ?? page) || page,
        limit: Number(paginationSource.limit ?? limit) || limit,
        total: safeTotal,
        totalPages: Number(paginationSource.totalPages ?? paginationSource.total_pages ?? Math.ceil(safeTotal / limit)),
        nextPage: paginationSource.nextPage ?? paginationSource.next_page ?? null,
        prevPage: paginationSource.prevPage ?? paginationSource.prev_page ?? null,
      }
    : createPaginationFallback(page, limit, safeTotal);

  // If local content_type filter trimmed results, avoid misleading pagination from fallback endpoint.
  const filteredByClient = books.length !== rawBooks.length;
  const safePagination = filteredByClient
    ? createPaginationFallback(page, limit, books.length)
    : pagination;

  return {
    pagination: safePagination,
    books,
    degradedMode: true,
    source: 'book_search_fallback',
  };
};

const getHttpStatusFromError = (error: unknown): number | null => {
  const status = (error as any)?.response?.status;
  return Number.isFinite(Number(status)) ? Number(status) : null;
};

const shouldUseBooksNewFallback = (error: unknown): boolean => {
  const status = getHttpStatusFromError(error);
  return status === 404 || status === 405;
};

export const fetchNewNovels = async (
  page: number = 1,
  limit: number = 20,
  contentType: NewNovelContentType = 'all',
): Promise<NewNovelListData | null> => {
  try {
    const response = await apiClient.get<NewNovelListResponse>('/books/new', {
      params: { page, limit, content_type: contentType },
    });
    return normalizeBooksNewResponse(response.data);
  } catch (primaryError) {
    if (!shouldUseBooksNewFallback(primaryError)) {
      return null;
    }

    try {
      const fallback = await apiClient.get('/book/search', {
        params: {
          page,
          limit,
          content_type: contentType,
          sortBy: 'date_at',
          order: 'DESC',
        },
      });
      console.warn('[fetchNewNovels] Using degraded fallback /book/search for /books/new', {
        page,
        limit,
        contentType,
      });
      return normalizeBookSearchFallbackData(fallback.data, page, limit, contentType);
    } catch {
      return null;
    }
  }
};

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

const normalizeBookDetailPayload = (payload: BookDetailResponse | BookDetail | any): BookDetail | null => {
  const data = payload?.data ?? payload;
  if (!data || typeof data !== 'object') return null;
  return data as BookDetail;
};

export const fetchBookDetail = async (bookId: string): Promise<BookDetail> => {
  const response = await apiClient.get<BookDetailResponse>(`/bookdetail/${bookId}`);
  const validatedPayload = validateApiPayload(bookSchemas.detail, response.data, `/bookdetail/${bookId}`);
  const book = normalizeBookDetailPayload(validatedPayload);
  if (!book) {
    throw new Error('ไม่พบข้อมูลหนังสือ');
  }
  return book;
};

export const fetchMyBookDetail = fetchBookDetail;

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
    const payload = validateApiPayload(bookSchemas.purchaseDetails, response.data, `/bookdetail/purchase/${bookId}`);
    return payload.data as unknown as BookPurchaseDetailsResponse["data"];
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
    const payload = validateApiPayload(bookSchemas.recommendation, response.data, `/bookdetail/recommend/${bookId}`);
    return payload.data;
  } catch {
    return [];
  }
};

export const fetchBookPromotionOptions = async (bookId: number): Promise<BookPromotionOption[]> => {
  try {
    const response = await apiClient.get<any>(`/pack-campaign/buying-options/${bookId}`);
    const payload = validateApiPayload(bookSchemas.promotionOptions, response.data, `/pack-campaign/buying-options/${bookId}`);
    if (payload.code !== 200) return [];
    return payload.data as unknown as BookPromotionOption[];
  } catch {
    return [];
  }
};

export interface NovelPackCheckData {
  btn_novel: number | null;
  btn_novel_pack: number | null;
  btn_novel_pack_show_lead_label: boolean;
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
      btn_novel_pack_show_lead_label: payload.btn_novel_pack_show_lead_label ?? false,
      content_type: payload.content_type ?? 'novel',
    };
  } catch {
    return null;
  }
};

export const fetchLatestReadEpisode = async (bookId: string | number): Promise<LatestReadEpisodeResponse | null> => {
  try {
    const response = await apiClient.get<LatestReadEpisodeResponse>(`/bookdetail/latest-read-ep/${bookId}`);
    return validateApiPayload(bookSchemas.latestReadEpisode, response.data, `/bookdetail/latest-read-ep/${bookId}`) as unknown as LatestReadEpisodeResponse;
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

export type BuyEpisodesPayload = {
  eps: number[];
  payWith: "coin" | "freecoin";
  fastPayWith?: Array<"ticket" | "coin">;
};

export const buyEpisodes = async (payload: BuyEpisodesPayload) => {
  const response = await apiClient.post("/buy/eps", payload);
  return response.data;
};

export const addBookToShelf = async (bookId: string | number) => {
  const response = await apiClient.post(`/user/savebookshelve/add/${bookId}`);
  return response.data;
};

export const removeBookFromShelf = async (bookId: string | number) => {
  const response = await apiClient.post(`/user/savebookshelve/remove/${bookId}`);
  return response.data;
};

export const saveBookShare = async (payload: {
  userID: string | number;
  bookID: string | number;
  type: "facebook" | "twitter" | "line";
}) => {
  const response = await apiClient.post("gift/saveshare", payload);
  return response.data;
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

export const fetchBookReportTypes = async (): Promise<BookReportType[]> => {
  const response = await apiClient.get<BookReportTypesResponse>('/book/report/types');
  return normalizeBookReportTypes(response.data);
};

export const submitBookReport = async (
  bookId: string | number,
  payload: SubmitBookReportPayload,
): Promise<any> => {
  const response = await apiClient.post(`/book/${bookId}/report`, payload);
  return response.data;
};
