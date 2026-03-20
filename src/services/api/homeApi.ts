
import apiClient from "../apiClient";
import type { BookTrans } from "@/types/api";
import { parseJwtToken } from "@/utils/jwtParser";

export interface Slide {
  banner_id: number;
  name: string;
  img: string;
  type?: string;
  type_link: string;
  ref_id: string;
  order_by: number;
  status: string;
  click: number;
  start_date: string;
  end_date: string;
  update_at: string;
}
export interface PopupItem {
  popup_id: number;
  name: string;
  img: string;
  type_link: string;
  txt: string;
  ref_id?: number | string;
}

export interface GroupBookHomeItem {
  home_group_id: number;
  name: string;
  type: string;
  order_by: number;
  update_at: string;
  list: BookTrans[];
}

export interface HomeDataResponse {
  code: number;
  status: string;
  message: string;
  data: {
    slides: Slide[];
    popup?: PopupItem[];
    groupBookHome?: GroupBookHomeItem[];
    spotlight?: BookTrans[];
  };
}

export interface BookUpdate {
  book_id: number;
  name: string;
  img: string;
  img_full: string;
  writer_name: string;
  view: number;
  chapter: number;
  shelve_count: number;
  BookTranEps: {
    ep_id: string;
    name: string;
    publish_datetime: string;
    isNew?: boolean;
  }[];
}

export const fetchHomeData = async (token?: string | null): Promise<HomeDataResponse | null> => {
  try {
    const cleanedToken = parseJwtToken(token);
    const config = cleanedToken ? { headers: { Authorization: cleanedToken } } : undefined;
    const response = await apiClient.get<HomeDataResponse>("/getAllBookHome", config);
    return response.data;
  } catch {
    return null;
  }
}

export const fetchBookUpdates = async (): Promise<BookUpdate[]> => {
  try {
    const response = await apiClient.get<{ data: BookUpdate[] }>("/getBookUpdate");
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch {
    return [];
  }
};
