
import apiClient from "../apiClient";
import { warnApiFallback } from "./apiFallback";

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
    if (response.data?.data) return response.data.data;
    warnApiFallback(`/managebook/${bookId}/stats`, 'null', response.data);
    return null;
  } catch (error) {
    warnApiFallback(`/managebook/${bookId}/stats`, 'null', error);
    return null;
  }
};

export const fetchBookAnalytics = async (bookId: string | number, start: string, end: string): Promise<AnalyticsDataPoint[]> => {
  try {
    const response = await apiClient.get<BookAnalyticsResponse>(`/managebook/${bookId}/analytics`, {
      params: { start, end }
    });
    if (Array.isArray(response.data?.data)) return response.data.data;
    warnApiFallback(`/managebook/${bookId}/analytics`, '[]', response.data);
    return [];
  } catch (error) {
    warnApiFallback(`/managebook/${bookId}/analytics`, '[]', error);
    return [];
  }
}

export const fetchBookEpisodesStats = async (bookId: string | number, start: string, end: string): Promise<BookEpisodesStatsResponse['data'] | null> => {
  try {
    const response = await apiClient.get<BookEpisodesStatsResponse>(`/managebook/${bookId}/episodes/stats`, {
      params: { start, end }
    });
    return {
      total_data: Array.isArray(response.data?.data?.total_data) ? response.data.data.total_data : [],
      total_purchase_list: Array.isArray(response.data?.data?.total_purchase_list) ? response.data.data.total_purchase_list : []
    };
  } catch (error) {
    warnApiFallback(`/managebook/${bookId}/episodes/stats`, 'null', error);
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
  const response = await apiClient.put('/user/managebook/group/update', {
    group_id: Number(groupId),
    name
  });

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

export interface UserMyBookPermissions {
  set_content_type: boolean;
  set_fast_ticket: boolean;
  set_fast_coin: boolean;
  set_fast_ticket_daily_increase: boolean;
  set_fast_coin_daily_increase: boolean;
  set_fast_ep_days: boolean;
  suggest_configs: unknown[];
}

const DEFAULT_MYBOOK_PERMISSIONS: UserMyBookPermissions = {
  set_content_type: false,
  set_fast_ticket: false,
  set_fast_coin: false,
  set_fast_ticket_daily_increase: false,
  set_fast_coin_daily_increase: false,
  set_fast_ep_days: false,
  suggest_configs: [],
};

const normalizePermissionFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'y' || normalized === 'yes';
  }
  return false;
};

const normalizeMyBookPermissions = (payload: unknown): UserMyBookPermissions | null => {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Partial<UserMyBookPermissions>;

  return {
    set_content_type: normalizePermissionFlag(data.set_content_type),
    set_fast_ticket: normalizePermissionFlag(data.set_fast_ticket),
    set_fast_coin: normalizePermissionFlag(data.set_fast_coin),
    set_fast_ticket_daily_increase: normalizePermissionFlag(data.set_fast_ticket_daily_increase),
    set_fast_coin_daily_increase: normalizePermissionFlag(data.set_fast_coin_daily_increase),
    set_fast_ep_days: normalizePermissionFlag(data.set_fast_ep_days),
    suggest_configs: Array.isArray(data.suggest_configs) ? data.suggest_configs : [],
  };
};

export interface UpdateEpisodesFastAccessPricePayload {
  ep_ids: string;
  fast_ticket: number;
  fast_ticket_daily_increase: number;
  fast_coin: number;
  fast_coin_daily_increase: number;
}

export const fetchUserMyBookPermissions = async (): Promise<UserMyBookPermissions | null> => {
  try {
    const response = await apiClient.get('/user/mybook-permissions');
    const normalized = normalizeMyBookPermissions(response.data?.data);
    if (normalized) return normalized;
    warnApiFallback('/user/mybook-permissions', 'default permissions', response.data);
    return DEFAULT_MYBOOK_PERMISSIONS;
  } catch (error) {
    warnApiFallback('/user/mybook-permissions', 'null', error);
    return null;
  }
};

