export interface CommentUser {
  fullname: string;
  img: string;
  frame_img?: string | null;
  frame?: string | { img: string } | null;
}

export interface CommentSubData {
  comment_sub_book_id?: number;
  comment_sub_ep_id?: number;
  comment_book_id?: number;
  comment: string;
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
