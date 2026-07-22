/**
 * Video Trailer API Service
 *
 * Handles video trailer playback, upload, status polling, and management.
 */

import apiClient from '@/services/apiClient';

// =============================================
// Playback Types (used by public book detail page via useBookTrailer)
// =============================================

export interface TrailerPlaybackSource {
  type: string;
  mimeType: string;
  url: string;
  isPreferred?: boolean;
}

export interface TrailerPlaybackResponse {
  hlsUrl: string;
  expiresAt: number;
  preferredSource?: TrailerPlaybackSource | null;
  sources?: TrailerPlaybackSource[];
}

/**
 * Fetch a fresh signed playback URL for a trailer.
 * Used by the public book detail page when the current URL has expired or returned 403.
 */
export async function fetchTrailerPlayback(trailerId: number): Promise<TrailerPlaybackResponse> {
  const response = await apiClient.get<{ code: number; data: TrailerPlaybackResponse }>(
    `/video/trailers/${trailerId}/playback`,
  );

  const data = response.data?.data ?? response.data;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid trailer playback response');
  }

  return data as TrailerPlaybackResponse;
}

// =============================================
// Book Video Status Types (from GET /user/mybook/:bookId)
// =============================================

export interface VideoCurrentInfo {
  trailerId: number;
  status: string;
  hlsUrl?: string | null;
  dashUrl?: string | null;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface VideoUploadSession {
  sessionId: string;
  status: string;
  totalSize: number;
  partSize: number;
  totalParts: number;
  expiresAt: string;
}

export interface VideoPendingInfo {
  trailerId: number;
  status: 'uploading' | 'completing' | 'queued' | 'processing';
  progressPercent?: number;
  progressStage?: string;
  hlsUrl?: string | null;
  dashUrl?: string | null;
  session?: VideoUploadSession | null;
}

export interface VideoFailedInfo {
  trailerId: number;
  status: 'failed';
  errorCode?: string;
  errorMessage?: string;
}

export interface BookVideoStatus {
  canManage: boolean;
  canUpload: boolean;
  current: VideoCurrentInfo | null;
  pending: VideoPendingInfo | null;
  lastFailed: VideoFailedInfo | null;
}

// =============================================
// Upload Config Types
// =============================================

export interface TrailerConfigResponse {
  maxUploadBytes: number;
  maxDurationSeconds: number;
  partSizeBytes: number;
  uploadSessionTtlHours: number;
  supportedMimeTypes: string[];
}

// =============================================
// Upload Request/Response Types
// =============================================

export interface InitiateUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface InitiateUploadResponse {
  sessionId: string;
  trailerId: number;
  partSize: number;
  totalParts: number;
}

export interface UploadPartResponse {
  partNumber: number;
  etag: string;
  bytesReceived: number;
  uploadedParts: number;
}

// =============================================
// Status Polling Types
// =============================================

export interface TrailerStatusResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'replaced' | 'deleted';
  progressPercent?: number;
  progressStage?: string;
  errorCode?: string;
  errorMessage?: string;
  hlsUrl?: string;
}

/** Terminal statuses that mean polling should stop */
export const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled', 'replaced', 'deleted'] as const;

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

// =============================================
// API Functions
// =============================================

// --- Upload Config ---

export async function getTrailerConfig(): Promise<TrailerConfigResponse> {
  const response = await apiClient.get<{ data: TrailerConfigResponse }>('/video/trailers/config');
  return response.data?.data ?? (response.data as any);
}

// --- Book Video Status ---

export async function getBookVideoStatus(bookId: number): Promise<BookVideoStatus> {
  const response = await apiClient.get(`/user/mybook/${bookId}`);
  const video = response.data?.data?.video;
  return video ?? { canManage: false, canUpload: false, current: null, pending: null, lastFailed: null };
}

// --- Upload APIs (book-scoped) ---

export async function initiateTrailerUpload(bookId: number, request: InitiateUploadRequest): Promise<InitiateUploadResponse> {
  const response = await apiClient.post<{ data: InitiateUploadResponse }>(
    `/user/mybook/${bookId}/video/uploads/initiate`,
    request
  );
  return response.data?.data ?? (response.data as any);
}

export async function uploadTrailerPart(
  bookId: number,
  sessionId: string,
  partNumber: number,
  blob: Blob,
): Promise<UploadPartResponse> {
  const response = await apiClient.put<{ data: UploadPartResponse }>(
    `/user/mybook/${bookId}/video/uploads/${sessionId}/parts/${partNumber}`,
    blob,
    {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      timeout: 300000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );
  return response.data?.data ?? (response.data as any);
}

export async function completeTrailerUpload(bookId: number, sessionId: string): Promise<void> {
  await apiClient.post(
    `/user/mybook/${bookId}/video/uploads/${sessionId}/complete`,
    {}
  );
}

// --- Status Polling ---

export async function getTrailerStatus(bookId: number, trailerId: number): Promise<TrailerStatusResponse> {
  const response = await apiClient.get<{ data: TrailerStatusResponse }>(
    `/user/mybook/${bookId}/video/${trailerId}/status`
  );
  return response.data?.data ?? (response.data as any);
}

// --- Delete / Retry / Cancel ---

export async function deleteTrailer(bookId: number, trailerId: number): Promise<void> {
  await apiClient.delete(`/user/mybook/${bookId}/video/${trailerId}`);
}

export async function retryTrailer(bookId: number, trailerId: number): Promise<void> {
  await apiClient.post(`/user/mybook/${bookId}/video/${trailerId}/retry`);
}

export async function cancelUploadSession(bookId: number, sessionId: string): Promise<void> {
  await apiClient.delete(`/user/mybook/${bookId}/video/uploads/${sessionId}`);
}
