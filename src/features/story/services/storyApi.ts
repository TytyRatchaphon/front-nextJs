import apiClient from '@/services/apiClient';
import { ApiResponse } from '@/types/api-core';
import {
  StoryBarResponse,
  StoryConfig,
  StoryGroupItemsResponse,
  StoryInsightsResponse,
  StoryInteractionResponse,
  StoryItemType,
  StoryPlaybackRefreshResponse,
  StoryUploadStatusResponse,
  VideoCommentResponse,
  VideoCommentReplyResponse,
  VideoCommentCreateResponse,
  VideoCommentDeleteResponse,
  VideoCommentReportResponse,
  StoryManageResponse,
  StoryManageItem,
  StoryViewersResponse,
  StoryLinksManageResponse,
  StoryLinkResponse,
  StoryGroupType,
  StoryDisplayStatus,
  StoryUploadResponse,
} from '../types/storyTypes';

type StoryApiPayload<T> = T | ApiResponse<T>;

export const resolveVideoApiUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_VIDEO_API_BASE_URL?.trim().replace(/\/+$/, '');
  return baseUrl ? `${baseUrl}/${path.replace(/^\/+/, '')}` : path;
};

const unwrapStoryResponse = <T>(payload: StoryApiPayload<T>): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

export const storyApi = {
  fetchStoryBar: async (limit: number = 20, cursor?: string): Promise<StoryBarResponse> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);

    const response = await apiClient.get<StoryApiPayload<StoryBarResponse>>(
      resolveVideoApiUrl(`/video/story-bar?${params.toString()}`)
    );
    return unwrapStoryResponse(response.data);
  },

  fetchGroupItems: async (
    groupType: StoryGroupType,
    groupId: string,
    startRefId?: number
  ): Promise<StoryGroupItemsResponse> => {
    const params = new URLSearchParams();
    if (startRefId) params.append('start_ref_id', startRefId.toString());

    const response = await apiClient.get<StoryApiPayload<StoryGroupItemsResponse>>(
      resolveVideoApiUrl(`/video/story-bar/groups/${groupType}/${groupId}/items?${params.toString()}`)
    );
    return unwrapStoryResponse(response.data);
  },

  sendView: async (type: StoryItemType, ref_id: number): Promise<StoryInteractionResponse> => {
    const response = await apiClient.post<StoryApiPayload<StoryInteractionResponse>>(resolveVideoApiUrl('/video/interactions/view'), {
      type,
      ref_id,
    });
    return unwrapStoryResponse(response.data);
  },

  toggleLike: async (type: StoryItemType, ref_id: number): Promise<StoryInteractionResponse> => {
    const response = await apiClient.post<StoryApiPayload<StoryInteractionResponse>>(resolveVideoApiUrl('/video/interactions/like'), {
      type,
      ref_id,
    });
    return unwrapStoryResponse(response.data);
  },

  sendImpressions: async (impressions: { groupType: StoryGroupType; user_id: number }[]): Promise<void> => {
    await apiClient.post(resolveVideoApiUrl('/video/story-bar/impressions'), { impressions });
  },

  refreshPlayback: async (type: StoryItemType, ref_id: number): Promise<StoryPlaybackRefreshResponse> => {
    const response = await apiClient.get<StoryApiPayload<StoryPlaybackRefreshResponse>>(
      resolveVideoApiUrl(`/video/playback?type=${type}&ref_id=${ref_id}`)
    );
    return unwrapStoryResponse(response.data);
  },

  fetchStoryConfig: async (): Promise<StoryConfig> => {
    const response = await apiClient.get<StoryApiPayload<StoryConfig>>(resolveVideoApiUrl('/video/story/config'));
    return unwrapStoryResponse(response.data);
  },

  uploadStory: async (
    file: File,
    idempotencyKey: string,
    sourceType: 'user' | 'admin' = 'user',
    startDate?: string,
    endDate?: string,
    links?: { label: string; url: string; orderBy?: number }[]
  ): Promise<StoryUploadResponse | number> => {
    const headers: Record<string, string> = {
      'Content-Type': file.type || 'video/mp4',
      'Content-Length': file.size.toString(),
      'x-idempotency-key': idempotencyKey,
      'x-file-name': encodeURIComponent(file.name),
      'x-source-type': sourceType,
      'x-priority': '0',
    };

    if (startDate) headers['x-start-date'] = startDate;
    if (endDate) headers['x-end-date'] = endDate;
    if (links && links.length > 0) {
      headers['x-links'] = encodeURIComponent(JSON.stringify(links));
    }

    const response = await apiClient.post<StoryApiPayload<StoryUploadResponse | number>>(resolveVideoApiUrl('/video/story/uploads'), file, {
      headers,
    });
    return unwrapStoryResponse(response.data);
  },

  fetchStoryStatus: async (storyItemId: number): Promise<StoryUploadStatusResponse> => {
    const response = await apiClient.get<StoryApiPayload<StoryUploadStatusResponse>>(resolveVideoApiUrl(`/video/story/${storyItemId}/status?_t=${Date.now()}`));
    return unwrapStoryResponse(response.data);
  },

  fetchStoryInsights: async (storyItemId: number): Promise<StoryInsightsResponse> => {
    const response = await apiClient.get<StoryApiPayload<StoryInsightsResponse>>(resolveVideoApiUrl(`/video/story/${storyItemId}/insights`));
    return unwrapStoryResponse(response.data);
  },

  fetchStoryLinks: async (storyItemId: number): Promise<StoryLinksManageResponse> => {
    const response = await apiClient.get<StoryApiPayload<StoryLinksManageResponse>>(resolveVideoApiUrl(`/video/story/${storyItemId}/links`));
    return unwrapStoryResponse(response.data);
  },

  // --- Comments API ---

  fetchComments: async (
    type: StoryItemType,
    ref_id: number,
    limit: number = 20,
    cursor?: string
  ): Promise<VideoCommentResponse> => {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('ref_id', ref_id.toString());
    params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);

    const response = await apiClient.get<StoryApiPayload<VideoCommentResponse>>(resolveVideoApiUrl(`/video/comments?${params.toString()}`));
    return unwrapStoryResponse(response.data);
  },

  fetchReplies: async (
    comment_id: number,
    limit: number = 20,
    cursor?: string
  ): Promise<VideoCommentReplyResponse> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);

    const response = await apiClient.get<StoryApiPayload<VideoCommentReplyResponse>>(resolveVideoApiUrl(`/video/comments/${comment_id}/replies?${params.toString()}`));
    return unwrapStoryResponse(response.data);
  },

  createComment: async (
    type: StoryItemType,
    ref_id: number,
    comment_text: string
  ): Promise<VideoCommentCreateResponse> => {
    const response = await apiClient.post<StoryApiPayload<VideoCommentCreateResponse>>(resolveVideoApiUrl('/video/comments'), {
      type,
      ref_id,
      comment_text,
    });
    return unwrapStoryResponse(response.data);
  },

  replyComment: async (
    comment_id: number,
    comment_text: string
  ): Promise<VideoCommentCreateResponse> => {
    const response = await apiClient.post<StoryApiPayload<VideoCommentCreateResponse>>(resolveVideoApiUrl(`/video/comments/${comment_id}/replies`), {
      comment_text,
    });
    return unwrapStoryResponse(response.data);
  },

  deleteComment: async (comment_id: number): Promise<VideoCommentDeleteResponse> => {
    const response = await apiClient.delete<StoryApiPayload<VideoCommentDeleteResponse>>(resolveVideoApiUrl(`/video/comments/${comment_id}`));
    return unwrapStoryResponse(response.data);
  },

  reportComment: async (comment_id: number): Promise<VideoCommentReportResponse> => {
    const response = await apiClient.post<StoryApiPayload<VideoCommentReportResponse>>(resolveVideoApiUrl(`/video/comments/${comment_id}/report`));
    return unwrapStoryResponse(response.data);
  },

  // --- Management API ---

  fetchManageStories: async (
    page: number = 1,
    limit: number = 20,
    displayStatus: StoryDisplayStatus = 'all',
    sort: string = 'created_desc'
  ): Promise<StoryManageResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('displayStatus', displayStatus);
    params.append('sort', sort);

    const response = await apiClient.get<StoryApiPayload<StoryManageResponse>>(resolveVideoApiUrl(`/video/story/manage?${params.toString()}`));
    return unwrapStoryResponse(response.data);
  },

  fetchManageStoryDetail: async (storyItemId: number): Promise<StoryManageItem> => {
    const response = await apiClient.get<StoryApiPayload<StoryManageItem>>(resolveVideoApiUrl(`/video/story/${storyItemId}/manage`));
    return unwrapStoryResponse(response.data);
  },

  updateStory: async (
    storyItemId: number,
    data: { publishStatus?: 'active' | 'hidden'; startDate?: string; endDate?: string }
  ): Promise<StoryManageItem> => {
    const response = await apiClient.patch<StoryApiPayload<StoryManageItem>>(resolveVideoApiUrl(`/video/story/${storyItemId}`), data);
    return unwrapStoryResponse(response.data);
  },

  deleteStory: async (storyItemId: number): Promise<{ success?: boolean }> => {
    const response = await apiClient.delete<StoryApiPayload<{ success?: boolean }>>(resolveVideoApiUrl(`/video/story/${storyItemId}`));
    return unwrapStoryResponse(response.data);
  },

  fetchStoryViewers: async (
    storyItemId: number,
    page: number = 1,
    limit: number = 50,
    reaction: 'all' | 'like' = 'all'
  ): Promise<StoryViewersResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('reaction', reaction);

    const response = await apiClient.get<StoryApiPayload<StoryViewersResponse>>(resolveVideoApiUrl(`/video/story/${storyItemId}/viewers?${params.toString()}`));
    return unwrapStoryResponse(response.data);
  },

  createManageLink: async (storyItemId: number, data: { links: { label: string; url: string; orderBy?: number }[] }): Promise<StoryLinksManageResponse> => {
    const response = await apiClient.post<StoryApiPayload<StoryLinksManageResponse>>(resolveVideoApiUrl(`/video/story/${storyItemId}/links`), data);
    return unwrapStoryResponse(response.data);
  },

  updateManageLinks: async (storyItemId: number, data: { links: { label: string; url: string; orderBy?: number }[] }): Promise<StoryLinksManageResponse> => {
    const response = await apiClient.put<StoryApiPayload<StoryLinksManageResponse>>(resolveVideoApiUrl(`/video/story/${storyItemId}/links`), data);
    return unwrapStoryResponse(response.data);
  },

  reorderManageLinks: async (storyItemId: number, linkIds: number[]): Promise<StoryLinksManageResponse> => {
    const response = await apiClient.put<StoryApiPayload<StoryLinksManageResponse>>(resolveVideoApiUrl(`/video/story/${storyItemId}/links/order`), { linkIds });
    return unwrapStoryResponse(response.data);
  },

  updateManageLinkSingle: async (storyItemId: number, linkId: number, data: { label: string; url: string }): Promise<StoryLinkResponse> => {
    const response = await apiClient.patch<StoryApiPayload<StoryLinkResponse>>(resolveVideoApiUrl(`/video/story/${storyItemId}/links/${linkId}`), data);
    return unwrapStoryResponse(response.data);
  },

  deleteManageLink: async (storyItemId: number, linkId: number): Promise<{ success?: boolean }> => {
    const response = await apiClient.delete<StoryApiPayload<{ success?: boolean }>>(resolveVideoApiUrl(`/video/story/${storyItemId}/links/${linkId}`));
    return unwrapStoryResponse(response.data);
  },
};
