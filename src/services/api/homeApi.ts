
import apiClient from "../apiClient";
import type { BookTrans } from "@/types/api";
import { parseJwtToken } from "@/utils/jwtParser";
import { homeSchemas } from "./apiResponseSchemas";
import { validateApiPayload } from "./apiResponseValidation";
import { logApiError } from "@/utils/apiErrorLogger";

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
  position?: "center" | "bottom_right" | string;
}

export interface GroupBookHomeItem {
  home_group_id?: number;
  user_bookhome_section?: number;
  name: string;
  name_web?: string;
  type: string;
  content_type?: string;
  order_by: number;
  update_at: string;
  ref_ids?: string;
  pre_countdown_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  countdown_date?: string;
  countdown_text?: string;
  labeltag?: string;
  link?: string;
  img?: string | null;
  can_follow?: boolean;
  is_followed?: boolean;
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

export type BookUpdateTab = "novel" | "novel_pack" | "trancn" | "fiction";

const BOOK_UPDATE_TABS = new Set<BookUpdateTab>(["novel", "novel_pack", "trancn", "fiction"]);

export const normalizeBookUpdateTab = (tab?: string | null): BookUpdateTab => (
  BOOK_UPDATE_TABS.has(tab as BookUpdateTab) ? (tab as BookUpdateTab) : "novel"
);

export const fetchHomeData = async (
  token?: string | null,
  contentType?: string,
  options?: { skipAuth?: boolean },
): Promise<HomeDataResponse | null> => {
  try {
    const cleanedToken = parseJwtToken(token);
    const headers: Record<string, string> = {};
    if (cleanedToken && !options?.skipAuth) {
      headers.Authorization = cleanedToken;
    }
    if (options?.skipAuth) {
      headers['x-skip-auth'] = 'true';
    }

    const config = {
      ...(Object.keys(headers).length ? { headers } : {}),
      ...(contentType ? { params: { content_type: contentType } } : {}),
    };
    const response = await apiClient.get<HomeDataResponse>("/getAllBookHome", config);
    return validateApiPayload(homeSchemas.homeData, response.data, "/getAllBookHome") as unknown as HomeDataResponse;
  } catch (error) {
    logApiError('fetchHomeData', error);
    return null;
  }
}

export const trackUserBookhomeSectionClick = async ({
  userBookhomeSection,
  bookId,
  token,
}: {
  userBookhomeSection?: number | string | null;
  bookId?: number | string | null;
  token?: string | null;
}) => {
  const cleanedToken = parseJwtToken(token);
  if (!cleanedToken || !userBookhomeSection || !bookId) return;

  try {
    await apiClient.post(
      "/user-bookhome-section/click",
      {
        user_bookhome_section: userBookhomeSection,
        book_id: bookId,
      },
      {
        headers: { Authorization: cleanedToken },
      },
    );
  } catch (error) {
    console.warn("track user bookhome section click failed", error);
  }
};

export const fetchBookUpdates = async (tab?: string | null): Promise<BookUpdate[]> => {
  try {
    const normalizedTab = normalizeBookUpdateTab(tab);
    const response = await apiClient.get<{ data: BookUpdate[] }>("/getBookUpdate", {
      params: { tab: normalizedTab },
    });
    const payload = validateApiPayload(homeSchemas.bookUpdates, response.data, "/getBookUpdate");
    return payload.data as unknown as BookUpdate[];
  } catch (error) {
    logApiError('fetchBookUpdates', error);
    return [];
  }
};
