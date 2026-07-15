export type StoryGroupType = 'user' | 'admin' | 'trailer';
export type StorySectionType = 'own' | 'admin' | 'following' | 'trailer_discovery';
export type StoryItemType = 'video_story_items' | 'book_video_trailer';
export type StoryUploadStatusType = 'queued' | 'processing' | 'completed' | 'failed' | 'deleted';
export type StoryDisplayStatus = 'all' | 'processing' | 'scheduled' | 'showing' | 'ended' | 'hidden' | 'failed' | 'cancelled';

export interface StoryUser {
  user_id: number;
  userID: string;
  fullname: string;
  writer_name: string;
  display_name: string;
  profile_image: string;
}

export interface StoryLink {
  label: string;
  url: string;
  order_by?: number;
  target_type?: string;
  book_id?: number;
  bookID?: string;
}

export interface StoryItem {
  type: StoryItemType;
  ref_id: number;
  thumbnail_url: string;
  hls_url: string;
  dash_url: string;
  playback_expires_at?: number;
  is_viewed: boolean;
  is_liked: boolean;
  view_count?: number | null;
  like_count?: number | null;
  links: StoryLink[];
}

export interface StoryGroup {
  groupType: StoryGroupType;
  groupId: string;
  section: StorySectionType;
  user_id: number;
  user: StoryUser;
  hasUnseen: boolean;
  totalItems: number;
  preview: StoryItem;
}

export interface StoryBarResponse {
  items: StoryGroup[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
  sections: {
    admin: number;
    following: number;
    trailerDiscovery: number;
  };
}

export interface StoryGroupItemsResponse {
  groupType: StoryGroupType;
  groupId: string;
  startRefId: number;
  startIndex: number;
  items: StoryItem[];
}

export interface StoryInteractionResponse {
  type: StoryItemType;
  ref_id: number;
  is_viewed: boolean;
  view_count: number | null;
  viewer_view_count: number;
  is_liked: boolean;
  skipped: boolean;
  skip_reason?: string;
  like_count?: number | null; // From like endpoin
}

export interface StoryPlaybackRefreshResponse {
  type: StoryItemType;
  refId: number;
  expiresAt: number;
  hlsUrl: string;
  dashUrl: string;
  thumbnailUrl: string;
}

export interface StoryConfig {
  maxUploadBytes: number;
  maxDurationSeconds: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxCtaLinks: number;
  isAdmin: boolean;
  manageVideoStory: boolean;
  canUploadStory: boolean;
  canUploadAdminStory: boolean;
  activeHours?: number;
}

export interface StoryUploadStatusResponse {
  id: number;
  status: StoryUploadStatusType;
  thumbnailUrl?: string;
  hlsManifestPath?: string;
  dashManifestPath?: string;
  bullmqJobId?: string;
  processingProgress?: {
    percent: number;
    stage: string;
    updatedAt: string;
  };
  processingJob?: {
    id: string;
    state: string;
    attemptsMade: number;
    failedReason: string | null;
  };
}

export interface StoryUploadResponse {
  id?: number;
  storyItemId?: number;
  story_item_id?: number;
  storyItem?: {
    id: number;
  };
}

export interface StoryInsightViewer {
  user?: StoryUser;
  guest_device_id?: string;
  view_count: number;
  is_liked: boolean;
  viewed_at: string;
  reacted_at: string;
}

export interface StoryInsightsResponse {
  story_item_id: number;
  view_count: number;
  like_count: number;
  total_viewers: number;
  total_likers: number;
  viewers: StoryInsightViewer[];
  likers: StoryInsightViewer[];
}

export interface VideoCommentUser {
  user_id: number;
  fullname: string;
  img?: string | null;
  frame?: {
    frame_id: number;
    name: string;
    img: string;
  } | null;
}

export interface VideoComment {
  id: number;
  type: string;
  ref_id: number;
  user_id: number;
  user: VideoCommentUser;
  text: string;
  display_text?: string;
  reply_count: number;
  like_count: number;
  is_liked: boolean;
  can_delete?: boolean;
  can_report?: boolean;
  is_owner?: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoCommentResponse {
  items: VideoComment[];
  next_cursor?: string | null;
  total: number;
}

export interface VideoCommentReplyResponse {
  items: VideoComment[];
  next_cursor?: string | null;
  total: number;
}

export type VideoCommentCreateResponse = VideoComment;

export interface VideoCommentDeleteResponse {
  success?: boolean;
}

export interface VideoCommentReportResponse {
  created?: boolean;
}

// --- Management API Types ---

export interface StoryPlaybackData {
  hlsUrl: string;
  dashUrl: string;
  expiresAt: number;
}

export interface StoryManageItem {
  id: number;
  userId: number;
  sourceType: 'user' | 'admin';
  status: StoryUploadStatusType;
  publishStatus: 'active' | 'hidden';
  displayStatus: StoryDisplayStatus;
  priority: number;
  originalFileName: string;
  originalFileSize: number;
  originalMimeType: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  createdAt: string; // ISO Date string
  playback?: StoryPlaybackData;
  links?: StoryLink[]; // Returned in detail
}

export interface StoryManageCounts {
  all: number;
  processing: number;
  scheduled: number;
  showing: number;
  ended: number;
  hidden: number;
  failed: number;
  cancelled: number;
}

export interface StoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
  hasNextPage: boolean;
}

export interface StoryManageResponse {
  items: StoryManageItem[];
  counts: StoryManageCounts;
  pagination: StoryPagination;
}

export interface StoryViewersResponse {
  story_item_id: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  viewers: StoryInsightViewer[];
  pagination: StoryPagination;
}

export interface StoryLinkResponse {
  id: number;
  label: string;
  url: string;
  orderBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoryLinksManageResponse {
  storyItemId: number;
  links: StoryLinkResponse[];
}
