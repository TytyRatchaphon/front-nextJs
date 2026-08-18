// TypeScript Definitions for Book Video Playlist Feature (book-story.md)

export type BookVideoStatus = 
  | 'uploading'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'deleted';

export type PlaylistPublishStatus = 'published' | 'unpublished';

export type PlaylistCoverMode = 'auto' | 'custom';

export interface BookVideoConfig {
  upload: {
    maxBytes: number;
    maxDurationSeconds: number;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
    resumable: boolean;
  };
  playlistCover: {
    maxBytes: number;
    width: number;
    height: number;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
    outputFormat: string;
  };
  reorderMaxItems: number;
}

export interface BookVideoItem {
  id: number;
  bookId: number;
  title: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  status: BookVideoStatus;
  processingProgressPercent: number;
  processingStage: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookVideoPlaylist {
  id: number;
  bookId: number;
  name: string;
  coverMode: PlaylistCoverMode;
  coverUrl: string | null;
  publishStatus: PlaylistPublishStatus;
  videoCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  videos?: BookVideoItem[];
}

export interface PublicVideo {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
}

export interface PublicPlaylistDetail {
  playlist: {
    id: number;
    name: string;
    coverUrl: string | null;
  };
  videos: {
    items: PublicVideo[];
    activeRefId: number | null;
    activeIndex: number;
    pagination: {
      totalItems: number;
      nextCursor: string | null;
      prevCursor: string | null;
      hasMore: boolean;
    };
  };
}

export interface VideoPlaybackInfo {
  type: 'book_video';
  refId: number;
  expiresAt: number;
  hlsUrl: string | null;
  dashUrl: string | null;
}

export interface SocketBookVideoUpdate {
  videoId: number;
  status: BookVideoStatus;
  progress: number;
  stage: string | null;
  jobId?: string;
  attempt?: number;
  maxAttempts?: number;
  error?: {
    code: string;
    message: string;
  } | null;
  updatedAt: string;
}

export interface VideoComment {
  id: number;
  refId: number;
  userId: number;
  userNickname: string;
  userAvatarUrl: string | null;
  text: string;
  createdAt: string;
  repliesCount?: number;
}
