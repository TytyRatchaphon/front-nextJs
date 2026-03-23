
import apiClient from "../apiClient";
import type { CampaignDetailResponse, CampaignDetailData, CampaignDiscount, PackCampaignDetail } from "@/types/api";
import { cachedRequest } from "../requestCache";

export interface CampaignData {
  cp_id: number;
  name: string;
  detail: string;
  start_date: string;
  end_date: string;
  img_banner: string;
  img_banner2: string;
  img_shelf: string;
  color_bg: string;
  img_card: string[];
  status: string;
  ref_id: string;
}

export const fetchCampaigns = async (): Promise<CampaignData[]> => {
  return cachedRequest<CampaignData[]>(
    'campaigns:list',
    async () => {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const result = await response.json();
      if (result.code === 200 && result.data) {
        return result.data;
      }

      throw new Error(result.message || 'Failed to load data');
    },
    { ttlMs: 60 * 1000 }
  );
};

export const fetchPackCampaignDetail = async (id: string): Promise<PackCampaignDetail | null> => {
  try {
    return await cachedRequest<PackCampaignDetail | null>(
      `pack-campaign:${id}`,
      async () => {
        const response = await apiClient.get<{ code: number; data: PackCampaignDetail }>(`/pack-campaign/${id}`);
        if (response.data?.code !== 200) {
          return null;
        }
        return response.data.data;
      },
      {
        ttlMs: 60 * 1000,
        shouldCache: (value) => value !== null,
      }
    );
  } catch {
    return null;
  }
}

export const fetchCampaignsDiscount = async (): Promise<CampaignDiscount[]> => {
  try {
    return await cachedRequest<CampaignDiscount[]>(
      'campaigns:discount',
      async () => {
        const response = await apiClient.get<{ code: number; data: CampaignDiscount[] }>("/campaigns-discount");
        if (response.data?.code !== 200) {
          return [];
        }
        return response.data.data || [];
      },
      { ttlMs: 60 * 1000 }
    );
  } catch {
    return [];
  }
}

export const fetchCampaignDetail = async (id: string | number): Promise<CampaignDetailData | null> => {
  try {
    const response = await apiClient.get<CampaignDetailResponse>(`/campaigns/${id}`);
    return response.data.data;
  } catch {
    return null;
  }
};

export const postCampaignClick = async (campaignId: number) => {
  try {
    if (!campaignId) return;
    await apiClient.post(`/campaigns/${campaignId}/click`, { id: campaignId });
  } catch {
  }
};

export const postBannerClick = async (bannerId: number) => {
  try {
    await apiClient.post('/banner-click', { banner_id: bannerId });
  } catch {
  }
};

// --- Promoting Groups ---

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
    return await cachedRequest<PromotingGroup[]>(
      'promoting-groups',
      async () => {
        const response = await apiClient.get<{ code: number; data: PromotingGroup[] }>("/promoting-groups");
        return response.data?.data || [];
      },
      { ttlMs: 5 * 60 * 1000 }
    );
  } catch {
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
  } catch {
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
  } catch {
    return null;
  }
};
