
import apiClient from "../apiClient";
import type { WebsiteSettingsResponse } from "@/types/api";
import Cookies from 'js-cookie';

// --- Writer Registration & Check ---

export interface WriterRegistrationData {
  writer_name: string;
  fullname: string;
  user_id?: string;
  email?: string;
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
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const updateWriter = async (data: Partial<WriterRegistrationData>, token: string) => {
  try {
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
    const response = await apiClient.get<{ code: number, status: string, message: string, data: WriterCheckResponse }>('/user/writer/check');
    return response.data?.data || null;
  } catch (error) {
    return null;
  }
};

// --- User Profile & Address ---

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

// --- Writer Profile (Public) ---

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
    const response = await apiClient.get<WriterBooksResponse>(`/profile/${writerId}/books/${type}/${page}`, {
      params: {
        limit,
        sortBy
      }
    });
    return response.data?.data ?? null;
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

// --- User Shelve ---

export const fetchUserShelve = async (limit: number = 20, page: number = 1) => {
  try {
    const resp = await apiClient.get('/user/getbookshelve', {
      params: { limit, page }
    })

    const payload = resp.data?.data ?? resp.data

    if (payload && Array.isArray(payload.books)) {
      return payload
    }

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

    const payload = resp.data?.data ?? resp.data

    if (payload && Array.isArray(payload.books)) {
      return payload
    }

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

    const payload = resp.data?.data ?? resp.data

    if (payload && Array.isArray(payload.books)) {
      return payload
    }

    if (Array.isArray(payload)) {
      return { books: payload, paginate: null }
    }

    return { books: [], paginate: null }
  } catch (err: any) {
    throw err
  }
}

// --- Redeem ---

export const redeemCode = async (code: string) => {
  try {
    const payload = { redeemCode: code }
    const resp = await apiClient.post('/user/redeem', payload)
    return resp.data
  } catch (err: any) {
    throw err
  }
}

// --- Token Refresh ---

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

// --- Website Settings ---

export const fetchWebsiteSettings = async (): Promise<WebsiteSettingsResponse | null> => {
  try {
    const response = await apiClient.get<WebsiteSettingsResponse>("/get_website");
    if (response.data) {
    }
    return response.data;
  } catch (error) {
    console.error("fetchWebsiteSettings error:", error);
    return null;
  }
}

// --- Writer Profile (Authenticated) ---

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

// --- User Rank Profile ---

export interface RankProfileResponse {
  code: number;
  status: string;
  message: string;
  data: {
    total_rp: number;
    rp_needed: number;
    current_rank: {
      rank_id: number;
      name: string;
      min_rp: number;
      max_rp: number;
      rank_img: string;
    };
    next_rank: {
      name: string;
      rank_img: string;
    };
  };
}

export const fetchRankProfile = async (token?: string | null): Promise<RankProfileResponse['data'] | null> => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.get<RankProfileResponse>('/rank/profile', config);
    return response.data?.data ?? null;
  } catch (error) {
    return null;
  }
};

// --- All Ranks ---

export interface RankItem {
  rank_id: number;
  name: string;
  min_rp: number;
  max_rp: number | null;
  rank_img: string;
  is_current_rank: boolean;
}

export interface AllRanksResponse {
  code: number;
  status: string;
  message: string;
  data: {
    total_rp: number;
    rp_needed: number;
    ranks: RankItem[];
  };
}

export const fetchAllRanks = async (token?: string | null): Promise<RankItem[] | null> => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.get<AllRanksResponse>('/rank/all', config);
    return response.data?.data?.ranks ?? null;
  } catch (error) {
    return null;
  }
};

// --- Quests ---

export interface QuestItem {
  quest_id: number;
  name: string;
  description: string | null;
  reward_rp: string;
  max_per_user: number | null;
  current_count: number;
  status: 'incomplete' | 'complete';
  group: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
}

export interface QuestGroup {
  group_name: string;
  quests: QuestItem[];
}

export interface QuestsResponse {
  code: number;
  status: string;
  message: string;
  data: QuestGroup[];
}

export const fetchQuests = async (token?: string | null): Promise<QuestGroup[] | null> => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.get<QuestsResponse>('/rank/quests', config);
    return response.data?.data ?? null;
  } catch (error) {
    return null;
  }
};

export const claimQuest = async (questId: number, token?: string | null) => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.post('/rank/quests/claim', { quest_id: questId }, config);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
