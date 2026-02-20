
import apiClient from "./apiClient";
import axios from 'axios';
import type { WebsiteSettingsResponse } from "@/types/api";
import Cookies from 'js-cookie';
import type { BookTrans, BookDetail, BookDetailResponse, CommentResponse, CommentData, CommentEpData, StickerSet, StickerResponse, ThreadResponse, ArticleResponse, CampaignDetailResponse, CampaignDetailData, StoreCategory, StoreResponse, BookPurchaseDetailsResponse, CategoryBookListResponse, CategoryDetail, CategoryAllResponse, LatestReadEpisodeResponse, CampaignDiscount, PackCampaignDetail, BookPromotionOption } from "@/types/api";
import { getErrorMessage } from "@/types/errors";

export const fetchPackCampaignDetail = async (id: string): Promise<PackCampaignDetail | null> => {
  try {
    const response = await apiClient.get<{ code: number; data: PackCampaignDetail }>(`/pack-campaign/${id}`);
    if (response.data?.code !== 200) {
      return null;
    }
    return response.data.data;
  } catch (error) {
    return null;
  }
}


export const fetchCampaignsDiscount = async (): Promise<CampaignDiscount[]> => {
  try {
    const response = await apiClient.get<{ code: number; data: CampaignDiscount[] }>("/campaigns-discount");
    if (response.data?.code !== 200) {
      return [];
    }
    return response.data.data || [];
  } catch (error) {
    return [];
  }
}


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



export interface PromotingGroup {
  id: number;
  name: string;
  banner: string;
  status: number;
  publish_date: string;
  update_at: string;
}

