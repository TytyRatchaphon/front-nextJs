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
  limit_unit?: number;
  limit_unit_month?: number;
  limit_unit_day?: number;
  is_selection?: boolean;
  selection_limit?: number | null;
  selectable_options?: StorePackSelectableOption[];
}

export interface StorePackSelectableOption {
  store_pack_list_id: number;
  store_pack_id: number;
  type: string;
  refer_id: string;
  unit: number;
  status: string;
  item_name: string;
  item_img: string;
  book_id: number;
  can_select: boolean;
  selected: boolean;
}

export interface StoreCategory {
  store_id: number;
  name: string;
  banner?: string | null;
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
