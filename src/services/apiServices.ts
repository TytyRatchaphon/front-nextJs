
import apiClient from "./apiClient";
import axios from 'axios';
import type { WebsiteSettingsResponse } from "@/types/api";
import Cookies from 'js-cookie';
import type { BookTrans, BookDetail, BookDetailResponse, CommentResponse, CommentData, CommentEpData, StickerSet, StickerResponse, ThreadResponse, ArticleResponse, CampaignDetailResponse, CampaignDetailData, StoreCategory, StoreResponse, BookPurchaseDetailsResponse, CategoryBookListResponse, CategoryDetail, CategoryAllResponse, LatestReadEpisodeResponse } from "@/types/api";

export interface Slide {
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

export const fetchHomeData = async (): Promise<HomeDataResponse | null> => {
  try {
    const response = await apiClient.get<HomeDataResponse>("/getAllBookHome");
    console.log('getAllBookHome API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching home data:', error);
    return null;
  }
}

export const fetchWebsiteSettings = async (): Promise<WebsiteSettingsResponse | null> => {
  try {
    const response = await apiClient.get<WebsiteSettingsResponse>("/get_website");
    return response.data;
  } catch (error) {
    console.error('Error fetching website settings:', error);
    return null;
  }
}

export const fetchBookTrans = async (): Promise<BookTrans[]> => {
  try {
    const response = await apiClient.get<{ data: BookTrans[] }>("/getAllBookHome");
    console.log('getAllBookHome API Response:', response.data);
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('API response data is not an array:', response.data);
      return [];
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    return [];
  }
}

export const fetchBookTransById = async (id: string): Promise<BookTrans> => {
  try {
    const response = await apiClient.get(`/book/${id}`);
    console.log('API Response for /book/:id:', response.data);
    
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
    console.error('Error fetching book by ID:', error);
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
  console.log('🚀 apiServices.registerWriter called');
  console.log('📋 Request Data:', JSON.stringify(data, null, 2));
  console.log('🔐 Token:', token.substring(0, 50) + '...');
  
  try {
    const response = await apiClient.post('/user/writer', data, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('📦 Response Data:', response.data);
    
    // Response จาก backend: { code: 200, status: "success", message: "...", data: { token } }
    return response.data;
  } catch (error: any) {
    console.error('❌ API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Update writer information (reuse same endpoint if backend supports PUT)
export const updateWriter = async (data: Partial<WriterRegistrationData>, token: string) => {
  console.log('🚀 apiServices.updateWriter called (POST /user/writer)');
  console.log('📋 Request Data:', JSON.stringify(data, null, 2));
  console.log('🔐 Token (prefix):', typeof token === 'string' ? token.substring(0, 50) + '...' : token);

  try {
    // Use POST since backend appears to expose POST /user/writer (register endpoint)
    const response = await apiClient.post('/user/writer', data, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ updateWriter Response Status:', response.status);
    console.log('📦 updateWriter Response Data:', response.data);
    return response.data;
  } catch (err: any) {
    console.error('❌ updateWriter API Error:', err.response?.status, err.response?.data || err.message);
    throw err;
  }
};

export const fetchBookEpisodes = async (bookId: string | number) => {
  try {
  const token = localStorage.getItem('authToken');
    
    // TODO: ชั่วคราว - รอระบบ login จาก frontend อีกคน
    // ใส่ token demo เพื่อทดสอบ (ลบออกเมื่อมีระบบ login แล้ว)
    if (!token) {
      console.warn('⚠️ No auth token found - using demo mode (episodes may show as locked)');
      // API จะคืนข้อมูล episodes แต่ isBuy จะเป็น false ทั้งหมด
    }
    
    console.log('🔑 Fetching episodes with bookId:', bookId, 'type:', typeof bookId);
    console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : '❌ NO TOKEN (demo mode)');
    
    const response = await apiClient.get(`/bookgroup/${bookId}`);
    
    console.log('🔍 BookEpisodes API Response:', response.data);
    
    if (response.data && response.data.code === 200 && response.data.data) {
      const groups = response.data.data.groups || [];
      console.log('✅ Episodes loaded:', groups.length, 'groups');
      
      // Log ตัวอย่างตอนแรกเพื่อเช็คสถานะ isBuy
      if (groups.length > 0 && groups[0].list && groups[0].list.length > 0) {
        const firstEpisode = groups[0].list[0];
        console.log('📝 First episode sample:', {
          name: firstEpisode.name,
          coin: firstEpisode.coin,
          isBuy: firstEpisode.isBuy,
        });
      }
      
      return response.data.data;
    }
    
    throw new Error('ไม่พบข้อมูลตอน');
  } catch (error: any) {
    console.error('❌ Error fetching book episodes:', error);
    
    // Log detailed error from API response
    if (error.response) {
      console.error('📛 API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        message: error.response.data?.message,
      });
    }
    
    throw error;
  }
};

export const fetchBookGroups = async (bookId: string | number) => {
  try {
    console.log('🔍 fetchBookGroups for', bookId);
    const response = await apiClient.get(`/user/managebook/${bookId}/groups`);
    console.log('🔍 BookGroups API Response:', response.data);
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
    console.error('❌ Error fetching book groups:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
}



export const fetchGroupEpisodes = async (groupId: string | number) => {
  try {
    console.log('🔍 fetchGroupEpisodes for group', groupId);
    const response = await apiClient.get(`/user/managebook/group/${groupId}/eps`);
    console.log('🔍 GroupEpisodes API Response:', response.data);
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
    console.error('❌ Error fetching group episodes:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
}

export const updateEpisodesPrice = async (epIds: (string | number)[] | string, coin: number) => {
  try {
    // Backend expects a comma-separated string in `ep_ids` (per Postman screenshot)
    const idsCsv = Array.isArray(epIds) ? epIds.map(String).join(',') : String(epIds)
    const payload = { ep_ids: idsCsv, coin }
    console.log('🔍 updateEpisodesPrice payload:', payload)
    const resp = await apiClient.put('/user/managebook/eps/price', payload)
    console.log('🔍 updateEpisodesPrice response:', resp.status, resp.data)
    return resp.data
  } catch (err: any) {
    console.error('❌ updateEpisodesPrice failed:', err?.response?.data ?? err.message ?? err)
    throw err
  }
}

export const fetchUserShelve = async (limit: number = 20, page: number = 1) => {
  try {
    console.log(`🔍 fetchUserShelve limit:${limit} page:${page}`)
    const resp = await apiClient.get('/user/getbookshelve', {
      params: { limit, page }
    })
    console.log('🔍 fetchUserShelve response:', resp.status, resp.data)
    
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
    console.error('❌ fetchUserShelve failed:', err?.response?.data ?? err.message ?? err)
    throw err
  }
}

export const fetchUserShelveContinue = async (limit: number = 20, page: number = 1) => {
  try {
    console.log(`🔍 fetchUserShelveContinue limit:${limit} page:${page}`)
    const resp = await apiClient.get('/user/getbookshelvecontinue', {
      params: { limit, page }
    })
    console.log('🔍 fetchUserShelveContinue response:', resp.status, resp.data)
    
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
    console.error('❌ fetchUserShelveContinue failed:', err?.response?.data ?? err.message ?? err)
    throw err
  }
}

export const fetchUserShelveBuy = async (limit: number = 20, page: number = 1, order: string = 'desc') => {
  try {
    console.log(`🔍 fetchUserShelveBuy limit:${limit} page:${page} order:${order}`)
    const resp = await apiClient.get('/user/getbookshelvebuy', {
      params: { limit, page, order }
    })
    console.log('🔍 fetchUserShelveBuy response:', resp.status, resp.data)
    
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
    console.error('❌ fetchUserShelveBuy failed:', err?.response?.data ?? err.message ?? err)
    throw err
  }
}


export const redeemCode = async (code: string) => {
  try {
    // Backend expects key `redeemCode` in the request body (see Postman)
    console.log('🔍 redeemCode payload (redeemCode):', code)
    const payload = { redeemCode: code }
    const resp = await apiClient.post('/user/redeem', payload)
    console.log('🔍 redeemCode response:', resp.status, resp.data)
    return resp.data
  } catch (err: any) {
    console.error('❌ redeemCode failed:', err?.response?.data ?? err.message ?? err)
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
      console.log('🔍 deleteGroupEpisode trying', path)
      const response = await apiClient.delete(path)
      console.log('🔍 deleteGroupEpisode API Response for', path, response.data)
      return response.data
    } catch (error: any) {
      lastErr = error
      console.warn('⚠️ deleteGroupEpisode path failed:', path, error?.response?.status ?? error?.message ?? error)
      // continue trying other paths
    }
  }
  // As a last resort, try sending DELETE with a request body (some servers expect payload)
  try {
    console.log('🔍 deleteGroupEpisode trying DELETE with body payload')
    const response = await apiClient.delete('/user/managebook/eps', { data: { episodeId, groupId } })
    console.log('🔍 deleteGroupEpisode API Response for body-delete', response.data)
    return response.data
  } catch (error: any) {
    lastErr = error
    console.warn('⚠️ deleteGroupEpisode body-delete failed:', error?.response?.status ?? error?.message ?? error)
  }

  // Some backends expose a specific '/eps/delete' action route (seen in your screenshot).
  // Try DELETE with body first, then POST to that path.
  try {
    console.log('🔍 deleteGroupEpisode trying DELETE /user/managebook/eps/delete with body')
    const response = await apiClient.delete('/user/managebook/eps/delete', { data: { episodeId, groupId } })
    console.log('🔍 deleteGroupEpisode API Response for eps/delete (DELETE)', response.data)
    return response.data
  } catch (error: any) {
    lastErr = error
    console.warn('⚠️ deleteGroupEpisode eps/delete (DELETE) failed:', error?.response?.status ?? error?.message ?? error)
  }

  try {
    console.log('🔍 deleteGroupEpisode trying POST /user/managebook/eps/delete with body')
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
        console.log('🔍 deleteGroupEpisode trying POST /user/managebook/eps/delete with body:', body)
        const response = await apiClient.post('/user/managebook/eps/delete', body)
        console.log('🔍 deleteGroupEpisode API Response for eps/delete (POST)', response.data)
        return response.data
      } catch (err: any) {
        lastErr = err
        console.warn('⚠️ eps/delete (POST) payload failed:', body, err?.response?.status ?? err?.message ?? err)
        // try next payload shape
      }
    }
  } catch (error: any) {
    lastErr = error
    console.warn('⚠️ deleteGroupEpisode eps/delete (POST) failed:', error?.response?.status ?? error?.message ?? error)
  }

  // Some clients / Postman were using PUT with key `ep_ids` (string or CSV). Try that exact shape.
  try {
    console.log('🔍 deleteGroupEpisode trying PUT /user/managebook/eps/delete with ep_ids variants')
    const epIdsString = String(episodeId)
    const putVariants = [
      { ep_ids: epIdsString },
      { ep_ids: [episodeId] },
      { ep_ids: epIdsString, group_id: groupId },
      { ep_ids: epIdsString, groupId },
    ]

    for (const body of putVariants) {
      try {
        console.log('🔍 deleteGroupEpisode trying PUT /user/managebook/eps/delete with body:', body)
        const resp = await apiClient.put('/user/managebook/eps/delete', body)
        console.log('🔍 deleteGroupEpisode API Response for eps/delete (PUT)', resp.status, resp.data)
        return resp.data
      } catch (err: any) {
        lastErr = err
        console.warn('⚠️ eps/delete (PUT) payload failed:', body, err?.response?.status ?? err?.message ?? err)
      }
    }
  } catch (err: any) {
    lastErr = err
    console.warn('⚠️ deleteGroupEpisode eps/delete (PUT) failed:', err?.response?.status ?? err?.message ?? err)
  }

  console.error('❌ Error deleting group episode (all tried endpoints failed):', lastErr?.response?.data ?? lastErr?.message ?? lastErr)
  throw lastErr
}

export const fetchBookDetail = async (bookId: string): Promise<BookDetail> => {
  try {
    // Try new management API first (/user/managebook/:id/detail)
    try {
      const resp = await apiClient.get(`/bookdetail/${bookId}`);
      console.log('🔍 BookDetail (managebook) API Response:', resp.data);
      if (resp?.data) {
        // some backends return { code, data } others return data directly
        const payload = resp.data.data ?? resp.data;
        if (payload) {
          console.log('✅ Book detail loaded from managebook:', payload.name ?? payload.title ?? bookId);
          return payload as BookDetail;
        }
      }
      // if that endpoint didn't return expected data, fallthrough to legacy
    } catch (err: any) {
      console.warn('managebook detail endpoint failed, falling back to legacy /bookdetail:', err?.message ?? err);
    }

    // Fallback to legacy endpoint
    const response = await apiClient.get<BookDetailResponse>(`/bookdetail/${bookId}`);
    console.log('🔍 BookDetail (legacy) API Response:', response.data);
    if (response.data && response.data.data) {
      console.log('✅ Book detail loaded (legacy):', response.data.data.name);
      return response.data.data;
    }

    throw new Error('ไม่พบข้อมูลหนังสือ');
  } catch (error) {
    console.error('❌ Error fetching book detail:', error);
    throw error;
  }
};

export const fetchMyBookDetail = async (bookId: string): Promise<BookDetail> => {
  try {
    // Try new management API first (/user/managebook/:id/detail)
    try {
      const resp = await apiClient.get(`/bookdetail/${bookId}`);
      console.log('🔍 BookDetail (managebook) API Response:', resp.data);
      if (resp?.data) {
        // some backends return { code, data } others return data directly
        const payload = resp.data.data ?? resp.data;
        if (payload) {
          console.log('✅ Book detail loaded from managebook:', payload.name ?? payload.title ?? bookId);
          return payload as BookDetail;
        }
      }
      // if that endpoint didn't return expected data, fallthrough to legacy
    } catch (err: any) {
      console.warn('managebook detail endpoint failed, falling back to legacy /bookdetail:', err?.message ?? err);
    }

    // Fallback to legacy endpoint
    const response = await apiClient.get<BookDetailResponse>(`/bookdetail/${bookId}`);
    console.log('🔍 BookDetail (legacy) API Response:', response.data);
    if (response.data && response.data.data) {
      console.log('✅ Book detail loaded (legacy):', response.data.data.name);
      return response.data.data;
    }

    throw new Error('ไม่พบข้อมูลหนังสือ');
  } catch (error) {
    console.error('❌ Error fetching book detail:', error);
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
    console.log('🔍 createGroup for book', bookId, 'name:', name)
    const payload = { book_id: String(bookId), name }
    const resp = await apiClient.post('/user/managebook/group', payload)
    console.log('🔍 createGroup response:', resp.status, resp.data)
    return resp.data
  } catch (err: any) {
    console.error('❌ createGroup failed:', err?.response?.data ?? err.message ?? err)
    throw err
  }
}

export const getBankList = async () => {
  try {
    const response = await apiClient.get('/writer/bank_list');
    return response.data?.data ?? [];
  } catch (error: any) {
    console.error('Error fetching bank list:', error);
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
    console.error('Error updating bank account info:', error);
    throw error;
  }
};

export const getBankIdCardAccount = async () => {
  try {
    const response = await apiClient.get('/writer/bank_idcard_account');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching bank account info:', error);
    throw error;
  }
};

export const createPromotion = async (payload: {
  group_ids: string;
  subject: string;
  start_date: string;
  end_date: string;
  discount_percent: string | number;
}) => {
  try {
    console.log('🔍 createPromotion payload:', payload);
    const response = await apiClient.post('/user/managebook/groups/promotion', payload);
    console.log('🔍 createPromotion response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating promotion:', error);
    throw error;
  }
};

export const updatePromotion = async (payload: {
  dfb_id: number;
  groupIDs: string;
  subject: string;
  start_date: string;
  end_date: string;
  discount_percent: string | number;
}) => {
  try {
    console.log('🔍 updatePromotion payload:', payload);
    const response = await apiClient.put('/user/managebook/groups/promotion', payload);
    console.log('🔍 updatePromotion response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating promotion:', error);
    throw error;
  }
};

export const deletePromotion = async (dfbId: string | number) => {
  try {
    console.log('🔍 deletePromotion id:', dfbId);
    // Backend expects DELETE with body { dfb_id: ... }
    const response = await apiClient.delete('/user/managebook/groups/promotion', {
      data: { dfb_id: Number(dfbId) }
    });
    console.log('🔍 deletePromotion response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting promotion:', error);
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
        console.log('🔍 createGroupEpisodePromotion payload:', payload);
        const response = await apiClient.post('/user/managebook/eps/promotion', payload);
        console.log('🔍 createGroupEpisodePromotion response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error creating episode promotion:', error);
        throw error;
    }
};

export const deleteGroupEpisodePromotion = async (ids: string) => {
    try {
        console.log('🔍 deleteGroupEpisodePromotion ids:', ids);
        // Backend expects DELETE with body { ids: "..." }
        const response = await apiClient.delete('/user/managebook/eps/promotion', {
            data: { ids }
        });
        console.log('🔍 deleteGroupEpisodePromotion response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error deleting episode promotion:', error);
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
    console.error('Error fetching book updates:', error);
    return [];
  }
};

export const fetchBookReviews = async (bookId: string | number, page: number = 1, limit: number = 10, sort: string = 'newest'): Promise<{ comments: CommentData[], pagination?: any }> => {
  try {
    console.log('🔍 fetchBookReviews for book', bookId, 'page:', page, 'sort:', sort);
    const response = await apiClient.get<CommentResponse>(`/bookdetail/${bookId}/reviews`, {
        params: { page, limit, sort }
    });
    console.log('🔍 BookReviews API Response:', response.data);
    
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
    console.error('❌ Error fetching book reviews:', error?.response?.data ?? error.message ?? error);
    return { comments: [] };
  }
};

export const postBookReview = async (bookId: string | number, comment: string, star: number) => {
  try {
    console.log('🔍 postBookReview', { bookId, comment, star });
    const payload = { comment, star };
    const response = await apiClient.post(`/bookdetail/${bookId}/reviews`, payload);
    console.log('🔍 postBookReview response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error posting book review:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
};

export const postReply = async (commentBookId: string | number, comment: string) => {
  try {
    console.log('🔍 postReply', { commentBookId, comment });
    const payload = { comment };
    const response = await apiClient.post(`/bookdetail/reviews/${commentBookId}/replies`, payload);
    console.log('🔍 postReply response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error posting reply:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
};

export const deleteBookReview = async (commentBookId: string | number) => {
  try {
    console.log('🔍 deleteBookReview', commentBookId);
    const response = await apiClient.delete(`/bookdetail/reviews/${commentBookId}`);
    console.log('🔍 deleteBookReview response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error deleting review:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
};

export const reportBookReview = async (commentBookId: string | number) => {
  try {
    console.log('🔍 reportBookReview', commentBookId);
    // Backend expects POST /bookdetail/reviews/:comment_book_id/report
    const response = await apiClient.post(`/bookdetail/reviews/${commentBookId}/report`);
    console.log('🔍 reportBookReview response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error reporting review:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
};

export const deleteBookReviewReply = async (replyId: string | number) => {
  try {
    console.log('🔍 deleteBookReviewReply', replyId);
    const response = await apiClient.delete(`/bookdetail/reviews/replies/${replyId}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error deleting review reply:', error);
    throw error;
  }
};

export const fetchStoreData = async (): Promise<StoreCategory[]> => {
  try {
    const response = await apiClient.get<StoreResponse>('/user/store');
    console.log('🔍 fetchStoreData response:', response.data);
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching store data:', error);
    return [];
  }
};

export const reportBookReviewReply = async (replyId: string | number) => {
  try {
    console.log('🔍 reportBookReviewReply', replyId);
    const response = await apiClient.post(`/bookdetail/reviews/replies/${replyId}/report`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error reporting review reply:', error);
    throw error;
  }
};

export const fetchStickers = async (): Promise<StickerSet[]> => {
  try {
    console.log('🔍 fetchStickers');
    const response = await apiClient.get<StickerResponse>("/stickers");
    console.log('🔍 Sticker API Response:', response.data);
    return response.data?.data ?? [];
  } catch (error: any) {
    console.error('❌ Error fetching stickers:', error?.response?.data ?? error.message ?? error);
    return [];
  }
};

export interface WriterBook {
    book_id: number;
    name: string;
    img: string;
    user_id: number;
    view: number;
    end: string;
    status: string;
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

export const fetchWriterProfile = async (writerId: string | number): Promise<WriterProfileResponse['data'] | null> => {
    try {
        const response = await apiClient.get<WriterProfileResponse>(`/profile/${writerId}`);
        return response.data?.data ?? null;
    } catch (error) {
        console.error("Error fetching writer profile:", error);
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
        console.log(`🔍 fetchWriterBooks writerId:${writerId} type:${type} page:${page}`);
        // Endpoint: /profile/:writer_id/books/:type/:page
        const response = await apiClient.get<WriterBooksResponse>(`/profile/${writerId}/books/${type}/${page}`, {
            params: {
                limit,
                sortBy,
                type: 'promotion' // The image shows this query param too? Let's keep it flexible or follow image strictly?
                // The image shows: ?limit=5&type=promotion&sortBy=view
                // But the path has :type too.
                // It's possible the path :type is for filter (like 'new', 'recommend') and query type is for something else?
                // Or maybe redundancy?
                // I will trust the path param 'type' first, and maybe add query params if needed. 
                // Wait, the prompt image says `{{path}} /profile/:writer_id/books/:type/:page ?limit=5&type=promotion&sortBy=view`
                // It specifically has `type=promotion` in query. 
                // Let's pass extra params flexibly.
            }
        });
        console.log('🔍 fetchWriterBooks Response:', response.data);
        return response.data?.data ?? null;
// ... existing fetchWriterBooks implementation ...
    } catch (error: any) {
        console.error('❌ Error fetching writer books:', error?.response?.data ?? error.message ?? error);
        return null;
    }
};

export const followWriter = async (writerId: number | string, action: 'follow' | 'unfollow') => {
    try {
        console.log(`🔍 followWriter writerId:${writerId} action:${action}`);
        const response = await apiClient.post('/profile/follow', {
            writer_id: Number(writerId),
            action: action
        });
        console.log('🔍 followWriter Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error following/unfollowing writer:', error?.response?.data ?? error.message ?? error);
        throw error;
    }
};
// --- Book Comments (Episode Comments) API ---

export const fetchBookComments = async (bookId: string | number, page: number = 1, limit: number = 10, sort: string = 'newest'): Promise<{ comments: CommentEpData[], pagination?: any }> => {
  try {
    console.log('🔍 fetchBookComments for book', bookId, 'page:', page, 'sort:', sort);
    const response = await apiClient.get<CommentResponse>(`/bookdetail/${bookId}/comments`, {
        params: { page, limit, sort }
    });
    console.log('🔍 BookComments API Response:', response.data);
    
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
    console.error('❌ Error fetching book comments:', error?.response?.data ?? error.message ?? error);
    return { comments: [] };
  }
};

export const postCommentReply = async (commentEpId: string | number, comment: string) => {
  try {
    console.log('🔍 postCommentReply', { commentEpId, comment });
    const payload = { comment };
    // API: POST /bookdetail/comments/:comment_ep_id/replies
    const response = await apiClient.post(`/bookdetail/comments/${commentEpId}/replies`, payload);
    console.log('🔍 postCommentReply response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error posting comment reply:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
};

export const deleteBookComment = async (commentEpId: string | number) => {
  try {
    console.log('🔍 deleteBookComment', commentEpId);
    // API: DELETE /bookdetail/comments/:comment_ep_id
    const response = await apiClient.delete(`/bookdetail/comments/${commentEpId}`);
    console.log('🔍 deleteBookComment response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error deleting comment:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
};

export const reportBookComment = async (commentEpId: string | number) => {
  try {
    console.log('🔍 reportBookComment', commentEpId);
    // API: POST /bookdetail/comments/:comment_ep_id/report
    const response = await apiClient.post(`/bookdetail/comments/${commentEpId}/report`);
    console.log('🔍 reportBookComment response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error reporting comment:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
};

export const deleteBookCommentReply = async (replyId: string | number) => {
  try {
    console.log('🔍 deleteBookCommentReply', replyId);
    const response = await apiClient.delete(`/bookdetail/comments/replies/${replyId}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error deleting comment reply:', error);
    throw error;
  }
};

export const reportBookCommentReply = async (replyId: string | number) => {
  try {
    console.log('🔍 reportBookCommentReply', replyId);
    const response = await apiClient.post(`/bookdetail/comments/replies/${replyId}/report`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error reporting comment reply:', error);
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
    console.error('Error fetching popular articles:', error);
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
    console.error('Error fetching latest articles:', error);
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

export const fetchRankingBooks = async (range: RankingTimeRange = 'week', page: number = 1, limit: number = 10): Promise<{ books: RankingBook[]; pagination: ArticlePagination }> => {
  try {
    const response = await apiClient.get<RankingResponse>(`/books/ranks/${range}?limit=${limit}&page=${page}`);
    return response.data?.data || { books: [], pagination: { page: 1, limit, total: 0, totalPages: 0, nextPage: null, prevPage: null } };
  } catch (error) {
    console.error(`Error fetching ranking books (${range}):`, error);
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
    console.log('🔍 fetchThreads params:', params);
    const response = await apiClient.get<ThreadResponse>('/user/threads', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        ...params
      }
    });
    console.log('🔍 fetchThreads response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching threads:', error?.response?.data ?? error.message ?? error);
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
    console.log('🔍 createThread payload:', payload);
    const response = await apiClient.post('/user/threads', payload);
    console.log('🔍 createThread response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creating thread:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
};

export const fetchBookPromotions = async (page = 1, limit = 20) => {
  try {
    const response = await apiClient.get('/books/promotions/ep', { params: { page, limit } });
    console.log('fetchBookPromotions response:', response.data);
    return response.data;
  } catch (err: any) {
    console.error('fetchBookPromotions error:', err);
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
    console.error('Error fetching thread detail:', error);
    throw error;
  }
};

export const fetchThreadComments = async (topicId: string | number, page: number = 1): Promise<{ comments: CommentData[], pagination?: any }> => {
  try {
    console.log(`Getting comments for topic ${topicId}, page ${page}`);
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
    console.error('Error fetching thread comments:', error);
    return { comments: [] };
  }
};

export const postThreadComment = async (topicId: string | number, comment: string) => {
  try {
    const response = await apiClient.post(`/user/threads/${topicId}/comments`, { comment });
    return response.data;
  } catch (error: any) {
    console.error('Error posting thread comment:', error);
    throw error;
  }
};

export const postThreadReply = async (topicId: string | number, commentTopicId: string | number, comment: string) => {
  try {
    const response = await apiClient.post(`/user/threads/${topicId}/comments/${commentTopicId}/replies`, { comment });
    return response.data;
  } catch (error: any) {
    console.error('Error posting thread reply:', error);
    throw error;
  }
};


export const fetchArticleDetail = async (articleId: string | number): Promise<ArticleResponse | null> => {
  try {
    const response = await apiClient.get<ArticleResponse>(`/articles/${articleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching article detail:', error);
    return null;
  }
};


export const fetchCampaignDetail = async (id: string | number): Promise<CampaignDetailData | null> => {
  try {
    const response = await apiClient.get<CampaignDetailResponse>(`/campaigns/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching campaign detail:', error);
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
    console.log('[DEBUG] Fetching ranking categories...');
    const response = await apiClient.get<RankingCategoryResponse>("/books/ranking/categories");
    console.log('[DEBUG] Ranking Categories Response:', response.data);
    if (response.data && response.data.code === 200) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching ranking categories:', error);
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

export const fetchCategoryRankingBooks = async (categoryId: number, range: number, limit: number = 5): Promise<CategoryRankingBookItem[]> => {
  try {
    const url = `/books/ranking/${categoryId}/${range}?limit=${limit}`;
    console.log(`[DEBUG] Fetching ranking: ${url}`);
    const response = await apiClient.get<CategoryRankingBooksResponse>(url);
    
    console.log(`[DEBUG] Raw API Response for ${categoryId}:`, response.data);

    // Detailed validation
    if (response.data && response.data.code === 200 && response.data.data) {
       const list = response.data.data.list;
       if (Array.isArray(list)) {
           console.log(`[DEBUG] Ranking loaded for ${categoryId}: ${list.length} items`);
           return list;
       }
       console.warn(`[DEBUG] Ranking list is not an array for ${categoryId}:`, list);
       return [];
    }
    
    console.warn('[DEBUG] Ranking API returned non-200 or missing data:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching ranking books:', error);
    return [];
  }

};

export const buyStorePack = async (packId: string | number) => {
  try {
    console.log('🔍 buyStorePack packId:', packId);
    // Backend expects POST /user/store with { store_pack_id: ... }
    const response = await apiClient.post('/user/store', {
       store_pack_id: String(packId)
    });
    console.log('🔍 buyStorePack response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error buying store pack:', error);
    throw error;
  }
};

export const fetchBookPurchaseDetails = async (bookId: string | number) => {
  try {
    console.log('🔍 fetchBookPurchaseDetails bookId:', bookId);
    const response = await apiClient.get<BookPurchaseDetailsResponse>(`/bookdetail/purchase/${bookId}`);
    return response.data?.data;
  } catch (error: any) {
    console.error('Error fetching book purchase details:', error);
    return null;
  }
};

export const postBannerClick = async (bannerId: number) => {
  try {
    await apiClient.post('/banner-click', { banner_id: bannerId });
  } catch (error) {
    console.error('Error tracking banner click:', error);
  }
};

export const postBookClick = async (bookId: string | number) => {
  try {
    const id = Number(bookId);
    if (!id || isNaN(id)) return;
    await apiClient.post('/bookdetail/click', { book_id: id });
  } catch (error) {
    console.error('Error tracking book click:', error);
  }
};

export const postCampaignClick = async (campaignId: number) => {
  try {
    if (!campaignId) return;
    await apiClient.post(`/campaigns/${campaignId}/click`, { id: campaignId });
  } catch (error) {
    console.error('Error tracking campaign click:', error);
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
    console.error('Error fetching recent notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: number) => {
  try {
    const response = await apiClient.patch(`/user/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiClient.patch('/user/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return null;
  }
};

export const postCommentNotification = async (commentId: string | number) => {
  try {
    // Send empty object as body to avoid 400 Bad Request
    const response = await apiClient.post(`/user/notifications/comments/${commentId}`, {});
    return response.data;
  } catch (error) {
    console.error('Error posting comment notification:', error);
    return null;
  }
};

export const postReviewNotification = async (commentId: string | number) => {
  try {
    const response = await apiClient.post(`/user/notifications/reviews/${commentId}`, {});
    return response.data;
  } catch (error) {
    console.error('Error posting review notification:', error);
    return null;
  }
};

export const postReviewReplyNotification = async (commentId: string | number) => {
  try {
    const response = await apiClient.post(`/user/notifications/reviews/replies/${commentId}`, {});
    return response.data;
  } catch (error) {
    console.error('Error posting review reply notification:', error);
    return null;
  }
};

export const postCommentReplyNotification = async (commentId: string | number) => {
  try {
    const response = await apiClient.post(`/user/notifications/comments/replies/${commentId}`, {});
    return response.data;
  } catch (error) {
    console.error('Error posting comment reply notification:', error);
    return null;
  }
};

// --- Episode Comments API (Read Page) ---

export const fetchEpisodeComments = async (epId: string | number, page: number = 1, limit: number = 10, sort: string = 'newest'): Promise<{ comments: CommentEpData[], pagination?: any }> => {
  try {
    console.log('🔍 fetchEpisodeComments for ep', epId, 'page:', page);
    const response = await apiClient.get<CommentResponse>(`/readep/${epId}/comments`, {
        params: { page, limit, sort }
    });
    console.log('🔍 EpisodeComments API Response:', response.data);
    
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
    console.error('❌ Error fetching episode comments:', error?.response?.data ?? error.message ?? error);
    return { comments: [] };
  }
};

export const postEpisodeComment = async (epId: string | number, comment: string) => {
  try {
    console.log('🔍 postEpisodeComment', { epId, comment });
    const payload = { comment };
    const response = await apiClient.post(`/readep/${epId}/comments`, payload);
    console.log('🔍 postEpisodeComment response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error posting episode comment:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
};

export const postEpisodeReply = async (commentEpId: string | number, comment: string) => {
  try {
    console.log('🔍 postEpisodeReply', { commentEpId, comment });
    const payload = { comment };
    const response = await apiClient.post(`/readep/comments/${commentEpId}/replies`, payload);
    console.log('🔍 postEpisodeReply response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error posting episode reply:', error?.response?.data ?? error.message ?? error);
    throw error;
  }
};

export const reportEpisodeComment = async (commentEpId: string | number) => {
  try {
    console.log('🔍 reportEpisodeComment', commentEpId);
    const response = await apiClient.post(`/readep/comments/${commentEpId}/report`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error reporting episode comment:', error);
    throw error;
  }
};

export const reportEpisodeReply = async (commentSubEpId: string | number) => {
  try {
    console.log('🔍 reportEpisodeReply', commentSubEpId);
    const response = await apiClient.post(`/readep/comments/replies/${commentSubEpId}/report`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error reporting episode reply:', error);
    throw error;
  }
};

export const deleteEpisodeComment = async (commentEpId: string | number) => {
  try {
    console.log('🔍 deleteEpisodeComment', commentEpId);
    const response = await apiClient.delete(`/readep/comments/${commentEpId}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error deleting episode comment:', error);
    throw error;
  }
};

export const deleteEpisodeReply = async (commentSubEpId: string | number) => {
  try {
    console.log('🔍 deleteEpisodeReply', commentSubEpId);
    const response = await apiClient.delete(`/readep/comments/replies/${commentSubEpId}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error deleting episode reply:', error);
    throw error;
  }
};

export const syncReadingProgress = async (ep_id: string | number) => {
  try {
    const response = await apiClient.post('/reading-progress/sync', { ep_id: String(ep_id) });
    return response.data;
  } catch (error: any) {
    console.error('Error syncing reading progress:', error);
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
    console.warn('Error updating reading progress:', error);
    return null;
  }
};

export const fetchCategoryBooks = async (
  type: string,
  categoryId: string | number,
  tab: string = 'new',
  page: number = 1,
  limit: number = 20
): Promise<CategoryBookListResponse | null> => {
  try {
    const response = await apiClient.get<CategoryBookListResponse>(`/book-category/list`, {
      params: { type, categoryId, tab, limit, page }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching category books:', error);
    return null;
  }
};

export const fetchAllCategories = async (): Promise<CategoryDetail[]> => {
  try {
    const response = await apiClient.get<CategoryAllResponse>('/book-category/all');
    console.log('🔍 fetchAllCategories API Response:', response.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error('Error fetching all categories:', error);
    return [];
  }
};

export const fetchLatestReadEpisode = async (bookId: string | number): Promise<LatestReadEpisodeResponse | null> => {
  try {
    const response = await apiClient.get<LatestReadEpisodeResponse>(`/bookdetail/latest-read-ep/${bookId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching latest read episode:', error);
    return null;
  }
};

export const fetchUserMyBookInfo = async () => {
  try {
    const response = await apiClient.get('/user/writer/info');
    return response.data;
  } catch (error) {
    console.error("Error fetching writer info:", error);
    return null;
  }
};

export const fetchUserMyBooks = async (page: number = 1, limit: number = 30) => {
  try {
    const response = await apiClient.get('/user/mybook/search', { params: { page, limit } });
    return response.data;
  } catch (error) {
    console.error("Error fetching user mybooks:", error);
    return null;
  }
};


