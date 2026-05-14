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
  type: "NORMAL" | "BUNDLE";
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
