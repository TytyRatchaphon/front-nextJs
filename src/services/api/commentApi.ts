
import apiClient from "../apiClient";
import type { CommentResponse, CommentData, CommentEpData } from "@/types/api";

// --- Pinned Reviews (Home page) ---
export const fetchPinnedReviews = async (): Promise<{ reviews: any[], pagination?: any }> => {
  try {
    const response = await apiClient.get(`/review/feed?sort=liked`);
    if (response.data && response.data.data) {
      return {
        reviews: response.data.data.reviews || [],
        pagination: response.data.data.pagination
      };
    }
    return { reviews: [] };
  } catch {
    return { reviews: [] };
  }
};

// --- Book Reviews (BookDetail page) ---

export const fetchBookReviews = async (bookId: string | number, page: number = 1, limit: number = 10, sort: string = 'newest'): Promise<{ comments: CommentData[], pagination?: any }> => {
  try {
    const response = await apiClient.get<CommentResponse>(`/bookdetail/${bookId}/reviews`, {
      params: { page, limit, sort }
    });

    if (response.data && response.data.data) {
      const payload = response.data.data;
      if (Array.isArray(payload.comment_data)) {
        return {
          comments: payload.comment_data as CommentData[],
          pagination: payload.pagination
        };
      }
      if (Array.isArray(payload)) {
        return { comments: payload as CommentData[] };
      }
    }

    return { comments: [] };
  } catch {
    return { comments: [] };
  }
};

export const postBookReview = async (bookId: string | number, comment: string, star: number) => {
  try {
    const payload = { comment, star };
    const response = await apiClient.post(`/bookdetail/${bookId}/reviews`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const postPinnedReview = async (bookId: string | number, rating: number, content: string, is_spoiler: boolean = false) => {
  try {
    const payload = { rating, content, is_spoiler };
    const response = await apiClient.post(`/review/book/${bookId}`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const updateBookReview = async (reviewId: string | number, rating: number, content: string, is_spoiler: boolean = false) => {
  try {
    const payload = { rating, content, is_spoiler };
    const response = await apiClient.put(`/review/${reviewId}`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteUserReview = async (reviewId: string | number) => {
  try {
    const response = await apiClient.delete(`/review/${reviewId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// --- Review Interactions (Like, Share, Comment, Report) ---

export const likeReview = async (reviewId: string | number) => {
  try {
    const response = await apiClient.post(`/review/${reviewId}/like`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const shareReview = async (reviewId: string | number) => {
  try {
    const response = await apiClient.post(`/review/${reviewId}/share`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const postReviewComment = async (reviewId: string | number, content: string) => {
  try {
    const payload = { content };
    const response = await apiClient.post(`/review/${reviewId}/comment`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchReviewComments = async (reviewId: string | number): Promise<{ comments: any[] }> => {
  try {
    const response = await apiClient.get(`/review/${reviewId}/comment`);
    if (response.data && response.data.data) {
      return { comments: Array.isArray(response.data.data) ? response.data.data : response.data.data.comments || [] };
    }
    return { comments: [] };
  } catch {
    return { comments: [] };
  }
};

export const reportReviewOrComment = async (targetType: 'review' | 'comment', targetId: string | number) => {
  try {
    const payload = { target_type: targetType, target_id: targetId };
    const response = await apiClient.post(`/review/report`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const postReply = async (commentBookId: string | number, comment: string) => {
  try {
    const payload = { comment };
    const response = await apiClient.post(`/bookdetail/reviews/${commentBookId}/replies`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteBookReview = async (commentBookId: string | number) => {
  try {
    const response = await apiClient.delete(`/bookdetail/reviews/${commentBookId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportBookReview = async (commentBookId: string | number) => {
  try {
    const response = await apiClient.post(`/bookdetail/reviews/${commentBookId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteBookReviewReply = async (replyId: string | number) => {
  try {
    const response = await apiClient.delete(`/bookdetail/reviews/replies/${replyId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportBookReviewReply = async (replyId: string | number) => {
  try {
    const response = await apiClient.post(`/bookdetail/reviews/replies/${replyId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// --- Book Comments (BookDetail page - Episode-level comments) ---

export const fetchBookComments = async (bookId: string | number, page: number = 1, limit: number = 10, sort: string = 'newest'): Promise<{ comments: CommentEpData[], pagination?: any }> => {
  try {
    const response = await apiClient.get<CommentResponse>(`/bookdetail/${bookId}/comments`, {
      params: { page, limit, sort }
    });

    if (response.data && response.data.data) {
      const payload = response.data.data;
      if (Array.isArray(payload.comment_data)) {
        return {
          comments: payload.comment_data as CommentEpData[],
          pagination: payload.pagination
        };
      }
      if (Array.isArray(payload)) {
        return { comments: payload as CommentEpData[] };
      }
    }
    return { comments: [] };
  } catch {
    return { comments: [] };
  }
};

export const postCommentReply = async (commentEpId: string | number, comment: string) => {
  try {
    const payload = { comment };
    const response = await apiClient.post(`/bookdetail/comments/${commentEpId}/replies`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteBookComment = async (commentEpId: string | number) => {
  try {
    const response = await apiClient.delete(`/bookdetail/comments/${commentEpId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportBookComment = async (commentEpId: string | number) => {
  try {
    const response = await apiClient.post(`/bookdetail/comments/${commentEpId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteBookCommentReply = async (replyId: string | number) => {
  try {
    const response = await apiClient.delete(`/bookdetail/comments/replies/${replyId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportBookCommentReply = async (replyId: string | number) => {
  try {
    const response = await apiClient.post(`/bookdetail/comments/replies/${replyId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// --- Episode Comments (Read Page) ---

export const fetchEpisodeComments = async (epId: string | number, page: number = 1, limit: number = 10, sort: string = 'newest'): Promise<{ comments: CommentEpData[], pagination?: any }> => {
  try {
    const response = await apiClient.get<CommentResponse>(`/readep/${epId}/comments`, {
      params: { page, limit, sort }
    });

    if (response.data && response.data.data) {
      const payload = response.data.data;
      if (Array.isArray(payload.comment_data)) {
        return {
          comments: payload.comment_data as CommentEpData[],
          pagination: payload.pagination
        };
      }
      if (Array.isArray(payload)) {
        return { comments: payload as CommentEpData[] };
      }
    }
    return { comments: [] };
  } catch {
    return { comments: [] };
  }
};

export const postEpisodeComment = async (epId: string | number, comment: string) => {
  try {
    const payload = { comment };
    const response = await apiClient.post(`/readep/${epId}/comments`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const postEpisodeReply = async (commentEpId: string | number, comment: string) => {
  try {
    const payload = { comment };
    const response = await apiClient.post(`/readep/comments/${commentEpId}/replies`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportEpisodeComment = async (commentEpId: string | number) => {
  try {
    const response = await apiClient.post(`/readep/comments/${commentEpId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportEpisodeReply = async (commentSubEpId: string | number) => {
  try {
    const response = await apiClient.post(`/readep/comments/replies/${commentSubEpId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteEpisodeComment = async (commentEpId: string | number) => {
  try {
    const response = await apiClient.delete(`/readep/comments/${commentEpId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteEpisodeReply = async (commentSubEpId: string | number) => {
  try {
    const response = await apiClient.delete(`/readep/comments/replies/${commentSubEpId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
