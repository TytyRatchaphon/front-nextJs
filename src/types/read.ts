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
  content: string | null;
  des: string;
  publish_datetime: string;
  update_at: string;
  publish: string;
  view: number;
  order_by: number;
  noti_add: string;
  isBuy?: boolean;
  prev_episode?: string;
  next_episode?: string;
  book_name?: string;
  bookID?: string;
}

export interface EpisodeContentResponse {
  code: number;
  status: string;
  message: string;
  data: EpisodeContent;
}
