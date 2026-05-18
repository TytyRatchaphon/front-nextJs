import apiClient from "../apiClient";

export type UpdateScope = "all" | "shelf" | "following";
export type UpdateContentType = "all" | "novel" | "novel_pack";
export type UpdateSort = "publish_time" | "view" | "bestseller";

type ApiResponse<T> = {
  code: number;
  status: "success" | "error" | "warning" | string;
  message: string;
  data: T;
};

export type BookUpdateCalendarDay = {
  date: string;
  day_name: string;
  day_short: string;
  day: number;
  is_past: boolean;
  is_today: boolean;
  is_future: boolean;
  has_updates: boolean;
  book_count: number;
  episode_count: number;
};

export type BookUpdateCalendarData = {
  timezone: string;
  range_days: number;
  past_days: number;
  future_days: number;
  start_date: string;
  end_date: string;
  filters: {
    scope: UpdateScope;
    content_type: UpdateContentType;
  };
  days: BookUpdateCalendarDay[];
};

export type BookUpdateDailyBook = {
  [key: string]: unknown;
  book_id: number;
  name: string;
  title: string;
  content_type: string;
  img: string | null;
  img_full: string | null;
  img_gif: string | null;
  img_gif_full: string | null;
  user_id: number;
  writer_name: string;
  tag: string[];
  chapter: number;
  isNew: boolean;
  isNewEp: boolean;
  isBestSeller: boolean;
  discount: number | null;
  time_end: string | null;
  discount_ep_count: number | null;
  ep_purchase_reward?: {
    has_promotion: boolean;
    img: string | null;
  } | null;
  categories: Array<{
    id: number;
    name: string;
  }>;
  updated_episode_count: number;
  first_publish_at: string;
  last_publish_at: string;
  publish_time_text: string;
  latest_episode: {
    ep_id: number;
    name: string;
    publish_datetime?: string;
    fast_access: {
      available: boolean;
      advance_days: number;
    };
  } | null;
  shelve_count: number;
  view: number;
  total_published_episode_count: number;
  release_pattern: {
    label: string;
    confidence: "high" | "medium" | "low" | string;
  };
};

export type BookUpdateDailyData = {
  date: string;
  filters: {
    scope: UpdateScope;
    content_type: UpdateContentType;
  };
  sort: UpdateSort;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
  books: BookUpdateDailyBook[];
};

const assertSuccess = <T>(payload: ApiResponse<T>, fallbackMessage: string): T => {
  if (payload?.status !== "success") {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload.data;
};

export const fetchBookUpdateCalendar = async (params: {
  scope: UpdateScope;
  contentType: UpdateContentType;
}) => {
  const response = await apiClient.get<ApiResponse<BookUpdateCalendarData>>("/book-updates/calendar", {
    params: {
      scope: params.scope,
      content_type: params.contentType,
    },
  });

  return assertSuccess(response.data, "โหลดปฏิทินอัปเดตนิยายไม่สำเร็จ");
};

export const fetchBookUpdateDaily = async (params: {
  date: string;
  scope: UpdateScope;
  contentType: UpdateContentType;
  page: number;
  limit: number;
  sort: UpdateSort;
}) => {
  const response = await apiClient.get<ApiResponse<BookUpdateDailyData>>("/book-updates/daily", {
    params: {
      date: params.date,
      scope: params.scope,
      content_type: params.contentType,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
    },
  });

  return assertSuccess(response.data, "โหลดรายการนิยายอัปเดตไม่สำเร็จ");
};
