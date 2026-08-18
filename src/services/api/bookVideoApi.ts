import apiClient from '@/services/apiClient';
import {
  BookVideoConfig,
  BookVideoItem,
  BookVideoPlaylist,
  PublicPlaylistDetail,
  VideoPlaybackInfo,
  VideoComment,
} from '@/types/bookVideo';

// Helper to extract nested payload if wrapped in { data: ... }
function unwrapData<T>(response: any): T {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response as T;
}

// ----------------------------------------------------
// Writer API Endpoints
// ----------------------------------------------------

export async function fetchVideoConfig(bookId: number): Promise<BookVideoConfig> {
  const res = await apiClient.get(`/mybook/${bookId}/videos/config`);
  return unwrapData<BookVideoConfig>(res);
}

export async function fetchMyVideos(
  bookId: number,
  params?: { limit?: number; cursor?: string; status?: string }
): Promise<{ items: BookVideoItem[]; nextCursor: string | null }> {
  const res = await apiClient.get(`/mybook/${bookId}/videos`, { params });
  return unwrapData<{ items: BookVideoItem[]; nextCursor: string | null }>(res);
}

export async function fetchMyVideoDetail(bookId: number, videoId: number): Promise<BookVideoItem> {
  const res = await apiClient.get(`/mybook/${bookId}/videos/${videoId}`);
  return unwrapData<BookVideoItem>(res);
}

export async function fetchMyVideoStatus(
  bookId: number,
  videoId: number
): Promise<{ videoId: number; status: string; progressPercent?: number; stage?: string }> {
  const res = await apiClient.get(`/mybook/${bookId}/videos/${videoId}/status`);
  return unwrapData(res);
}

export async function patchMyVideoTitle(
  bookId: number,
  videoId: number,
  title: string
): Promise<BookVideoItem> {
  const res = await apiClient.patch(`/mybook/${bookId}/videos/${videoId}`, { title });
  return unwrapData<BookVideoItem>(res);
}

export async function retryMyVideo(
  bookId: number,
  videoId: number
): Promise<{ videoId: number; status: string; jobId: string }> {
  const res = await apiClient.post(`/mybook/${bookId}/videos/${videoId}/retry`);
  return unwrapData(res);
}

export async function deleteMyVideo(
  bookId: number,
  videoId: number
): Promise<{ videoId: number; status: 'deleted' }> {
  const res = await apiClient.delete(`/mybook/${bookId}/videos/${videoId}`);
  return unwrapData(res);
}

