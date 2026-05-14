import type { PackCampaignBook } from "./campaign";

/**
 * Comprehensive Book Data interface.
 * Handles field variations from different API endpoints.
 */
export interface BookData {
  book_id?: number | string;
  bookID?: number | string;
  id?: number | string;
  img?: string;
  imgtn?: string;
  imgtn_url?: string;
  img_full?: string;
  img_gif?: string;
  img_gif_full?: string;
  cover?: string;
  name?: string;
  title?: string;
  author?: string;
  writer_name?: string;
  user_name?: string;
  writer?: {
    user_id: number;
    writer_name: string;
    img?: string;
    isFollowing?: boolean;
  } | null;
  view?: number | string;
  chapter?: number | string;
  shelve_count?: number | string;
  star?: number | string;
  heart?: number;
  flower?: number;
  comment?: number;
  category?: string;
  category2?: string;
  cat1?: number;
  cat2?: number;
  tag?: string | string[];
  description?: string;
  des?: string;
  status?: string;
  end?: string;
  use_coin?: number;
  use_freecoin?: number;
  type?: string;
  update_at?: string;
  date_at?: string;
  created_at?: string;
  rate?: number;
  bgimg?: string;
  discount?: number;
  discount_full_book?: unknown;
  remaining_paid_count?: number;
  remaining_paid_total?: number;
  remaining_promo_count?: number;
  remaining_promo_total?: number;
  isFollowing?: boolean;
  isAddedToShelf?: boolean;
  last_read_ep?: number;
  is_pin?: boolean;
  [key: string]: unknown;
}

export interface NormalizedBook {
  book_id: number | string;
  bookID: number | string;
  img: string;
  name: string;
  title: string;
  author: string;
  view: number;
  chapter: number;
  tag: string;
  category?: string;
  category2?: string;
  description?: string;
  status?: string;
  end?: string;
  use_coin?: number;
  use_freecoin?: number;
  writer?: {
    user_id: number;
    writer_name: string;
    img: string;
    isFollowing?: boolean;
  } | null;
  shelve_count?: number;
  star?: number;
  discount?: number;
}

export enum BookCompletion {
  NOT_END = "not_end",
  END = "end",
}

export enum BookStatus {
  PUBLISH = "publish",
  PRIVATE = "private",
  DELETE = "delete",
  WAIT = "wait",
}

export enum BookType {
  WRITE = "write",
  TRAN = "tran",
  SOUND = "sound",
  FANFIC = "fanfic",
  CHAT = "chat",
  WEBTOON = "webtoon",
  FILM = "film",
}

export interface BookTrans {
  book_id: number;
  bookID: string;
  type: string;
  img: string;
  img_full: string;
  name: string;
  title: string;
  tag: string[];
  cat1: number;
  cat2: number;
  rate: number;
  des: string;
  user_id: number;
  update_at: string;
  status: string;
  view: number;
  date_at: string;
  heart: number;
  flower: number;
  end: string;
  bgimg: string;
  noti_add: string;
  accept_conditions: string;
  use_freecoin: number;
  fast_status: number;
  "writer.user_id": number;
  "writer.userID": string;
  "writer.writer_name": string;
  "category1.name": string;
  "category2.name": string;
  comment: number;
  chapter: number;
  shelve_count: number;
  discount_full_book: DiscountFullBook | null;
  remaining_paid_count: number;
  remaining_paid_total: number;
  remaining_paid_total_discount: number;
  remaining_promo_count: number;
  remaining_promo_total: number;
  remaining_promo_total_discount: number;
  isFollowing: boolean;
}

export interface EpisodeEarlyAccessMethod {
  price?: number;
  daily_increase?: number;
  use?: boolean;
}

export interface Episode {
  ep_id: number;
  epID: string;
  name: string;
  coin: number;
  freecoin: number;
  isFastTicket?: boolean;
  isFast_buyable?: boolean;
  early_access?: {
    fast_ticket?: boolean | EpisodeEarlyAccessMethod;
    fast_coin?: boolean | EpisodeEarlyAccessMethod;
    isFast_buyable?: boolean;
    fastTicketPrice?: number;
    fastCoinPrice?: number;
  };
  publish_datetime: string;
  update_at: string;
  publish: string;
  view: number;
  order_by: number;
  isRead: boolean;
  isBuy: boolean;
}

export interface EpisodeGroup {
  group_id: number;
  groupID: string;
  name: string;
  list: Episode[];
}

