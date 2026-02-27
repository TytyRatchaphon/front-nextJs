
import apiClient from "../apiClient";
import type { CommentResponse, CommentData, ThreadResponse } from "@/types/api";

export interface FetchThreadsParams {
  page?: number;
  limit?: number;
  type?: number;
  key?: string;
  sort?: string;
}

export const fetchThreads = async (params: FetchThreadsParams = {}): Promise<ThreadResponse | null> => {
  try {
    const response = await apiClient.get<ThreadResponse>('/user/threads', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        ...params
      }
    });
    return response.data;
  } catch (error: any) {
    return null;
  }
};

export interface CreateThreadPayload {
  title: string;
  rate: string;
  author: string;
  type: string;
  tag: string;
  detail: string;
}

export const createThread = async (payload: CreateThreadPayload) => {
  try {
    const response = await apiClient.post('/user/threads', payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export interface ThreadDetail {
  topic_id: number;
  topicID: string;
  user_id: number;
  date_at: string;
  title: string;
  detail: string;
  view: number;
  comment_count: number;
  author: string;
  tag: string;
  type: number;
  rate: string;
}

export const fetchThreadDetail = async (topicId: string | number): Promise<ThreadDetail> => {
  try {
    const response = await apiClient.get<{ data: ThreadDetail }>(`/user/threads/${topicId}`);
    return response.data.data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchThreadComments = async (topicId: string | number, page: number = 1): Promise<{ comments: CommentData[], pagination?: any }> => {
  try {
    const response = await apiClient.get<CommentResponse>(`/user/threads/${topicId}/comments`, {
      params: { page }
    });

    if (response.data && response.data.data) {
      const payload = response.data.data;
      if (Array.isArray((payload as any).comment_data)) {
        return {
          comments: (payload as any).comment_data as CommentData[],
          pagination: (payload as any).paginate
        };
      }
    }
    return { comments: [] };
  } catch (error: any) {
    return { comments: [] };
  }
};

export const postThreadComment = async (topicId: string | number, comment: string) => {
  try {
    const response = await apiClient.post(`/user/threads/${topicId}/comments`, { comment });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const postThreadReply = async (topicId: string | number, commentTopicId: string | number, comment: string) => {
  try {
    const response = await apiClient.post(`/user/threads/${topicId}/comments/${commentTopicId}/replies`, { comment });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportThreadComment = async (commentTopicId: number) => {
  return await apiClient.post(`/user/threads/comments/${commentTopicId}/report`);
};

export const reportThreadReply = async (commentSubTopicId: number) => {
  return await apiClient.post(`/user/threads/comments/${commentSubTopicId}/report`);
};

export const deleteThreadReply = async (commentSubTopicId: number) => {
  return await apiClient.delete(`/user/threads/comments/${commentSubTopicId}/replies`);
};

export const deleteThreadComment = async (commentTopicId: number) => {
  return await apiClient.delete(`/user/threads/comments/${commentTopicId}`);
};

export const deleteThread = async (topicId: number) => {
  return await apiClient.delete(`/user/threads/${topicId}`);
};