export async function uploadMyVideoDirect(
  bookId: number,
  file: File,
  title: string,
  onUploadProgress?: (progressPercent: number) => void
): Promise<{ video: BookVideoItem; jobId: string; idempotent: boolean }> {
  const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `bvp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const headers: Record<string, string> = {
    'Content-Type': file.type || 'video/mp4',
    'x-idempotency-key': idempotencyKey,
    'x-file-name': encodeURIComponent(file.name),
    'x-video-title': encodeURIComponent(title),
  };

  const res = await apiClient.post(`/mybook/${bookId}/videos/uploads`, file, {
    headers,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onUploadProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percent);
      }
    },
  });

  return unwrapData(res);
}

// ----------------------------------------------------
// Writer Playlist Management Endpoints
// ----------------------------------------------------

export async function fetchMyPlaylists(
  bookId: number,
  params?: { limit?: number; cursor?: string }
): Promise<{ items: BookVideoPlaylist[]; nextCursor: string | null; hasMore: boolean }> {
  const res = await apiClient.get(`/mybook/${bookId}/video-playlists`, { params });
  return unwrapData(res);
}

export async function createMyPlaylist(
  bookId: number,
  name: string
): Promise<BookVideoPlaylist> {
  const res = await apiClient.post(`/mybook/${bookId}/video-playlists`, { name });
  return unwrapData(res);
}

export async function fetchMyPlaylistDetail(
  bookId: number,
  playlistId: number
): Promise<BookVideoPlaylist> {
  const res = await apiClient.get(`/mybook/${bookId}/video-playlists/${playlistId}`);
  return unwrapData(res);
}

export async function patchMyPlaylist(
  bookId: number,
  playlistId: number,
  data: { name?: string; publishStatus?: 'published' | 'unpublished' }
): Promise<BookVideoPlaylist> {
  const res = await apiClient.patch(`/mybook/${bookId}/video-playlists/${playlistId}`, data);
  return unwrapData(res);
}

export async function deleteMyPlaylist(
  bookId: number,
  playlistId: number
): Promise<{ playlistId: number; status: 'deleted' }> {
  const res = await apiClient.delete(`/mybook/${bookId}/video-playlists/${playlistId}`);
  return unwrapData(res);
}

export async function reorderMyPlaylists(
  bookId: number,
  playlistIds: number[]
): Promise<{ success: boolean }> {
  const res = await apiClient.put(`/mybook/${bookId}/video-playlists/order`, { playlistIds });
  return unwrapData(res);
}

export async function addVideosToPlaylist(
  bookId: number,
  playlistId: number,
  videoIds: number[]
): Promise<{ success: boolean }> {
  const res = await apiClient.post(`/mybook/${bookId}/video-playlists/${playlistId}/videos`, { videoIds });
  return unwrapData(res);
}

export async function removeVideoFromPlaylist(
  bookId: number,
  playlistId: number,
  videoId: number
): Promise<{ success: boolean }> {
  const res = await apiClient.delete(`/mybook/${bookId}/video-playlists/${playlistId}/videos/${videoId}`);
  return unwrapData(res);
}

export async function reorderPlaylistVideos(
  bookId: number,
  playlistId: number,
  videoIds: number[]
): Promise<{ success: boolean }> {
  const res = await apiClient.put(`/mybook/${bookId}/video-playlists/${playlistId}/videos/order`, { videoIds });
  return unwrapData(res);
}

export async function uploadPlaylistCover(
  bookId: number,
  playlistId: number,
  file: File
): Promise<{ playlistId: number; coverMode: 'custom'; coverUrl: string }> {
  const headers = {
    'Content-Type': file.type || 'image/webp',
    'x-file-name': encodeURIComponent(file.name),
  };
  const res = await apiClient.put(`/mybook/${bookId}/video-playlists/${playlistId}/cover`, file, { headers });
  return unwrapData(res);
}

export async function deletePlaylistCover(
  bookId: number,
  playlistId: number
): Promise<{ playlistId: number; coverMode: 'auto' }> {
  const res = await apiClient.delete(`/mybook/${bookId}/video-playlists/${playlistId}/cover`);
  return unwrapData(res);
}

// ----------------------------------------------------
// Public Readers Endpoints
// ----------------------------------------------------

export async function fetchPublicBookPlaylists(
  bookId: number | string,
  params?: { limit?: number; cursor?: string }
): Promise<{ items: BookVideoPlaylist[]; nextCursor: string | null; hasMore: boolean }> {
  const res = await apiClient.get(`/bookdetail/${bookId}/video-playlists`, { params });
  return unwrapData(res);
}

export async function fetchPublicPlaylistVideos(
  bookId: number | string,
  playlistId: number
): Promise<PublicPlaylistDetail> {
  const res = await apiClient.get(`/bookdetail/${bookId}/video-playlists/${playlistId}/videos`);
  return unwrapData(res);
}

export async function fetchPublicVideoPlayback(refId: number): Promise<VideoPlaybackInfo> {
  const res = await apiClient.get(`/video/playback`, {
    params: { type: 'book_video', ref_id: refId },
  });
  return unwrapData(res);
}

// ----------------------------------------------------
// Public Interactions (View, Like, Comment, Report)
// ----------------------------------------------------

export async function recordVideoView(refId: number): Promise<{ success: boolean }> {
  const res = await apiClient.post(`/video/interactions/view`, {
    type: 'book_video',
    refId,
  });
  return unwrapData(res);
}

export async function toggleVideoLike(refId: number): Promise<{ liked: boolean; likeCount: number }> {
  const res = await apiClient.post(`/video/interactions/like`, {
    type: 'book_video',
    refId,
  });
  return unwrapData(res);
}

export async function fetchVideoComments(
  refId: number,
  params?: { limit?: number; cursor?: string }
): Promise<{ items: VideoComment[]; nextCursor: string | null }> {
  const res = await apiClient.get(`/video/comments`, {
    params: { type: 'book_video', ref_id: refId, ...params },
  });
  return unwrapData(res);
}

export async function createVideoComment(refId: number, text: string): Promise<VideoComment> {
  const res = await apiClient.post(`/video/comments`, {
    type: 'book_video',
    refId,
    text,
  });
  return unwrapData(res);
}

export async function reportVideo(
  refId: number,
  presetId: number,
  detail?: string
): Promise<{ success: boolean }> {
  const res = await apiClient.post(`/video/reports`, {
    type: 'book_video',
    refId,
    presetId,
    detail,
  });
  return unwrapData(res);
}
