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

export interface BookTrans {
  book_id: number; // int(10), AUTO_INCREMENT
  bookID: string; // varchar(100)
  type: BookType; // enum(...)
  img: string; // varchar(255)
  name: string; // varchar(255)
  title: string; // text
  tag: string; // text
  cat1: number; // tinyint(4)
  cat2: number; // tinyint(4)
  rate: number; // tinyint(4)
  des: string | null; // text, Nullable
  user_id: number; // int(11)
  status: BookStatus; // enum(...)
  view: number; // int(11)
  dateAt: Date | string | null; // datetime, Nullable (จาก 'date_at')
  updateAt: Date | string | null; // datetime, Nullable (จาก 'update_at')
  heart: number; // int(11)
  flower: number; // int(11)
  end: BookCompletion; // enum(...)
  bgimg: string | null; // varchar(255), Nullable
  notiAdd: 'yes' | 'no'; // enum('yes','no') (จาก 'noti_add')
  acceptConditions: string | null; // varchar(20), Nullable (จาก 'accept_conditions')
  userFreecoin: number | null; // tinyint(4), Nullable (จาก 'user_freecoin')
  fastStatus: number; // tinyint(4) (จาก 'fast_status')
  createdAt: Date | string; // datetime
  updatedAt: Date | string; // datetime
}

// Banner/Slide interface
export interface BannerSlide {
  banner_id: number;
  name: string;
  img: string;
  type_link: string;
  ref_id: string;
  order_by: number;
  status: string;
  click: number;
  start_date: string;
  end_date: string;
  update_at: string;
}

// API Response จาก /getAllBookHome
export interface AllBooksHomeResponse {
  code: number;
  status: string;
  message: string;
  data: {
    slides: BannerSlide[];
    groupBookHome?: any[];
    bookNew?: any[];
    recommend?: any[];
    top10?: any[];
    bestseller?: any[];
  };
}

// Book Detail Data
export interface BookDetail {
  book_id: number;
  bookID: string;
  type: string;
  img: string;
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
  discount_full_book: number | null;
}

// API Response จาก /bookdetail/:bookid
export interface BookDetailResponse {
  code: number;
  status: string;
  message: string;
  data: BookDetail;
}

// Book Item สำหรับ getAllBook
export interface BookItem {
  book_id: number;
  bookID: string;
  type: string;
  img: string;
  name: string;
  title: string;
  tag: string;
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
}

// API Response จาก /getAllBook
export interface AllBooksResponse {
  code: number;
  status: string;
  message: string;
  data: {
    items: BookItem[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Episode/Chapter Item
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