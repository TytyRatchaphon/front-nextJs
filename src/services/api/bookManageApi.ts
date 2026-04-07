
import apiClient from "../apiClient";
import axios from 'axios';
import Cookies from 'js-cookie';

// --- Book Stats & Analytics ---

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

export const fetchBookStats = async (bookId: string | number): Promise<BookStats['data'] | null> => {
  try {
    const response = await apiClient.get<BookStats>(`/managebook/${bookId}/stats`);
    return response.data?.data || null;
  } catch {
    return null;
  }
};

export const fetchBookAnalytics = async (bookId: string | number, start: string, end: string): Promise<AnalyticsDataPoint[]> => {
  try {
    const response = await apiClient.get<BookAnalyticsResponse>(`/managebook/${bookId}/analytics`, {
      params: { start, end }
    });
    return response.data?.data || [];
  } catch {
    return [];
  }
}

export const fetchBookEpisodesStats = async (bookId: string | number, start: string, end: string): Promise<BookEpisodesStatsResponse['data'] | null> => {
  try {
    const response = await apiClient.get<BookEpisodesStatsResponse>(`/managebook/${bookId}/episodes/stats`, {
      params: { start, end }
    });
    return {
      total_data: response.data?.data?.total_data || [],
      total_purchase_list: response.data?.data?.total_purchase_list || []
    };
  } catch {
    return null;
  }
};

// --- Groups & Episodes Management ---

export const fetchBookGroups = async (bookId: string | number) => {
  try {
    const response = await apiClient.get(`/user/managebook/${bookId}/groups`);
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
    const payload = response.data?.data ?? response.data
    if (Array.isArray(payload)) return { episodes: payload }
    if (payload && Array.isArray((payload as any).episodes)) return { episodes: (payload as any).episodes }
    if (payload && Array.isArray((payload as any).list)) return { episodes: (payload as any).list }
    const alt = (response.data && (response.data as any).data) ?? null
    if (Array.isArray(alt)) return { episodes: alt }
    return { episodes: [] };
  } catch (error: any) {
    throw error;
  }
}

export const createGroup = async (bookId: string | number, name: string) => {
  try {
    const payload = { book_id: String(bookId), name }
    const resp = await apiClient.post('/user/managebook/group', payload)
    return resp.data
  } catch (err: any) {
    throw err
  }
}

export const updateGroup = async (groupId: string | number, name: string) => {
  const rawToken = Cookies.get('token');

  const token = rawToken ? rawToken.replace(/^['"]+|['"]+$/g, '') : '';

  if (!token) {
    throw new Error("ไม่พบ Token สำหรับเข้าสู่ระบบ");
  }

  const response = await axios.put(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/managebook/group/update`,
    {
      group_id: Number(groupId),
      name: name
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    }
  );

  return response.data;
};

export const deleteGroup = async (groupId: string | number) => {
  try {
    const response = await apiClient.delete('/user/managebook/group', {
      data: { group_id: String(groupId) }
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

export const deleteGroupEpisode = async (episodeId: string | number, groupId?: string | number) => {
  const endpoints: string[] = []

  if (groupId) {
    endpoints.push(`/user/managebook/group/${groupId}/eps/${episodeId}`)
    endpoints.push(`/user/managebook/group/${groupId}/ep/${episodeId}`)
    endpoints.push(`/user/managebook/${groupId}/eps/${episodeId}`)
    endpoints.push(`/user/managebook/${groupId}/ep/${episodeId}`)
  }

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
    }
  }
  try {
    const response = await apiClient.delete('/user/managebook/eps', { data: { episodeId, groupId } })
    return response.data
  } catch (error: any) {
    lastErr = error
  }

  try {
    const response = await apiClient.delete('/user/managebook/eps/delete', { data: { episodeId, groupId } })
    return response.data
  } catch (error: any) {
    lastErr = error
  }

  try {
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
      }
    }
  } catch (error: any) {
    lastErr = error
  }

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

export const updateEpisodesPrice = async (epIds: (string | number)[] | string, coin: number) => {
  try {
    const idsCsv = Array.isArray(epIds) ? epIds.map(String).join(',') : String(epIds)
    const payload = { ep_ids: idsCsv, coin }
    const resp = await apiClient.put('/user/managebook/eps/price', payload)
    return resp.data
  } catch (err: any) {
    throw err
  }
}

// --- Promotions Management ---

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
    const response = await apiClient.delete('/user/managebook/eps/promotion', {
      data: { ids }
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// --- My Books Search ---

export interface MyBookSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  order?: string;
  end?: string;
  type?: string;
  q?: string;
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
  } catch {
    return null;
  }
};

export const fetchUserMyBookListNames = async () => {
  try {
    const response = await apiClient.get('/user/mybook/list-names');
    return response.data;
  } catch {
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
