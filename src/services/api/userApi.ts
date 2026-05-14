
import apiClient from "../apiClient";
import type { WebsiteSettingsResponse } from "@/types/api";
import Cookies from 'js-cookie';
import axios from "axios";

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
  reason?: string | null;
  can_create_book?: boolean;
  can_set_ep_price?: boolean;
  can_withdraw?: boolean;
  message: string;
}

export const fetchWriterCheck = async (): Promise<WriterCheckResponse | null> => {
  try {
    const response = await apiClient.get<{ code: number, status: string, message: string, data: WriterCheckResponse }>('/user/writer/check');
    return response.data?.data || null;
  } catch {
    return null;
  }
};

// --- User Profile & Address ---

export interface UserProfileCategory {
  id: number | string;
  name: string;
  order_by?: number | string;
}

export interface ChangePasswordPayload {
  oldpass: string;
  newpass1: string;
  newpass2: string;
  token: string;
}

export interface ChangeEmailPayload {
  new_email: string;
  current_password: string;
}

export const fetchUserProfileCategories = async (): Promise<UserProfileCategory[]> => {
  try {
    const response = await apiClient.get('/category');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  } catch {
    return [];
  }
};

export const changeUserPassword = async (payload: ChangePasswordPayload) => {
  return apiClient.post('/user/changepass', payload);
};

export const changeUserEmail = async (payload: ChangeEmailPayload) => {
  return apiClient.post('/change-email', payload);
};

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

export const fetchProfileFrames = async (token: string) => {
  const response = await axios.get('/api/getframes', {
    headers: { Authorization: token },
    timeout: 30000,
  });
  return response.data;
};

export const saveUserProfileViaRoute = async (formData: FormData, token: string) => {
  const response = await axios.post('/api/save_profile', formData, {
    headers: { Authorization: token },
  });
  return response.data;
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
  } catch {
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
  } catch {
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

export const pinBookShelve = async (book_ids: Array<number | string>, action: 'pin' | 'unpin') => {
  try {
    const resp = await apiClient.post('/user/pinbookshelve', {
      book_ids,
      action,
    });
    return resp.data;
  } catch (err: any) {
    throw err;
  }
}

// --- Payment History ---

export const fetchHasPaymentHistory = async (): Promise<boolean | null> => {
  try {
    const resp = await apiClient.get('/user/his_payment', {
      params: {
        page: 1,
        limit: 1,
      },
    });

    const payload = resp.data?.data ?? resp.data;
    const historyList = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.history)
          ? payload.history
          : Array.isArray(resp.data?.history)
            ? resp.data.history
            : [];

    return historyList.length > 0;
  } catch {
    return null;
  }
};

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
        const rawToken = Cookies.get('token');
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
    return response.data || null;
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
    noti_rewards: boolean;
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

const DEFAULT_RANK_IMAGE = "/images/user.png";

