
import apiClient from "../apiClient";
import type { CategoryDetail, CategoryAllResponse, CategoryBookListResponse } from "@/types/api";

// --- Activity Logging ---

export interface LogActivityPayload {
  session_id?: string;
  page_session_id?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  path?: string;
  duration?: number;
  metadata?: any;
}

export const logActivity = async (payload: LogActivityPayload) => {
  try {
    if (process.env.NODE_ENV === 'development') {
    }
    const response = await apiClient.post('/log/activity', payload);
    return response.data;
  } catch (error) {
    console.error("Failed to log activity", error);
    return null;
  }
};

// --- Reading Progress ---

export const syncReadingProgress = async (ep_id: string | number) => {
  try {
    const response = await apiClient.post('/reading-progress/sync', { ep_id: String(ep_id) });
    return response.data;
  } catch {
    return null;
  }
};

export const updateReadingProgress = async (book_id: string | number, ep_id: string | number, progress: number) => {
  try {
    const response = await apiClient.post('/reading-progress/update', {
      book_id: String(book_id),
      ep_id: String(ep_id),
      progress
    });
    return response.data;
  } catch {
    return null;
  }
};

// --- Categories ---

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

// --- Active Types & Categories ---

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

// --- Notifications ---

export interface NotificationType {
  noti_type_id: number;
  category: string;
  type: string;
  title: string;
  subtitle: string;
  message: string;
  image: string | null;
  url: string | null;
  book_id?: number;
  ep_id?: number;
  comment_id?: number;
  create_at?: string;
}

export interface NotificationData {
  id: number;
  user_id: number;
  noti_type_id: number;
  create_at: string;
  readed: string;
  NotiType: NotificationType;
}

export interface RecentNotificationsResponse {
  code: number;
  status: string;
  message: string;
  data: {
    recent_notifications: NotificationData[];
  };
}

export const fetchRecentNotifications = async (): Promise<NotificationData[]> => {
  try {
    const response = await apiClient.get<RecentNotificationsResponse>('/user/notifications/recent/unread');

    if (response.data && response.data.data && Array.isArray(response.data.data.recent_notifications)) {
      return response.data.data.recent_notifications;
    }

    return [];
  } catch {
    return [];
  }
};

export const fetchAllNotifications = async (page: number = 1, limit: number = 20): Promise<{ notifications: NotificationData[], pagination?: any }> => {
  try {
    const response = await apiClient.get('/user/notifications', {
      params: { page, limit }
    });

    if (response.data && response.data.data) {
      if (Array.isArray(response.data.data)) {
        return { notifications: response.data.data, pagination: response.data.pagination || response.data.meta };
      }
      if (response.data.data.notifications) {
        return { notifications: response.data.data.notifications, pagination: response.data.data.pagination };
      }
    }
    return { notifications: [] };
  } catch {
    return { notifications: [] };
  }
};

export const markNotificationAsRead = async (notificationId: number) => {
  try {
    const response = await apiClient.patch(`/user/notifications/${notificationId}/read`);
    return response.data;
  } catch {
    return null;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiClient.patch('/user/notifications/read-all');
    return response.data;
  } catch {
    return null;
  }
};

export const postCommentNotification = async (commentId: string | number) => {
  try {
    const response = await apiClient.post(`/user/notifications/comments/${commentId}`, {});
    return response.data;
  } catch {
    return null;
  }
};

export const postReviewNotification = async (commentId: string | number) => {
  try {
    const response = await apiClient.post(`/user/notifications/reviews/${commentId}`, {});
    return response.data;
  } catch {
    return null;
  }
};

export const postReviewReplyNotification = async (commentId: string | number) => {
  try {
    const response = await apiClient.post(`/user/notifications/reviews/replies/${commentId}`, {});
    return response.data;
  } catch {
    return null;
  }
};

export const postCommentReplyNotification = async (commentId: string | number) => {
  try {
    const response = await apiClient.post(`/user/notifications/comments/replies/${commentId}`, {});
    return response.data;
  } catch {
    return null;
  }
};

// --- FAQ ---

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export const fetchFaqs = async (): Promise<FaqItem[]> => {
    try {
        const response = await apiClient.get<{ code: number; data: FaqItem[] }>('/faq');
        return response.data?.data || [];
    } catch {
        return [];
    }
}

// --- Search History ---

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
