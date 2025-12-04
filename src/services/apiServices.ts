import apiClient from "./apiClient";
import axios from 'axios';
import Cookies from 'js-cookie';
import type { BookTrans, BookDetail, BookDetailResponse} from "@/types/api";

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

export interface HomeDataResponse {
  code: number;
  status: string;
  message: string;
  data: {
    slides: Slide[];
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

export const fetchUserShelve = async () => {
  try {
    console.log('🔍 fetchUserShelve')
    const resp = await apiClient.get('/user/getbookshelve')
    console.log('🔍 fetchUserShelve response:', resp.status, resp.data)
    const payload = resp.data?.data ?? resp.data
    if (Array.isArray(payload)) return payload
    // sometimes backend returns { code, data: [...] }
    if (payload && Array.isArray((payload as any).books)) return (payload as any).books
    return []
  } catch (err: any) {
    console.error('❌ fetchUserShelve failed:', err?.response?.data ?? err.message ?? err)
    throw err
  }
}

export const fetchUserShelveContinue = async (userId?: string | number) => {
  try {
    const idSegment = userId ? `/${String(userId)}` : ''
    console.log('🔍 fetchUserShelveContinue for', idSegment)
    const resp = await apiClient.get(`/user/getbookshelvecontinue${idSegment}`)
    console.log('🔍 fetchUserShelveContinue response:', resp.status, resp.data)
    const payload = resp.data?.data ?? resp.data
    if (Array.isArray(payload)) return payload
    if (payload && Array.isArray((payload as any).books)) return (payload as any).books
    return []
  } catch (err: any) {
    console.error('❌ fetchUserShelveContinue failed:', err?.response?.data ?? err.message ?? err)
    throw err
  }
}

export const fetchUserShelveBuy = async (userId?: string | number) => {
  try {
    console.log('🔍 fetchUserShelveBuy', userId ?? '')
    const resp = await apiClient.get('/user/getbookshelvebuy')
    console.log('🔍 fetchUserShelveBuy response:', resp.status, resp.data)
    const payload = resp.data?.data ?? resp.data
    if (Array.isArray(payload)) return payload
    if (payload && Array.isArray((payload as any).books)) return (payload as any).books
    return []
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
    const response = await apiClient.get('/user/bank_list');
    return response.data?.data ?? [];
  } catch (error: any) {
    console.error('Error fetching bank list:', error);
    throw error;
  }
};

export const updateBankIdCardAccount = async (formData: FormData) => {
  try {
    const response = await apiClient.post('/user/bank_idcard_account', formData, {
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
    const response = await apiClient.get('/user/bank_idcard_account');
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