export interface BookEpisodesResponse {
  code: number;
  status: string;
  message: string;
  data: {
    groups: EpisodeGroup[];
  };
}

export type TagType = "new" | "bestseller" | "completed";

export interface DiscountFullBook {
  dfb_id: number;
  subject: string;
  book_id: number;
  groupIDs: string;
  start_date: string;
  end_date: string;
  update_at: string;
  discount_percent: number;
  status: string;
  rewards?: DiscountReward[] | null;
}

export interface DiscountReward {
  id: number;
  dfb_id: number;
  item_type: string;
  item_id: string | null;
  amount: number;
  start_date: string | null;
  end_date: string | null;
  order_by: number;
  create_at: string;
  update_at: string;
  img: string;
  name: string;
}

export interface EpPurchaseRewardCampaign {
  campaign_id: number;
  buy_count: number;
  reward_count: number;
  badge_label: string;
  display_title: string;
  display_description: string;
  icon_url: string | null;
  detail_text: string;
  start_date: string;
  end_date: string | null;
}

export interface EpPurchaseRewardInfo {
  has_promotion: boolean;
  campaign?: EpPurchaseRewardCampaign | null;
  img?: string | null;
}

export interface BookDetail {
  book_id: number;
  bookID: string;
  type: string;
  img: string;
  img_full: string;
  name: string;
  title: string;
  tag: string[];
  cat1: number;
  cat2: number;
  rate: number;
  des: string;
  user_id: number;
  update_at: string;
  status: string;
  view: number;
  date_at: string;
  heart: number;
  flower: number;
  end: string;
  bgimg: string;
  noti_add: string;
  accept_conditions: string;
  use_freecoin: number;
  fast_status: number;
  "user.user_id": number;
  "user.userID": string;
  "user.fullname": string;
  "user.img": string;
  "category1.name": string;
  "category2.name": string;
  comment: number;
  chapter: number;
  shelveCount: number;
  discount_full_book: DiscountFullBook | null;
  remaining_paid_count: number;
  remaining_paid_total: number;
  remaining_paid_total_discount: number;
  remaining_promo_count: number;
  remaining_promo_total: number;
  remaining_promo_total_discount: number;
  isFollowing: boolean;
  star: number;
  video: BookDetailVideo;
  ep_purchase_reward?: EpPurchaseRewardInfo | null;
}

export interface BookDetailVideo {
  original: string;
}

export interface BookDetailResponse {
  code: number;
  status: string;
  message: string;
  data: BookDetail;
}

export interface FastTicket {
  can_buy: boolean;
  user_ticket_balance: number;
  ep_count: number;
  remaining_count: number;
  remaining_total: number;
  web_enabled: boolean;
  book_enabled: boolean;
}

export interface BookPurchaseDetails {
  discount_full_book: DiscountFullBook | null;
  remaining_paid_count: number;
  remaining_paid_total: number;
  remaining_paid_total_discount: number;
  remaining_promo_count: number;
  remaining_promo_total: number;
  remaining_promo_total_discount: number;
  fast_ticket: FastTicket;
  total_remaining_count: number;
  total_remaining_total: number;
}

export interface BookPurchaseDetailsResponse {
  code: number;
  status: string;
  message: string;
  data: BookPurchaseDetails;
}

export interface LatestReadEpisodeResponse {
  code: number;
  status: string;
  message: string;
  data: {
    ep_id: number | {
      status: string;
      data: {
        ep_id: number;
        isRead: boolean;
      };
    };
    isRead: boolean;
  };
}

export interface UniversalBook extends Partial<BookTrans>, Partial<PackCampaignBook> {
  book_id?: number;
  bookID?: string;
  img?: string;
  ep_purchase_reward?: EpPurchaseRewardInfo | null;
  name?: string;
  title?: string;
  writer_name?: string;
  writer?: string;
  author?: string;
  view?: number;
  end?: string;
  chapter?: number;
  shelveCount?: number;
  shelve_count?: number;
  shelf_count?: number;
  shelfCount?: number;
  discount_ep_count?: number | null;
  tag?: any;
  status?: string;
  isBestSeller?: boolean;
  isNew?: boolean;
  isNewEp?: boolean;
  discount?: number;
  bgimg?: any;
  [key: string]: any;
}

export interface NovelCardItem {
  bookID: string;
  img: string;
  name: string;
  user_id: string;
  view: number;
  type: string;
}
