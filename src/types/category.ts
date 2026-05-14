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
    banner?: CategoryBanner | null;
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
