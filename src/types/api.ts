export enum BookCompletion {
  NOT_END = 'not_end',
  END = 'end',
}

export enum BookStatus {
  PUBLISH = 'publish',
  PRIVATE = 'private',
  DELETE = 'delete',
  WAIT = 'wait',
}

export enum BookType {
  WRITE = 'write',
  TRAN = 'tran',
  SOUND = 'sound',
  FANFIC = 'fanfic',
  CHAT = 'chat',
  WEBTOON = 'webtoon',
  FILM = 'film',
}

export interface WebsiteSettingsData {
  percent: string;
  address: string;
  work_time: string;
  phone: string;
  email: string;
  app_store: string;
  play_store: string;
  fb_link: string;
  line_link: string;
  ig_link: string;
  tiktok_link: string;
  twitter_link: string;
  yt_link: string;
  logo: string;
  img_error: string;
  img_footer: string;
  coin: string;
  freecoin: string;
  seo_title: string;
  seo_keyword: string;
  seo_description: string;
  [key: string]: string | undefined;
}

export interface WebsiteSettingsResponse {
  code: number;
  status: string;
  message: string;
  data: WebsiteSettingsData;
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
  'writer.user_id': number;
  'writer.userID': string;
  'writer.writer_name': string;
  'category1.name': string;
  'category2.name': string;
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

export interface Episode {
  ep_id: number;
  epID: string;
  name: string;
  coin: number;
  freecoin: number;
  publish_datetime: string;
  update_at: string;
  publish: string;
  view: number;
  order_by: number;
  isRead: boolean;
  isBuy: boolean;
}

// Episode Group
export interface EpisodeGroup {
  group_id: number;
  groupID: string;
  name: string;
  list: Episode[];
}

// API Response จาก /bookgroup/:bookid
export interface BookEpisodesResponse {
  code: number;
  status: string;
  message: string;
  data: {
    groups: EpisodeGroup[];
  };
}

// User Wallet/Coins (จาก user data)

export interface ArticleDetail {
  id: number;
  articleID: string;
  name: string;
  title: string;
  description: string;
  keywords: string;
  detail_1: string;
  detail_2: string;
  img: string;
  type: string;
  date_post: string;
  update_at: string;
  view: number;
  shared: number;
  post_by: string;
  tag: string;
  status: string;
  button1_img?: string;
  button1_type?: string;
  button1_data?: string;
  button2_img?: string;
  button2_type?: string;
  button2_data?: string;
  button3_img?: string;
  button3_type?: string;
  button3_data?: string;
}

export interface ArticleRecommend {
  id: number;
  name: string;
  img: string;
  view: number;
  update_at: string;
}

export interface ArticleResponse {
  code: number;
  status: string;
  message: string;
  data: {
    result: ArticleDetail[];
    listRecommend: ArticleRecommend[];
  };
}
export interface UserWallet {
  coin: string;           // เหรียญปกติ (มาเป็น string ต้องแปลงเป็น number)
  freecoin: string;       // เหรียญฟรี (มาเป็น string ต้องแปลงเป็น number)
  heart: number;          // หัวใจ
  flower: number;         // ดอกไม้
  coupon: number;         // คูปอง
  exp_point: number;      // แต้มประสบการณ์
  stamp: number;          // แสตมป์
  wheel: number;          // วงล้อ
  fast_ticket: number;    // ตั๋วอ่านเร็ว
  coinIncome: string;     // รายได้เหรียญ
}

export type TagType = 'new' | 'bestseller' | 'completed';

// API Response จาก /user/wallet หรือ user profile
export interface UserWalletResponse {
  code: number;
  status: string;
  message: string;
  data: UserWallet;
}

// Episode Content for Reading Page
export interface EpisodeContent {
  ep_id: number;
  epID: string;
  group_id: number;
  book_id: number;
  name: string;
  coin: number;
  freecoin: number;
  content_length: number | null;
  content_type: string;
  content: string | null;  // HTML content (deprecated, use 'des' instead)
  des: string;             // HTML content (main field for content)
  publish_datetime: string;
  update_at: string;
  publish: string;
  view: number;
  order_by: number;
  noti_add: string;
  isBuy?: boolean;
  prev_episode?: string;  // epID ของตอนก่อนหน้า
  next_episode?: string;  // epID ของตอนถัดไป
  book_name?: string;     // ชื่อหนังสือ (optional)
  bookID?: string;        // bookID (optional)
}

// API Response จาก /readep/:episodeId
export interface EpisodeContentResponse {
  code: number;
  status: string;
  message: string;
  data: EpisodeContent;
}

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
  'user.user_id': number;
  'user.userID': string;
  'user.fullname': string;
  'user.img': string;
  'category1.name': string;
  'category2.name': string;
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
}