export const updateEpisodesFastAccessPrice = async (
  epIds: (string | number)[] | string,
  values: Omit<UpdateEpisodesFastAccessPricePayload, 'ep_ids'>,
) => {
  try {
    const idsCsv = Array.isArray(epIds) ? epIds.map(String).join(',') : String(epIds);
    const payload: UpdateEpisodesFastAccessPricePayload = {
      ep_ids: idsCsv,
      fast_ticket: Number(values.fast_ticket ?? 0),
      fast_ticket_daily_increase: Number(values.fast_ticket_daily_increase ?? 0),
      fast_coin: Number(values.fast_coin ?? 0),
      fast_coin_daily_increase: Number(values.fast_coin_daily_increase ?? 0),
    };
    const response = await apiClient.put('/user/managebook/eps/fast-access-price', payload);
    return response.data;
  } catch (err: any) {
    throw err;
  }
};

// --- Promotions Management ---

type GroupIdsInput = string | number | Array<string | number>;

const normalizePromotionGroupIdArray = (groupIds: GroupIdsInput) => {
  const idList = Array.isArray(groupIds)
    ? groupIds.map(String)
    : String(groupIds).split(',');

  return idList.map((item) => {
    const trimmedItem = item.trim();
    const numericId = Number(trimmedItem);
    return Number.isFinite(numericId) ? numericId : item;
  }).filter((item) => String(item).trim().length > 0);
};

const normalizePromotionBookId = (bookId: string | number | undefined) => {
  if (bookId === undefined || bookId === null || bookId === '') return undefined;
  const numericBookId = Number(bookId);
  return Number.isFinite(numericBookId) ? numericBookId : bookId;
};

export const createPromotion = async (payload: {
  group_ids: GroupIdsInput;
  subject: string;
  start_date: string;
  end_date: string;
  discount_percent: string | number;
  book_id?: string | number;
}) => {
  const normalizedPayload = {
    ...payload,
    book_id: normalizePromotionBookId(payload.book_id),
    group_ids: normalizePromotionGroupIdArray(payload.group_ids),
    discount_percent: String(payload.discount_percent),
  };

  try {
    const response = await apiClient.post('/user/managebook/groups/promotion', normalizedPayload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const updatePromotion = async (payload: {
  dfb_id: number;
  groupIDs: GroupIdsInput;
  subject: string;
  start_date: string;
  end_date: string;
  discount_percent: string | number;
  book_id?: string | number;
}) => {
  const normalizedPayload = {
    ...payload,
    book_id: normalizePromotionBookId(payload.book_id),
    groupIDs: normalizePromotionGroupIdArray(payload.groupIDs),
    discount_percent: String(payload.discount_percent),
  };

  try {
    const response = await apiClient.put('/user/managebook/groups/promotion', normalizedPayload);
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
  } catch (error) {
    warnApiFallback('/user/mybook/search', 'null', error);
    return null;
  }
};

export const fetchUserMyBookReportCases = async (
  bookId: string | number,
  status: string = 'pending',
) => {
  try {
    const response = await apiClient.get(`/user/mybook/${bookId}/report-cases`, {
      params: { status },
    });
    return response.data;
  } catch (error) {
    warnApiFallback(`/user/mybook/${bookId}/report-cases`, 'null', error);
    return null;
  }
};

export const fetchUserMyBookListNames = async () => {
  try {
    const response = await apiClient.get('/user/mybook/list-names');
    return response.data;
  } catch (error) {
    warnApiFallback('/user/mybook/list-names', 'null', error);
    return null;
  }
};

export const fetchUserMyBookInfo = async (token?: string | null) => {
  try {
    const config = token ? { headers: { Authorization: token } } : {};
    const response = await apiClient.get('/user/writer/info', config);
    return response.data;
  } catch (error) {
    warnApiFallback('/user/writer/info', 'null', error);
    return null;
  }
};
