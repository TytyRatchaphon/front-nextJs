import apiClient from "../apiClient";

export interface NotificationType {
  noti_type_id: number;
  category: string;
  type: 'book_new' | 'book_update' | 'system' | 'comment_book_id' | 'comment_ep_id' | 'comment_sub_book_id' | 'comment_sub_ep_id';
  title: string;
  subtitle: string;
  message?: string;
  image?: string;
  url?: string;
  status: string;
  scheduled_at?: string;
  book_id?: number;
  ep_id?: number;
  comment_id?: number;
  create_at: string;
}

export interface NotificationData {
  id: number;
  user_id: number;
  noti_type_id: number;
  create_at: string;
  update_at: string;
  readed: 'Y' | 'N';
  NotiType: NotificationType;
}

export type NotificationTab = 'all' | 'system' | 'book' | 'comment';

export interface RecentNotificationsResponse {
  code: number;
  status: string;
  message: string;
  data: {
    recent_notifications: NotificationData[];
  };
}

export const fetchRecentNotifications = async (tab: NotificationTab = 'all'): Promise<NotificationData[]> => {
  try {
    const response = await apiClient.get<RecentNotificationsResponse>('/user/notifications/recent/unread', {
      params: { tab }
    });

    if (response.data && response.data.data && Array.isArray(response.data.data.recent_notifications)) {
      return response.data.data.recent_notifications;
    }

    return [];
  } catch {
    return [];
  }
};

export const fetchAllNotifications = async (page: number = 1, limit: number = 20, tab: NotificationTab = 'all'): Promise<{ notifications: NotificationData[], pagination?: any }> => {
  try {
    const response = await apiClient.get('/user/notifications', {
      params: { page, limit, tab }
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

export const markAllNotificationsAsRead = async (tab: NotificationTab = 'all') => {
  try {
    const response = await apiClient.patch('/user/notifications/read-all', null, {
      params: { tab }
    });
    return response.data;
  } catch {
    return null;
  }
};

export const deleteNotifications = async (ids: number[]) => {
  try {
    const response = await apiClient.delete('/user/notifications', {
      data: { ids }
    });
    return response.data;
  } catch {
    return null;
  }
};

export const deleteAllNotifications = async () => {
  try {
    const response = await apiClient.delete('/user/notifications/all');
    return response.data;
  } catch {
    return null;
  }
};

export const followPromotion = async (payload: { type: string; ref_id: string | number }) => {
  try {
    const response = await apiClient.post('/follow-promotion', payload);
    return response.data;
  } catch {
    return null;
  }
};

export const unfollowPromotion = async (payload: { type: string; ref_id: string | number }) => {
  try {
    const response = await apiClient.delete('/follow-promotion', {
      data: payload,
    });
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