export interface BookDetailResponse {
  code: number;
  status: string;
  message: string;
  data: BookDetail;
}



export interface CommentUser {
  fullname: string;
  img: string; // Avatar URL
  frame_img?: string | null; // Frame URL (optional/nullable)
  frame?: string | { img: string } | null; // Support for nested frame object or direct URL string
}

export interface CommentSubData {
  comment_sub_book_id?: number;
  comment_sub_ep_id?: number;
  comment_book_id?: number;
  comment: string; // HTML content
  user_id: number;
  update_at: string;
  status_number: number | null;
  user: CommentUser;
}

export interface CommentData {
  comment_book_id: number;
  book_id: number;
  user_id: number;
  star: number;
  unit_ep: number;
  comment: string;
  update_at: string;
  status_number: number | null;
  user: CommentUser;
  comment_sub_data: CommentSubData[];
}

export interface CommentEpData {
  comment_ep_id: number;
  book_id: number;
  ep_id: number;
  user_id: number;
  comment: string;
  update_at: string;
  status_number: number | null;
  user: CommentUser;
  comment_sub_data: CommentSubData[];
  ep_name?: string;
  sticker?: Sticker;
}

export interface CommentPagination {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  nextPage: number | null;
  prevPage: number | null;
}

export interface CommentResponseData {
  pagination: CommentPagination;
  comment_data: CommentData[] | CommentEpData[];
}

export interface CommentResponse {
  code: number;
  status: string;
  message: string;
  data: CommentResponseData;
}

export interface Sticker {
  stck_id: number;
  stck_set_id: number;
  order_by: number;
  img: string;
}

export interface StickerSet {
  stck_set_id: number;
  stck_set_name: string;
  status: string;
  sticker_list: Sticker[];
}

export interface StickerResponse {
  code: number;
  status: string;
  message: string;
  data: StickerSet[];
}


export interface Thread {
  topic_id: number;
  title: string;
  type: number;
  user_id: number;
  view: number;
  date_at: string;
  comment_count: number;
}

export interface ThreadPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}

export interface ThreadResponse {
  code: number;
  status: string;
  message: string;
  data: {
    paginate: ThreadPagination;
    list: Thread[];
  };
}

export interface CommentThreadSubData {
  comment_sub_topic_id: number;
  comment_topic_id: number;
  comment: string;
  user_id: number;
  update_at: string;
  user: CommentUser;
}

export interface CommentThreadData {
  comment_topic_id: number;
  topic_id: number;
  user_id: number;
  comment: string;
  update_at: string;
  user: CommentUser;
  comment_sub_data: CommentThreadSubData[];
  comment_sub_count: number;
}


export interface CampaignBook {
  book_id: number;
  name: string;
  img: string;
  user_id: number;
  view: number;
  end: string;
  status: string;
  tag: string;
  img_full: string | null;
  bgimg: string | null;
  writer_name: string;
  chapter: number;
  shelve_count: number;
  isBestSeller: boolean;
  isNew: boolean;
  isNewEp: boolean;
  discount: number | null;
}