const normalizeRankImage = (value: string | null | undefined): string => {
  const raw = typeof value === "string" ? value.trim().replace(/^['"]+|['"]+$/g, "") : "";
  if (!raw || raw === "null" || raw === "undefined") return DEFAULT_RANK_IMAGE;

  if (raw.startsWith("data:")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;

  if (raw.startsWith("http://")) {
    // Prevent mixed-content blocking when frontend runs on HTTPS.
    return raw.replace(/^http:\/\//i, "https://");
  }

  if (raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return raw;

  // Backend may return host/path without protocol.
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(raw)) {
    return `https://${raw}`;
  }

  // Backend may return path-only rank image (no protocol/host).
  return `https://image.enjoybook.co/${raw.replace(/^\/+/, "")}`;
};

const normalizeBooleanFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "y" || normalized === "yes";
  }
  return false;
};

export const fetchRankProfile = async (token?: string | null): Promise<RankProfileResponse['data'] | null> => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.get<RankProfileResponse>('/rank/profile', config);
    const payload = response.data?.data ?? null;
    if (!payload) return null;
    const nextRankName = payload.next_rank?.name ?? (payload as { next_rank_name?: string })?.next_rank_name ?? "";

    return {
      ...payload,
      noti_rewards: normalizeBooleanFlag(payload.noti_rewards),
      current_rank: {
        ...payload.current_rank,
        rank_img: normalizeRankImage(payload.current_rank?.rank_img),
      },
      next_rank: {
        ...payload.next_rank,
        name: nextRankName,
        rank_img: normalizeRankImage(payload.next_rank?.rank_img),
      },
    };
  } catch {
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
  noti_rewards: boolean;
  is_current_rank: boolean;
  can_claim?: boolean;
  grant_id?: number | string | null;
  reward_claimed?: boolean;
  rewards?: {
    id?: number | string;
    grant_id?: number | string;
    name?: string;
    img?: string | null;
    amount?: number | null;
    description?: string | null;
    type?: string | null;
    can_claim?: boolean;
  }[];
  reward_note?: string | null;
}

export interface AllRanksResponse {
  code: number;
  status: string;
  message: string;
  data: {
    total_rp: number;
    rp_needed: number;
    noti_rewards: boolean;
    ranks: RankItem[];
  };
}

export type AllRanksData = AllRanksResponse["data"];

const normalizeRankItems = (ranks: RankItem[]): RankItem[] => (
  ranks.map((rank) => {
    const rankCanClaim = normalizeBooleanFlag(rank.can_claim);
    const rankGrantId = rank.grant_id ?? null;

    return {
      ...rank,
      rank_img: normalizeRankImage(rank.rank_img),
      noti_rewards: normalizeBooleanFlag(rank.noti_rewards),
      is_current_rank: normalizeBooleanFlag(rank.is_current_rank),
      can_claim: rankCanClaim,
      grant_id: rankGrantId,
      reward_claimed: normalizeBooleanFlag(rank.reward_claimed),
      rewards: Array.isArray(rank.rewards)
        ? rank.rewards.map((reward) => ({
            ...reward,
            can_claim: normalizeBooleanFlag(reward?.can_claim ?? rankCanClaim),
            grant_id: reward?.grant_id ?? rankGrantId ?? undefined,
            img: normalizeRankImage(reward?.img || null),
          }))
        : [],
    };
  })
);

export const fetchAllRanksData = async (token?: string | null): Promise<AllRanksData | null> => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.get<AllRanksResponse>('/rank/all', config);
    const payload = response.data?.data ?? null;
    const rawRanks = Array.isArray(payload)
      ? payload
      : payload?.ranks;
    if (!Array.isArray(rawRanks)) return null;
    const normalizedRanks = normalizeRankItems(rawRanks as RankItem[]);
    const payloadTotalRp = Number(Array.isArray(payload) ? undefined : payload?.total_rp);
    const payloadRpNeeded = Number(Array.isArray(payload) ? undefined : payload?.rp_needed);
    const normalizedNotiRewards = Array.isArray(payload)
      ? normalizedRanks.some((rank) => rank.noti_rewards)
      : (
        normalizeBooleanFlag(payload?.noti_rewards)
        || normalizedRanks.some((rank) => rank.noti_rewards)
      );

    const payloadMeta = !Array.isArray(payload) && payload ? payload : {};

    return {
      ...payloadMeta,
      total_rp: Number.isFinite(payloadTotalRp) ? Math.max(0, payloadTotalRp) : 0,
      rp_needed: Number.isFinite(payloadRpNeeded) ? Math.max(0, payloadRpNeeded) : 0,
      noti_rewards: normalizedNotiRewards,
      ranks: normalizedRanks,
    };
  } catch {
    return null;
  }
};

export const fetchAllRanks = async (token?: string | null): Promise<RankItem[] | null> => {
  const payload = await fetchAllRanksData(token);
  return payload?.ranks ?? null;
};

// --- Rank Reward Claim ---

export const claimRankReward = async (grantId: number | string, token?: string | null) => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.post(`/rank/rewards/${grantId}/claim`, {}, config);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const claimAllRankRewards = async (token?: string | null) => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.post('/rank/rewards/claim-all', {}, config);
    return response.data;
  } catch (error: any) {
    throw error;
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
  } catch {
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