export const fetchPromotingGroups = async (): Promise<PromotingGroup[]> => {
  try {
    const response = await apiClient.get<{ code: number; data: PromotingGroup[] }>("/promoting-groups");
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
};

export interface PromotingBook {
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
  discount: any;
  discount_ep_count: any;
}

export interface PromotingBlock {
  id: number;
  block_name?: string;
  group_id: number;
  type: string;
  banner: string;
  book: string;
  order_by: number;
  update_at: string;
  books: PromotingBook[];
  total_books: number;
  has_more: boolean;
}

export interface PromotingGroupDetail extends PromotingGroup {
  blocks: PromotingBlock[];
}

export const fetchPromotingGroupDetail = async (id: string | number): Promise<PromotingGroupDetail | null> => {
  try {
    const response = await apiClient.get<{ code: number; data: PromotingGroupDetail }>(`/promoting-group/${id}`);
    return response.data?.data || null;
  } catch (error) {
    return null;
  }
};

export interface PromotingBlockBooksResponse {
  page: number;
  limit: number;
  offset: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
  block_id: number;
  block_type: string;
  banner: string | null;
  block_name: string;
  books: PromotingBook[];
}

export const fetchPromotingBlockBooks = async (blockId: string | number, page: number = 1, limit?: number): Promise<PromotingBlockBooksResponse | null> => {
  try {
    const response = await apiClient.get<{ code: number; data: PromotingBlockBooksResponse }>(`/promoting/${blockId}/books`, {
      params: { page, limit }
    });
    return response.data?.data || null;
  } catch (error) {
    return null;
  }
};

export const fetchHomeData = async (): Promise<HomeDataResponse | null> => {
  try {
    const response = await apiClient.get<HomeDataResponse>("/getAllBookHome");
    return response.data;
  } catch (error) {
    return null;
  }
}

export interface BookStats {
  data: {
    book_id: number;
    bookID: string;
    name: string;
    title: string;
    img: string;
    img_full: string;
    writer_name: string;
    fullname: string;
    total_views: number;
    total_episodes: number;
    total_groups: number;
    reactions: {
      hearts: number;
      flowers: number;
    };
    sales: {
      coin: number;
      freecoin: number;
      total: number;
    };
    comments: number;
    reviews: number;
    shelve_count: number;
    updated_at: string;
  };
}

export interface AnalyticsDataPoint {
  date: string;
  sales_count: number;
  reads_count: number;
}

export interface BookAnalyticsResponse {
  code: number;
  status: string;
  message: string;
  data: AnalyticsDataPoint[];
}

// Book Analytics Stats
export const fetchBookStats = async (bookId: string | number): Promise<BookStats['data'] | null> => {
  try {
    const response = await apiClient.get<BookStats>(`/managebook/${bookId}/stats`);
    return response.data?.data || null;
  } catch (error) {
    return null;
  }
};

export const fetchBookAnalytics = async (bookId: string | number, start: string, end: string): Promise<AnalyticsDataPoint[]> => {
  try {
    const response = await apiClient.get<BookAnalyticsResponse>(`/managebook/${bookId}/analytics`, {
      params: { start, end }
    });
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
}

export interface EpisodeStats {
  ep_id: string;
  name: string;
  order_by: number;
  read_count: number;
  sales_coin: number;
  sales_freecoin: number;
  total_income: number;
}

export interface PurchaseItem {
  id: string | number;
  ep_id: string | number;
  date: string;
  ep_name: string;
  user_name: string;
  price: number;
  type: string;
  income: number;
}

export interface BookEpisodesStatsResponse {
  code: number;
  status: string;
  message: string;
  data: {
    total_data: EpisodeStats[];
    total_purchase_list: PurchaseItem[];
  };
}

export const fetchBookEpisodesStats = async (bookId: string | number, start: string, end: string): Promise<BookEpisodesStatsResponse['data'] | null> => {
  try {
    const response = await apiClient.get<BookEpisodesStatsResponse>(`/managebook/${bookId}/episodes/stats`, {
      params: { start, end }
    });
    // Ensure we return the expected structure even if parts are missing
    return {
      total_data: response.data?.data?.total_data || [],
      total_purchase_list: response.data?.data?.total_purchase_list || []
    };
  } catch (error) {
    return null;
  }
};

export const fetchWebsiteSettings = async (): Promise<WebsiteSettingsResponse | null> => {

  try {
    const response = await apiClient.get<WebsiteSettingsResponse>("/get_website");
    if (response.data) {
      // Cache removed
    }
    return response.data;
  } catch (error) {
    console.error("fetchWebsiteSettings error:", error);
    return null;
  }
}

export const fetchBookTrans = async (): Promise<BookTrans[]> => {
  try {
    const response = await apiClient.get<{ data: BookTrans[] }>("/getAllBookHome");
    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }
    return response.data;
  } catch (error) {
    return [];
  }
}

export const fetchBookTransById = async (id: string): Promise<BookTrans> => {
  try {
    const response = await apiClient.get(`/book/${id}`);

    // ตรวจสอบ response structure
    if (!response.data) {
      throw new Error('ไม่พบข้อมูลจาก API');
    }

    // ถ้า data เป็น array (ตามที่เห็นในรูปก่อนหน้า)
    if (Array.isArray(response.data.data)) {
      if (response.data.data.length === 0) {
        throw new Error('ไม่พบข้อมูลหนังสือ');
      }
      return response.data.data[0];
    }

    // ถ้า data เป็น object ที่มี book property
    if (response.data.data && response.data.data.book) {
      return response.data.data.book;
    }

    // ถ้า data เป็น object โดยตรง
    if (response.data.data && !Array.isArray(response.data.data)) {
      return response.data.data;
    }

    throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');

  } catch (error) {
    throw error;
  }
};

// Register as writer - รื้อใหม่หมด
export interface WriterRegistrationData {
  writer_name: string;
  fullname: string;
  user_id?: string; // Optional - include user_id if backend requires it
  email?: string; // Optional - Backend ควรดึงจาก JWT Token
  phone?: string;
  address?: string;
  moo?: string;
  soi?: string;
  road?: string;
  district?: string;
  amphoe?: string;
  province?: string;
  zipcode?: string;
}

export const registerWriter = async (data: WriterRegistrationData, token: string) => {

  try {
    const response = await apiClient.post('/user/writer', data, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });


    // Response จาก backend: { code: 200, status: "success", message: "...", data: { token } }
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// Update writer information (reuse same endpoint if backend supports PUT)
export const updateWriter = async (data: Partial<WriterRegistrationData>, token: string) => {

  try {
    // Use POST since backend appears to expose POST /user/writer (register endpoint)
    const response = await apiClient.post('/user/writer', data, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (err: any) {
    throw err;
  }
};

export interface WriterCheckResponse {
  is_writer: boolean;
  status: string | null;
  message: string;
}

export const fetchWriterCheck = async (): Promise<WriterCheckResponse | null> => {
  try {
    // Endpoint referenced in user request: /user/writer/check
    const response = await apiClient.get<{ code: number, status: string, message: string, data: WriterCheckResponse }>('/user/writer/check');
    return response.data?.data || null;
  } catch (error) {
    return null;
  }
};

export const fetchBookEpisodes = async (bookId: string | number) => {
  try {
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('authToken');
    }

    // TODO: ชั่วคราว - รอระบบ login จาก frontend อีกคน
    // ใส่ token demo เพื่อทดสอบ (ลบออกเมื่อมีระบบ login แล้ว)
    if (!token) {
      // API จะคืนข้อมูล episodes แต่ isBuy จะเป็น false ทั้งหมด
    }


    const response = await apiClient.get(`/bookgroup/${bookId}`);


    if (response.data && response.data.code === 200 && response.data.data) {
      const groups = response.data.data.groups || [];

      // Log ตัวอย่างตอนแรกเพื่อเช็คสถานะ isBuy
      if (groups.length > 0 && groups[0].list && groups[0].list.length > 0) {
        const firstEpisode = groups[0].list[0];
      }

      return response.data.data;
    }

    throw new Error('ไม่พบข้อมูลตอน');
  } catch (error: any) {

    // Log detailed error from API response
    if (error.response) {
    }

    throw error;
  }
};

export const fetchBookGroups = async (bookId: string | number) => {
  try {
    const response = await apiClient.get(`/user/managebook/${bookId}/groups`);
    // Normalize backend shapes:
    // - { code:200, data: [group, ...] }
    // - { code:200, data: { groups: [...] } }
    // - legacy: response.data may already be the array
    const payload = response.data?.data ?? response.data
    if (Array.isArray(payload)) return payload
    if (payload && Array.isArray((payload as any).groups)) return (payload as any).groups
    if (payload && Array.isArray((payload as any).data)) return (payload as any).data
    return []
  } catch (error: any) {
    throw error;
  }
}



export const fetchGroupEpisodes = async (groupId: string | number) => {
  try {
    const response = await apiClient.get(`/user/managebook/group/${groupId}/eps`);
    // Normalize possible shapes:
    // - { code:200, data: [ep1, ep2] }
    // - { code:200, data: { episodes: [...] } }
    // - { code:200, data: { list: [...] } }
    const payload = response.data?.data ?? response.data
    if (Array.isArray(payload)) return { episodes: payload }
    if (payload && Array.isArray((payload as any).episodes)) return { episodes: (payload as any).episodes }
    if (payload && Array.isArray((payload as any).list)) return { episodes: (payload as any).list }
    // fallback: if response.data.data.data is present and is array
    const alt = (response.data && (response.data as any).data) ?? null
    if (Array.isArray(alt)) return { episodes: alt }
    return { episodes: [] };
  } catch (error: any) {
    throw error;
  }
}

export const updateEpisodesPrice = async (epIds: (string | number)[] | string, coin: number) => {
  try {
    // Backend expects a comma-separated string in `ep_ids` (per Postman screenshot)
    const idsCsv = Array.isArray(epIds) ? epIds.map(String).join(',') : String(epIds)
    const payload = { ep_ids: idsCsv, coin }
    const resp = await apiClient.put('/user/managebook/eps/price', payload)
    return resp.data
  } catch (err: any) {
    throw err
  }
}

export const fetchUserShelve = async (limit: number = 20, page: number = 1) => {
  try {
    const resp = await apiClient.get('/user/getbookshelve', {
      params: { limit, page }
    })

    // Response structure: { data: { books: [...], paginate: {...}, order: {...} } }
    const payload = resp.data?.data ?? resp.data

    if (payload && Array.isArray(payload.books)) {
      return payload
    }

    // Legacy support or fallback
    if (Array.isArray(payload)) {
      return { books: payload, paginate: null }
    }

    return { books: [], paginate: null }
  } catch (err: any) {
    throw err
  }
}

export const fetchUserShelveContinue = async (limit: number = 20, page: number = 1) => {
  try {
    const resp = await apiClient.get('/user/getbookshelvecontinue', {
      params: { limit, page }
    })

    // Response structure: { data: { books: [...], paginate: {...}, order: {...} } }
    const payload = resp.data?.data ?? resp.data

    if (payload && Array.isArray(payload.books)) {
      return payload
    }

    // Legacy support or fallback
    if (Array.isArray(payload)) {
      return { books: payload, paginate: null }
    }

    return { books: [], paginate: null }
  } catch (err: any) {
    throw err
  }
}

export const fetchUserShelveBuy = async (limit: number = 20, page: number = 1, order: string = 'desc') => {
  try {
    const resp = await apiClient.get('/user/getbookshelvebuy', {
      params: { limit, page, order }
    })

    // Response structure: { data: { books: [...], paginate: {...}, order: {...} } }
    const payload = resp.data?.data ?? resp.data

    if (payload && Array.isArray(payload.books)) {
      return payload
    }

    // Legacy support or fallback
    if (Array.isArray(payload)) {
      return { books: payload, paginate: null }
    }

    return { books: [], paginate: null }
  } catch (err: any) {
    throw err
  }
}


export const redeemCode = async (code: string) => {
  try {
    // Backend expects key `redeemCode` in the request body (see Postman)
    const payload = { redeemCode: code }
    const resp = await apiClient.post('/user/redeem', payload)
    return resp.data
  } catch (err: any) {
    throw err
  }
}

export const deleteGroupEpisode = async (episodeId: string | number, groupId?: string | number) => {
  // Try a few plausible endpoints to reduce 404s caused by inconsistent backend paths
  const endpoints: string[] = []

  // If a groupId is provided, try group-scoped delete paths first
  if (groupId) {
    endpoints.push(`/user/managebook/group/${groupId}/eps/${episodeId}`)
    endpoints.push(`/user/managebook/group/${groupId}/ep/${episodeId}`)
    endpoints.push(`/user/managebook/${groupId}/eps/${episodeId}`)
    endpoints.push(`/user/managebook/${groupId}/ep/${episodeId}`)
  }

  // General fallbacks
  endpoints.push(`/user/managebook/eps/${episodeId}`)
  endpoints.push(`/user/managebook/ep/${episodeId}`)
  endpoints.push(`/user/managebook/episode/${episodeId}`)
  endpoints.push(`/episode/${episodeId}`)

  let lastErr: any = null
  for (const path of endpoints) {
    try {
      const response = await apiClient.delete(path)
      return response.data
    } catch (error: any) {
      lastErr = error
      // continue trying other paths
    }
  }
  // As a last resort, try sending DELETE with a request body (some servers expect payload)
  try {
    const response = await apiClient.delete('/user/managebook/eps', { data: { episodeId, groupId } })
    return response.data
  } catch (error: any) {
    lastErr = error
  }

  // Some backends expose a specific '/eps/delete' action route (seen in your screenshot).
  // Try DELETE with body first, then POST to that path.
  try {
    const response = await apiClient.delete('/user/managebook/eps/delete', { data: { episodeId, groupId } })
    return response.data
  } catch (error: any) {
    lastErr = error
  }

  try {
    // Try several common payload shapes to match backend expectations
    const payloadVariants = [
      { episodeId, groupId },
      { id: episodeId, groupId },
      { episode_id: episodeId, groupId },
      { eps_id: episodeId, groupId },
      { ep_id: episodeId, groupId },
      { episodeId },
      { id: episodeId },
      { episode_id: episodeId },
    ]

    for (const body of payloadVariants) {
      try {
        const response = await apiClient.post('/user/managebook/eps/delete', body)
        return response.data
      } catch (err: any) {
        lastErr = err
        // try next payload shape
      }
    }
  } catch (error: any) {
    lastErr = error
  }

  // Some clients / Postman were using PUT with key `ep_ids` (string or CSV). Try that exact shape.
  try {
    const epIdsString = String(episodeId)
    const putVariants = [
      { ep_ids: epIdsString },
      { ep_ids: [episodeId] },
      { ep_ids: epIdsString, group_id: groupId },
      { ep_ids: epIdsString, groupId },
    ]

    for (const body of putVariants) {
      try {
        const resp = await apiClient.put('/user/managebook/eps/delete', body)
        return resp.data
      } catch (err: any) {
        lastErr = err
      }
    }
  } catch (err: any) {
    lastErr = err
  }

  throw lastErr
}

export const fetchBookDetail = async (bookId: string): Promise<BookDetail> => {
  try {
    // Try new management API first (/user/managebook/:id/detail)
    try {
      const resp = await apiClient.get(`/bookdetail/${bookId}`);
      if (resp?.data) {
        // some backends return { code, data } others return data directly
        const payload = resp.data.data ?? resp.data;
        if (payload) {
          return payload as BookDetail;
        }
      }
      // if that endpoint didn't return expected data, fallthrough to legacy
    } catch (err: any) {
    }

    // Fallback to legacy endpoint
    const response = await apiClient.get<BookDetailResponse>(`/bookdetail/${bookId}`);
    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('ไม่พบข้อมูลหนังสือ');
  } catch (error) {
    throw error;
  }
};

export const fetchMyBookDetail = async (bookId: string): Promise<BookDetail> => {
  try {
    // Try new management API first (/user/managebook/:id/detail)
    try {
      const resp = await apiClient.get(`/bookdetail/${bookId}`);
      if (resp?.data) {
        // some backends return { code, data } others return data directly
        const payload = resp.data.data ?? resp.data;
        if (payload) {
          return payload as BookDetail;
        }
      }
      // if that endpoint didn't return expected data, fallthrough to legacy
    } catch (err: any) {
    }

    // Fallback to legacy endpoint
    const response = await apiClient.get<BookDetailResponse>(`/bookdetail/${bookId}`);
    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error('ไม่พบข้อมูลหนังสือ');
  } catch (error) {
    throw error;
  }
};

export const updateGroup = async (groupId: string | number, name: string) => {
  // 1. ดึง Token: หาจากทุกที่ที่เป็นไปได้ (Cookies หรือ LocalStorage)
  const rawToken = Cookies.get('token')
    || localStorage.getItem('token')
    || localStorage.getItem('authToken');

  // 2. ล้าง Token: ถ้ามีเครื่องหมาย " ติดมา ให้เอาออก
  const token = rawToken ? rawToken.replace(/^['"]+|['"]+$/g, '') : '';

  if (!token) {
    throw new Error("ไม่พบ Token สำหรับเข้าสู่ระบบ");
  }

  // 3. ยิง Request
  const response = await axios.put(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/managebook/group/update`,
    {
      group_id: Number(groupId), // แปลงเป็นตัวเลขให้ชัวร์
      name: name
    },
    {
      headers: {
        'Content-Type': 'application/json',
        // ส่ง Token ไป (ถ้า API ปกติต้องมี Bearer ก็เติม `Bearer ${token}` แต่ถ้าส่งเพียวๆ ก็ใส่ token)
        'Authorization': token
      }
    }
  );

  return response.data;
};

export const createGroup = async (bookId: string | number, name: string) => {
  try {
    const payload = { book_id: String(bookId), name }
    const resp = await apiClient.post('/user/managebook/group', payload)
    return resp.data
  } catch (err: any) {
    throw err
  }
}

export const deleteGroup = async (groupId: string | number) => {
  try {
    // Backend expects DELETE with body { group_id: ... }
    const response = await apiClient.delete('/user/managebook/group', {
      data: { group_id: String(groupId) }
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

export const updateUserAddress = async (formData: FormData, token: string) => {
  try {
     const response = await apiClient.post('/user/save_profile', formData, {
       headers: {
        'Authorization': token,
        'Content-Type': 'multipart/form-data',
        }
     });
     return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getBankList = async () => {
  try {
    const response = await apiClient.get('/writer/bank_list');
    return response.data?.data ?? [];
  } catch (error: any) {
    throw error;
  }
};



export const updateBankIdCardAccount = async (formData: FormData) => {
  try {
    const response = await apiClient.post('/writer/bank_idcard_account', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getBankIdCardAccount = async () => {
  try {
    const response = await apiClient.get('/writer/bank_idcard_account');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const createPromotion = async (payload: {
  group_ids: string;
  subject: string;
  start_date: string;
  end_date: string;
  discount_percent: string | number;
  book_id?: string | number;
}) => {
  try {
    const response = await apiClient.post('/user/managebook/groups/promotion', payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchBookCategoryAll = async (): Promise<CategoryDetail[]> => {
  try {
    const response = await apiClient.get<CategoryAllResponse>("/book-category/all");
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
};

export const updatePromotion = async (payload: {
  dfb_id: number;
  groupIDs: string;
  subject: string;
  start_date: string;
  end_date: string;
  discount_percent: string | number;
  book_id?: string | number;
}) => {
  try {
    const response = await apiClient.put('/user/managebook/groups/promotion', payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deletePromotion = async (dfbId: string | number) => {
  try {
    // Backend expects DELETE with body { dfb_id: ... }
    const response = await apiClient.delete('/user/managebook/groups/promotion', {
      data: { dfb_id: Number(dfbId) }
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const createGroupEpisodePromotion = async (payload: {
  ep_ids: string;
  start_date: string;
  end_date: string;
  discount_price: number;
}) => {
  try {
    const response = await apiClient.post('/user/managebook/eps/promotion', payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteGroupEpisodePromotion = async (ids: string) => {
  try {
    // Backend expects DELETE with body { ids: "..." }
    const response = await apiClient.delete('/user/managebook/eps/promotion', {
      data: { ids }
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

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

export const fetchBookUpdates = async (): Promise<BookUpdate[]> => {
  try {
    const response = await apiClient.get<{ data: BookUpdate[] }>("/getBookUpdate");
    // Ensure we return an array
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    return [];
  }
};

export const fetchBookReviews = async (bookId: string | number, page: number = 1, limit: number = 10, sort: string = 'newest'): Promise<{ comments: CommentData[], pagination?: any }> => {
  try {
    const response = await apiClient.get<CommentResponse>(`/bookdetail/${bookId}/reviews`, {
      params: { page, limit, sort }
    });

    if (response.data && response.data.data) {
      const payload = response.data.data;
      // Check if data has comment_data array
      if (Array.isArray(payload.comment_data)) {
        return {
          comments: payload.comment_data as CommentData[],
          pagination: payload.pagination
        };
      }
      // Fallback for flat array (if backend changes)
      if (Array.isArray(payload)) {
        return { comments: payload as CommentData[] };
      }
    }

    return { comments: [] };
  } catch (error: any) {
    return { comments: [] };
  }
};

export const postBookReview = async (bookId: string | number, comment: string, star: number) => {
  try {
    const payload = { comment, star };
    const response = await apiClient.post(`/bookdetail/${bookId}/reviews`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const postReply = async (commentBookId: string | number, comment: string) => {
  try {
    const payload = { comment };
    const response = await apiClient.post(`/bookdetail/reviews/${commentBookId}/replies`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteBookReview = async (commentBookId: string | number) => {
  try {
    const response = await apiClient.delete(`/bookdetail/reviews/${commentBookId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportBookReview = async (commentBookId: string | number) => {
  try {
    // Backend expects POST /bookdetail/reviews/:comment_book_id/report
    const response = await apiClient.post(`/bookdetail/reviews/${commentBookId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteBookReviewReply = async (replyId: string | number) => {
  try {
    const response = await apiClient.delete(`/bookdetail/reviews/replies/${replyId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchStoreData = async (): Promise<StoreCategory[]> => {
  try {
    const response = await apiClient.get<StoreResponse>('/user/store');
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
};

export const reportBookReviewReply = async (replyId: string | number) => {
  try {
    const response = await apiClient.post(`/bookdetail/reviews/replies/${replyId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchStickers = async (): Promise<StickerSet[]> => {
  try {
    const response = await apiClient.get<StickerResponse>("/stickers");
    return response.data?.data ?? [];
  } catch (error: any) {
    return [];
  }
};

export interface WriterBook {
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
  discount: any;
  discount_ep_count?: number;
}

export interface WriterBooksResponse {
  code: number;
  status: string;
  message: string;
  data: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
    type: string;
    items: WriterBook[];
  }
}

// Writer Profile Interface
export interface WriterProfileResponse {
  code: number;
  status: string;
  message: string;
  data: {
    writer: {
      user_id: number;
      writer_name: string;
      img: string;
      banner: string;
    };
    book_count: number;
    follower_count: number;
    isFollowing: boolean;
  };
}



export const fetchPublicWriterProfile = async (writerId: string | number): Promise<WriterProfileResponse['data'] | null> => {
  try {
    const response = await apiClient.get<WriterProfileResponse>(`/profile/${writerId}`);
    return response.data?.data ?? null;
  } catch (error) {
    return null;
  }
};

export const fetchWriterBooks = async (
  writerId: number | string,
  type: string = 'new',
  page: number = 1,
  limit: number = 20,
  sortBy: string = 'view'
): Promise<WriterBooksResponse['data'] | null> => {
  try {
    // Endpoint: /profile/:writer_id/books/:type/:page
    const response = await apiClient.get<WriterBooksResponse>(`/profile/${writerId}/books/${type}/${page}`, {
      params: {
        limit,
        sortBy
      }
    });
    return response.data?.data ?? null;
    // ... existing fetchWriterBooks implementation ...
  } catch (error: any) {
    return null;
  }
};

export const followWriter = async (writerId: number | string, action: 'follow' | 'unfollow') => {
  try {
    const response = await apiClient.post('/profile/follow', {
      writer_id: Number(writerId),
      action: action
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
// --- Book Comments (Episode Comments) API ---

export const fetchBookComments = async (bookId: string | number, page: number = 1, limit: number = 10, sort: string = 'newest'): Promise<{ comments: CommentEpData[], pagination?: any }> => {
  try {
    const response = await apiClient.get<CommentResponse>(`/bookdetail/${bookId}/comments`, {
      params: { page, limit, sort }
    });

    if (response.data && response.data.data) {
      const payload = response.data.data;
      if (Array.isArray(payload.comment_data)) {
        return {
          comments: payload.comment_data as CommentEpData[],
          pagination: payload.pagination
        };
      }
      if (Array.isArray(payload)) {
        return { comments: payload as CommentEpData[] };
      }
    }
    return { comments: [] };
  } catch (error: any) {
    return { comments: [] };
  }
};

export const postCommentReply = async (commentEpId: string | number, comment: string) => {
  try {
    const payload = { comment };
    // API: POST /bookdetail/comments/:comment_ep_id/replies
    const response = await apiClient.post(`/bookdetail/comments/${commentEpId}/replies`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteBookComment = async (commentEpId: string | number) => {
  try {
    // API: DELETE /bookdetail/comments/:comment_ep_id
    const response = await apiClient.delete(`/bookdetail/comments/${commentEpId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportBookComment = async (commentEpId: string | number) => {
  try {
    // API: POST /bookdetail/comments/:comment_ep_id/report
    const response = await apiClient.post(`/bookdetail/comments/${commentEpId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteBookCommentReply = async (replyId: string | number) => {
  try {
    const response = await apiClient.delete(`/bookdetail/comments/replies/${replyId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportBookCommentReply = async (replyId: string | number) => {
  try {
    const response = await apiClient.post(`/bookdetail/comments/replies/${replyId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export interface PopularArticle {
  id: number;
  name: string; // HTML content or title
  img: string;
  post_by?: string;
  title: string;
  view: number;
  update_at: string;
}

export const fetchPopularArticles = async (): Promise<PopularArticle[]> => {
  try {
    const response = await apiClient.get<{ code: number; status: string; data: { list: PopularArticle[] } }>("/articles/popular");
    return response.data?.data?.list || [];
  } catch (error) {
    return [];
  }
};

export interface ArticlePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}

export interface LatestArticle {
  id: number;
  name: string;
  img: string;
  view: number;
  update_at: string;
}

export interface LatestArticlesResponse {
  code: number;
  status: string;
  message: string;
  data: {
    pagination: ArticlePagination;
    list: LatestArticle[];
  };
}

export const fetchLatestArticles = async (page: number = 1, limit: number = 8): Promise<{ list: LatestArticle[]; pagination: ArticlePagination }> => {
  try {
    const response = await apiClient.get<LatestArticlesResponse>(`/articles?limit=${limit}&page=${page}`);
    return response.data?.data || { list: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  } catch (error) {
    return { list: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  }
};

export interface RankingBook {
  rank: number;
  book_id: number;
  name: string;
  img: string;
  user_id: number;
  view: number;
  end: string;
  status: string;
  tag?: string;
  img_full?: string;
  writer_name: string;
  chapter: number;
  shelve_count: number;
  isBestSeller: boolean;
  isNew: boolean;
  isNewEp: boolean;
  discount_ep_count?: number;
  title?: string;
}

export interface RankingResponse {
  code: number;
  status: string;
  message: string;
  data: {
    pagination: ArticlePagination; // Reusing existing UserPagination/ArticlePagination structure if similar, but strictly it has separate definition. Let's reuse or redefine if identical.
    books: RankingBook[];
  };
}

export type RankingTimeRange = 'week' | 'month' | 'year' | 'all';

export const fetchRankingBooks = async (range: RankingTimeRange = 'week', page: number = 1, limit: number = 10, category_id?: number | string): Promise<{ books: RankingBook[]; pagination: ArticlePagination }> => {
  try {
    const response = await apiClient.get<RankingResponse>(`/books/ranks/${range}?limit=${limit}&page=${page}${category_id ? `&category_id=${category_id}` : ''}`);
    return response.data?.data || { books: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  } catch (error) {
    return { books: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  }
};

export interface FetchThreadsParams {
  page?: number;
  limit?: number;
  type?: number;
  key?: string;
  sort?: string;
}

export const fetchThreads = async (params: FetchThreadsParams = {}): Promise<ThreadResponse | null> => {
  try {
    const response = await apiClient.get<ThreadResponse>('/user/threads', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        ...params
      }
    });
    return response.data;
  } catch (error: any) {
    return null;
  }
};

export interface CreateThreadPayload {
  title: string;
  rate: string;
  author: string;
  type: string;
  tag: string;
  detail: string;
}

export const createThread = async (payload: CreateThreadPayload) => {
  try {
    const response = await apiClient.post('/user/threads', payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchBookPromotions = async (page = 1, limit = 20) => {
  try {
    const response = await apiClient.get('/books/promotions/ep', { params: { page, limit } });
    return response.data;
  } catch (err: any) {
    throw err;
  }
};

// --- Thread APIs ---

export interface ThreadDetail {
  topic_id: number;
  topicID: string;
  user_id: number;
  date_at: string;
  title: string;
  detail: string;
  view: number;
  comment_count: number;
  author: string;
  tag: string;
  type: number; // 0=General, 1=Review, 2=Spoil, 3=Suggest
  rate: string; // all, 18+
}

export const fetchThreadDetail = async (topicId: string | number): Promise<ThreadDetail> => {
  try {
    const response = await apiClient.get<{ data: ThreadDetail }>(`/user/threads/${topicId}`);
    return response.data.data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchThreadComments = async (topicId: string | number, page: number = 1): Promise<{ comments: CommentData[], pagination?: any }> => {
  try {
    const response = await apiClient.get<CommentResponse>(`/user/threads/${topicId}/comments`, {
      params: { page }
    });

    if (response.data && response.data.data) {
      const payload = response.data.data;
      // Based on screenshot: data: { paginate: {...}, comment_data: [...] }
      if (Array.isArray((payload as any).comment_data)) {
        // Need to map or ensure types match CommentData
        // CommentData usually has: id (or equivalent), user, comment, date...
        // Thread comments might look slightly different but let's assume similarity for now or cast.
        return {
          comments: (payload as any).comment_data as CommentData[],
          pagination: (payload as any).paginate
        };
      }
    }
    return { comments: [] };
  } catch (error: any) {
    return { comments: [] };
  }
};

export const postThreadComment = async (topicId: string | number, comment: string) => {
  try {
    const response = await apiClient.post(`/user/threads/${topicId}/comments`, { comment });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const postThreadReply = async (topicId: string | number, commentTopicId: string | number, comment: string) => {
  try {
    const response = await apiClient.post(`/user/threads/${topicId}/comments/${commentTopicId}/replies`, { comment });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};


export const fetchArticleDetail = async (articleId: string | number): Promise<ArticleResponse | null> => {
  try {
    const response = await apiClient.get<ArticleResponse>(`/articles/${articleId}`);
    return response.data;
  } catch (error) {
    return null;
  }
};


export const fetchCampaignDetail = async (id: string | number): Promise<CampaignDetailData | null> => {
  try {
    const response = await apiClient.get<CampaignDetailResponse>(`/campaigns/${id}`);
    return response.data.data;
  } catch (error) {
    return null;
  }
};


export interface RankingCategoryData {
  left: { id: number; name: string };
  right: { id: number; name: string };
}

export interface RankingCategoryResponse {
  code: number;
  status: string;
  message: string;
  data: RankingCategoryData;
}

export const fetchRankingCategories = async (): Promise<RankingCategoryData | null> => {
  try {
    const response = await apiClient.get<RankingCategoryResponse>("/books/ranking/categories");
    if (response.data && response.data.code === 200) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export interface CategoryRankingBookItem {
  rank: number;
  click_count: number;
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
  discount_ep_count?: number;
}

export interface CategoryRankingBooksResponse {
  code: number;
  status: string;
  message: string;
  data: {
    pagination: any;
    range: number;
    categoryId: number;
    list_count: number;
    list: CategoryRankingBookItem[];
  };
}

export const fetchCategoryRankingBooks = async (categoryId: number, range: number | string, limit: number = 5): Promise<CategoryRankingBookItem[]> => {
  try {
    const url = `/books/ranking/${categoryId}/${range}?limit=${limit}`;
    const response = await apiClient.get<CategoryRankingBooksResponse>(url);


    // Detailed validation
    if (response.data && response.data.code === 200 && response.data.data) {
      const list = response.data.data.list;
      if (Array.isArray(list)) {
        return list;
      }
      return [];
    }

    return [];
  } catch (error) {
    return [];
  }

};

export const buyStorePack = async (packId: string | number) => {
  try {
    // Backend expects POST /user/store with { store_pack_id: ... }
    const response = await apiClient.post('/user/store', {
      store_pack_id: String(packId)
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchBookPurchaseDetails = async (bookId: string | number) => {
  try {
    const response = await apiClient.get<BookPurchaseDetailsResponse>(`/bookdetail/purchase/${bookId}`);
    return response.data?.data;
  } catch (error: any) {
    return null;
  }
};

export const postBannerClick = async (bannerId: number) => {
  try {
    await apiClient.post('/banner-click', { banner_id: bannerId });
  } catch (error) {
  }
};

export const postBookClick = async (bookId: string | number) => {
  try {
    const id = Number(bookId);
    if (!id || isNaN(id)) return;
    await apiClient.post('/bookdetail/click', { book_id: id });
  } catch (error) {
  }
};

export const postCampaignClick = async (campaignId: number) => {
  try {
    if (!campaignId) return;
    await apiClient.post(`/campaigns/${campaignId}/click`, { id: campaignId });
  } catch (error) {
  }
};

export const reportThreadComment = async (commentTopicId: number) => {
  return await apiClient.post(`/user/threads/comments/${commentTopicId}/report`);
};

export const reportThreadReply = async (commentSubTopicId: number) => {
  return await apiClient.post(`/user/threads/comments/${commentSubTopicId}/report`);
};

export const deleteThreadReply = async (commentSubTopicId: number) => {
  return await apiClient.delete(`/user/threads/comments/${commentSubTopicId}/replies`);
};

export const deleteThreadComment = async (commentTopicId: number) => {
  return await apiClient.delete(`/user/threads/comments/${commentTopicId}`);
};

export const deleteThread = async (topicId: number) => {
  return await apiClient.delete(`/user/threads/${topicId}`);
};

// Writer Withdraw Types
export interface WriterWithdrawData {
  id: number;
  date_withdraw: string;
  status: string;
  get_amount: string;
  service: string;
  tax_amount: string;
  amount: string;
  acc_number: string;
  tax: any;
}

export const postWriterWithdraw = async (amount: number) => {
  return await apiClient.post('/writer/withdraw', { amount });
};

export const fetchWriterWithdrawHistory = async () => {
  const response = await apiClient.get('/writer/withdraw');
  return response.data?.data ?? [];
};

export const fetchWriterWithdrawSetting = async () => {
  const response = await apiClient.get('/writer/withdraw/setting');
  return response.data?.data ?? null;
};

export interface NotificationType {
  noti_type_id: number;
  category: string;
  type: string;
  title: string;
  subtitle: string;
  message: string;
  image: string | null;
  url: string | null;
  book_id?: number;
  ep_id?: number;
  comment_id?: number;
  create_at?: string;
}

export interface NotificationData {
  id: number;
  user_id: number;
  noti_type_id: number;
  create_at: string;
  readed: string; // 'Y' or 'N'
  NotiType: NotificationType;
}

export interface RecentNotificationsResponse {
  code: number;
  status: string;
  message: string;
  data: {
    recent_notifications: NotificationData[];
  };
}

export const fetchRecentNotifications = async (): Promise<NotificationData[]> => {
  try {
    const response = await apiClient.get<RecentNotificationsResponse>('/user/notifications/recent/unread');

    if (response.data && response.data.data && Array.isArray(response.data.data.recent_notifications)) {
      return response.data.data.recent_notifications;
    }

    return [];
  } catch (error) {
    return [];
  }
};

export const fetchAllNotifications = async (page: number = 1, limit: number = 20): Promise<{ notifications: NotificationData[], pagination?: any }> => {
  try {
    const response = await apiClient.get('/user/notifications', {
      params: { page, limit }
    });

    // Check structure - this is a guess based on other list APIs in this project
    if (response.data && response.data.data) {
      if (Array.isArray(response.data.data)) {
        return { notifications: response.data.data, pagination: response.data.pagination || response.data.meta };
      }
      if (response.data.data.notifications) {
        return { notifications: response.data.data.notifications, pagination: response.data.data.pagination };
      }
    }
    return { notifications: [] };
  } catch (error) {
    return { notifications: [] };
  }
};

export const markNotificationAsRead = async (notificationId: number) => {
  try {
    const response = await apiClient.patch(`/user/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiClient.patch('/user/notifications/read-all');
    return response.data;
  } catch (error) {
    return null;
  }
};

export const postCommentNotification = async (commentId: string | number) => {
  try {
    // Send empty object as body to avoid 400 Bad Request
    const response = await apiClient.post(`/user/notifications/comments/${commentId}`, {});
    return response.data;
  } catch (error) {
    return null;
  }
};

export const postReviewNotification = async (commentId: string | number) => {
  try {
    const response = await apiClient.post(`/user/notifications/reviews/${commentId}`, {});
    return response.data;
  } catch (error) {
    return null;
  }
};

export const postReviewReplyNotification = async (commentId: string | number) => {
  try {
    const response = await apiClient.post(`/user/notifications/reviews/replies/${commentId}`, {});
    return response.data;
  } catch (error) {
    return null;
  }
};

export const postCommentReplyNotification = async (commentId: string | number) => {
  try {
    const response = await apiClient.post(`/user/notifications/comments/replies/${commentId}`, {});
    return response.data;
  } catch (error) {
    return null;
  }
};

// --- Episode Comments API (Read Page) ---

export const fetchEpisodeComments = async (epId: string | number, page: number = 1, limit: number = 10, sort: string = 'newest'): Promise<{ comments: CommentEpData[], pagination?: any }> => {
  try {
    const response = await apiClient.get<CommentResponse>(`/readep/${epId}/comments`, {
      params: { page, limit, sort }
    });

    if (response.data && response.data.data) {
      const payload = response.data.data;
      if (Array.isArray(payload.comment_data)) {
        return {
          comments: payload.comment_data as CommentEpData[],
          pagination: payload.pagination
        };
      }
      if (Array.isArray(payload)) {
        return { comments: payload as CommentEpData[] };
      }
    }
    return { comments: [] };
  } catch (error: any) {
    return { comments: [] };
  }
};

export const postEpisodeComment = async (epId: string | number, comment: string) => {
  try {
    const payload = { comment };
    const response = await apiClient.post(`/readep/${epId}/comments`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const postEpisodeReply = async (commentEpId: string | number, comment: string) => {
  try {
    const payload = { comment };
    const response = await apiClient.post(`/readep/comments/${commentEpId}/replies`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportEpisodeComment = async (commentEpId: string | number) => {
  try {
    const response = await apiClient.post(`/readep/comments/${commentEpId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const reportEpisodeReply = async (commentSubEpId: string | number) => {
  try {
    const response = await apiClient.post(`/readep/comments/replies/${commentSubEpId}/report`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteEpisodeComment = async (commentEpId: string | number) => {
  try {
    const response = await apiClient.delete(`/readep/comments/${commentEpId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const deleteEpisodeReply = async (commentSubEpId: string | number) => {
  try {
    const response = await apiClient.delete(`/readep/comments/replies/${commentSubEpId}`);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const syncReadingProgress = async (ep_id: string | number) => {
  try {
    const response = await apiClient.post('/reading-progress/sync', { ep_id: String(ep_id) });
    return response.data;
  } catch (error: any) {
    return null;
  }
};

export const updateReadingProgress = async (book_id: string | number, ep_id: string | number, progress: number) => {
  try {
    const response = await apiClient.post('/reading-progress/update', {
      book_id: String(book_id),
      ep_id: String(ep_id),
      progress
    });
    return response.data;
  } catch (error: any) {
    return null;
  }
};

export const fetchCategoryBooks = async (
  type: string,
  categoryId: string | number,
  tab: string = 'bestseller',
  page: number = 1,
  limit: number = 20,
  period?: string
): Promise<CategoryBookListResponse | null> => {
  try {
    const response = await apiClient.get<CategoryBookListResponse>(`/book-category/list`, {
      params: { type, categoryId, tab, limit, page, period }
    });
    return response.data;
  } catch (error) {
    return null;
  }
};

export const fetchAllCategories = async (): Promise<CategoryDetail[]> => {
  try {
    const response = await apiClient.get<CategoryAllResponse>('/book-category/all');
    return response.data?.data ?? [];
  } catch (error) {
    return [];
  }
};

export const fetchLatestReadEpisode = async (bookId: string | number): Promise<LatestReadEpisodeResponse | null> => {
  try {
    const response = await apiClient.get<LatestReadEpisodeResponse>(`/bookdetail/latest-read-ep/${bookId}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const fetchUserMyBookInfo = async (token?: string | null) => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.get('/user/writer/info', config);
    return response.data;
  } catch (error) {
    console.error("fetchUserMyBookInfo error:", error);
    return null;
  }
};

export const fetchWriterProfile = async (token?: string | null) => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.get('/writer/info', config);
    return response.data;
  } catch (error) {
    console.error("fetchWriterProfile error:", error);
    return null;
  }
};



export const checkWriterStatus = async (token?: string | null) => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.get('/user/writer/check', config);
    return response.data;
  } catch (error) {
    console.error("checkWriterStatus error:", error);
    return null;
  }
};

// Search Filters Interfaces
export interface MyBookSearchParams {
  page?: number;
  limit?: number;
  status?: string; // 'private', 'publish', 'delete', 'wait'
  sortBy?: string; // 'date_at'
  order?: string;  // 'asc', 'desc'
  end?: string;    // 'end', 'not_end'
  type?: string;   // 'write', 'tran', etc.
  q?: string;      // Search keyword
}

export const fetchUserMyBooks = async (params: MyBookSearchParams = {}) => {
  try {
    const { page = 1, limit = 10, ...rest } = params;
    const response = await apiClient.get('/user/mybook/search', {
      params: {
        page,
        limit,
        ...rest
      }
    });
    return response.data;
  } catch (error) {
    return null;
  }
};





export interface ResolveEpisodeResponse {
  code: number;
  status: string;
  message: string;
  data: {
    ep_id: number;
    book_id: number;
  };
}

export const resolveEpisodeId = async (epId: string): Promise<ResolveEpisodeResponse | null> => {
  try {
    const response = await apiClient.get<ResolveEpisodeResponse>(`/ep/resolve/${epId}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export interface ResolveBookResponse {
  code: number;
  status: string;
  message: string;
  data: {
    book_id: number;
  };
}

export const resolveBookId = async (bookId: string): Promise<ResolveBookResponse | null> => {
  try {
    const response = await apiClient.get<ResolveBookResponse>(`/book/resolve/${bookId}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const refreshToken = async (tokenOverride?: string) => {
  try {
    let token = tokenOverride;

    if (!token) {
        const rawToken = Cookies.get('token')
          || localStorage.getItem('token')
          || localStorage.getItem('authToken');
        token = rawToken ? rawToken.replace(/^['"]+|['"]+$/g, '') : '';
    }

    if (!token) throw new Error("No token");

    const response = await apiClient.post('/refresh-token', {}, {
      headers: {
        'Authorization': token
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('[API] /refresh-token error', error)
    throw error;
  }
};

export interface BookRecommendationResponse {
  code: number;
  status: string;
  message: string;
  data: any[]; // Using any[] to match CardCard input flexibility, or could use Partial<Book>[]
}

export const fetchBookRecommendation = async (bookId: string | number): Promise<any[]> => {
  try {
    const response = await apiClient.get<BookRecommendationResponse>(`/bookdetail/recommend/${bookId}`, {
      params: { limit: 5 }
    });
    
    if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
        return response.data.data;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const fetchBookPromotionOptions = async (bookId: number): Promise<BookPromotionOption[]> => {
  try {
    const response = await apiClient.get<any>(`/pack-campaign/buying-options/${bookId}`);

    if (response.data && response.data.code === 200 && response.data.data) {
      // Check if data is array
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const buyGroupPromotion = async (data: { dfb_id: number; payWith: string }) => {
  try {
    const response = await apiClient.post("/buy/groupPromotion", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export interface LogActivityPayload {
  session_id?: string;
  page_session_id?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  path?: string;
  duration?: number; // seconds
  metadata?: any;
}

export const logActivity = async (payload: LogActivityPayload) => {
  try {
    if (process.env.NODE_ENV === 'development') {
        // console.log("Creating Activity Log:", payload);
    }
    // Fire and forget strategy often used for logging, but here we await to ensure it's sent
    const response = await apiClient.post('/log/activity', payload);
    return response.data;
  } catch (error) {
    // Fail silently for logging to not disrupt user experience
    console.error("Failed to log activity", error);
    return null;
  }
};

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export const fetchFaqs = async (): Promise<FaqItem[]> => {
    try {
        const response = await apiClient.get<{ code: number; data: FaqItem[] }>('/faq');
        // Based on typical response structure { code: 200, data: [...] }
        return response.data?.data || [];
    } catch (error) {
        return [];
    }
}

export interface ActiveType {
  type: string;
  label: string;
}

export interface ActiveCategory {
  id: string;
  name: string;
  color?: string;
  img_bg?: string;
  order_by?: number;
}

export const fetchActiveTypes = async (): Promise<ActiveType[]> => {
  try {
    const response = await apiClient.get<{ code: number; data: ActiveType[] }>('/active-types');
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
};

export const fetchActiveCategories = async (type: string = 'all'): Promise<ActiveCategory[]> => {
  try {
    const response = await apiClient.get<{ code: number; data: ActiveCategory[] }>('/active-categories', {
      params: { type }
    });
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
};

export interface Coupon {
  id: number;
  name: string;
  description: string;
  totalQuantity: number;
  remainingQuantity: number;
  holdingLimit: number;
  startAt: string;
  endAt: string;
  dailyStartTime: string;
  dailyEndTime: string;
  usableStartAt: string | null;
  usableEndAt: string | null;
  usableDailyStartTime: string;
  usableDailyEndTime: string;
  validityDurationMinutes: number | null;
  userSegmentRules: string;
  isStackable: boolean;
  redemptionType: string;
  globalCode: string | null;
  selectionQuota: number;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  rewards: {
      id: number;
      couponId: number;
      rewardType: string;
      rewardConfig: string; // JSON string e.g. "{\"amount\":50}"
      book?: {
          title: string;
          img: string;
          img_full: string;
      };
  }[];
  isClaimable: boolean;
  claimStatus: string;
}

export const fetchAvailableCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await apiClient.get<{ code: number; status: string; message: string; data: Coupon[] }>("/user/coupon/available");
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
};

export const fetchUserCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await apiClient.get<{ code: number; status: string; message: string; data: Coupon[] }>("/user/coupon/mine");
    return response.data?.data || [];
  } catch (error) {
    return [];
  }
};

export const claimCoupon = async (id: number): Promise<any> => {
    try {
        const response = await apiClient.post(`/user/coupon/claim`, { id });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const claimCouponByCode = async (code: string): Promise<any> => {
    try {
        const response = await apiClient.post(`/user/coupon/claim`, { code });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const useCoupon = async (userCouponId: number, selectedRewardIds: number[], rewardEpSelections?: Record<number, number[]>): Promise<any> => {
    try {
        const payload: any = { userCouponId, selectedRewardIds };
        if (rewardEpSelections) {
            payload.rewardEpSelections = rewardEpSelections;
        }
        const response = await apiClient.post(`/user/coupon/use`, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const buyStorePackNow = async (packId: number | string, quantity: number) => {
    try {
        const response = await apiClient.post('/user/store/buy-now', {
            store_pack_id: packId,
            quantity: quantity
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
}