export interface CampaignDetailData {
  cp_id: number;
  name: string;
  detail: string;
  start_date: string;
  end_date: string;
  img_banner: string;
  img_banner2: string | null;
  img_shelf: string | null;
  color_bg: string;
  img_card: string[];
  status: string;
  ref_id: string;
  books: CampaignBook[];
}

export interface CampaignDetailResponse {
  code: number;
  status: string;
  message: string;
  data: CampaignDetailData;
}

export interface StorePack {
  store_pack_id: number;
  store_id: number;
  name: string;
  detail: string;
  img: string;
  price: number;
  type_use: string;
  type: string;
  start_date: string;
  end_date: string;
  order_by: number;
  items_description?: string;
  purchased_count?: number;
  limit_count?: number;
  can_purchase?: boolean;
  remaining_count?: number;
}

export interface StoreCategory {
  store_id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  order_by: number;
  StorePacks: StorePack[];
}


export interface StoreResponse {
  code: number;
  status: string;
  message: string;
  data: StoreCategory[];
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

// Category Book List
export interface CategoryBook {
  book_id: number;
  name: string;
  title: string;
  img: string;
  user_id: number;
  view: number;
  end: string;
  status: string;
  tag: string;
  img_full: string;
  bgimg: string | null;
  writer_name: string;
  chapter: number;
  shelve_count: number;
  isBestSeller: boolean;
  isNew: boolean;
  isNewEp: boolean;
  discount: number | null;
  discount_ep_count: number | null;
}

export interface CategoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}

export interface CategoryBanner {
  id: number;
  name: string;
  color: string[];
  img_bg: string;
}

export interface CategoryBookListResponse {
  code: number;
  status: string;
  message: string;
  data: {
    pagination: CategoryPagination;
    books: CategoryBook[];
    banner: CategoryBanner;
  };
}

export interface CategoryDetail {
  id: number;
  name: string;
  description: string;
  color: string[];
  img_bg: string;
  order_by: number;
}

export interface CategoryAllResponse {
  code: number;
  status: string;
  message: string;
  data: CategoryDetail[];
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

export interface CampaignDiscount {
  cp_id: number;
  img_banner: string | null;
}

export interface PackCampaignBook {
  book_id: number;
  name: string;
  title: string;
  img: string;
  user_id: number;
  view: number;
  end: string;
  status: string;
  tag: string[];
  date_at: string;
  img_full: string;
  bgimg: string | null;
  writer_name: string;
  chapter: number;
  shelve_count: number;
  isBestSeller: boolean;
  isNew: boolean;
  isNewEp: boolean;
  discount: number;
  discount_ep_count: number | null;
  pack_campaign_item_id: number;
  order_by: number;
  has_pack: boolean;
  pack_book_id: number | null;
}

export interface PackCampaignDetail {
  id: number;
  name: string;
  detail: string;
  banner_img: string;
  start_date: string;
  end_date: string;
  books: PackCampaignBook[];
}

export interface BookPromotionOption {
  type: 'NORMAL' | 'BUNDLE';
  title_prefix: string;
  book_id: number;
  name: string;
  title: string;
  img: string;
  user_id: number;
  view: number;
  end: string;
  status: string;
  tag: string;
  date_at: string;
  img_full: string;
  bgimg: string | null;
  writer_name: string;
  chapter: number;
  shelve_count: number;
  isBestSeller: boolean;
  isNew: boolean;
  isNewEp: boolean;
  discount: number;
  discount_ep_count: number | null;
  promotion_data: {
    dfb_id: number;
    currency: string;
  };
  global: {
    global_discounted_price: number;
    global_full_price: number;
    global_paid_chapter_count: number;
  };
  user: {
    user_price: number;
    user_full_price: number;
    user_saved_price: number;
    user_chapter_received: number;
    user_owned_count: number;
    user_coin: number;
    user_freecoin: number;
  };
}
