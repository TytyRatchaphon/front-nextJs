
import apiClient from "../apiClient";
import type { StoreCategory, StoreResponse, StickerSet, StickerResponse } from "@/types/api";

export const fetchStoreData = async (): Promise<StoreCategory[]> => {
  try {
    const response = await apiClient.get<StoreResponse>('/user/store');
    return response.data?.data || [];
  } catch {
    return [];
  }
};

export const buyStorePack = async (packId: string | number) => {
  try {
    const response = await apiClient.post('/user/store', {
      store_pack_id: String(packId)
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const buyStorePackNow = async (
  packId: number | string,
  quantity: number,
  selectedStorePackListIds?: Array<number | string>
) => {
    try {
        const response = await apiClient.post('/user/store/buy-now', {
            store_pack_id: packId,
            quantity: quantity,
            ...(selectedStorePackListIds?.length
              ? { selected_store_pack_list_ids: selectedStorePackListIds }
              : {}),
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
}

export const fetchStickers = async (): Promise<StickerSet[]> => {
  try {
    const response = await apiClient.get<StickerResponse>("/stickers");
    return response.data?.data ?? [];
  } catch {
    return [];
  }
};

// --- Coupons ---

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
      rewardConfig: string;
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
  } catch {
    return [];
  }
};

export const fetchUserCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await apiClient.get<{ code: number; status: string; message: string; data: Coupon[] }>("/user/coupon/mine");
    return response.data?.data || [];
  } catch {
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
