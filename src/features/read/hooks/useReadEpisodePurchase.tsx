import { useState, type ReactNode } from "react";
import Image from "next/image";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query";
import apiClient from "@/services/apiClient";
import {
  fetchEpisodePurchaseRewardPreview,
  type EpisodePurchaseRewardPreviewResult,
} from "@/services/api/episodePurchaseRewardApi";
import { useAuthStore, type AuthState } from "@/stores/authStore";
import { requestNavbarRankRefresh } from "@/utils/rankRefresh";
import {
  buildReadBuyPayload,
  getRegularEpisodePrices,
  type getReadEpisodePurchaseState,
  type ReadFastPayMethod,
  type ReadPayMethod,
} from "../purchaseUtils";
import { fetchEpisodeContent } from "../readerApi";

type PurchaseNotificationArgs = {
  message: string;
  description?: ReactNode;
  icon?: ReactNode;
  placement?: "topRight";
};

type PurchaseNotificationApi = {
  success: (args: PurchaseNotificationArgs) => void;
  error: (args: PurchaseNotificationArgs) => void;
};

type UseReadEpisodePurchaseParams = {
  bookId: string;
  episodeId: string;
  episode: unknown;
  displayTitle: string;
  isLoggedIn: boolean;
  openLoginModal: () => void;
  notification: PurchaseNotificationApi;
  purchaseState: ReturnType<typeof getReadEpisodePurchaseState>;
  rpImageUrl?: string | null;
  hasEpisodePurchaseReward?: boolean;
  log: (
    action: string,
    targetType?: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
    duration?: number,
  ) => Promise<void>;
};

const PURCHASED_EPISODE_REFETCH_ATTEMPTS = 4;
const PURCHASED_EPISODE_REFETCH_DELAY_MS = 450;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getEpisodeCacheId = (episode: any) => String(
  episode?.ep_id
  ?? episode?.epID
  ?? episode?.data?.ep_id
  ?? episode?.data?.epID
  ?? "",
);

const hasReadableEpisodeContent = (episode: any) => {
  const content = typeof episode?.des === "string"
    ? episode.des
    : (typeof episode?.content === "string" ? episode.content : "");
  return content.trim().length > 0;
};

const markEpisodePurchased = (episode: any, targetEpisodeId: string) => {
  if (getEpisodeCacheId(episode) !== targetEpisodeId) return episode;

  return {
    ...episode,
    isBuy: true,
    is_buy: true,
    purchased: true,
  };
};

const markPurchasedEpisodeInListCache = (cacheData: any, targetEpisodeId: string) => {
  if (!cacheData) return cacheData;

  const markGroupList = (group: any) => ({
    ...group,
    list: Array.isArray(group?.list)
      ? group.list.map((episode: any) => markEpisodePurchased(episode, targetEpisodeId))
      : group?.list,
  });

  if (Array.isArray(cacheData?.groups)) {
    return {
      ...cacheData,
      groups: cacheData.groups.map(markGroupList),
    };
  }

  if (Array.isArray(cacheData?.data?.groups)) {
    return {
      ...cacheData,
      data: {
        ...cacheData.data,
        groups: cacheData.data.groups.map(markGroupList),
      },
    };
  }

  return cacheData;
};

const markPurchasedEpisodeInContentCache = (cacheData: any, targetEpisodeId: string) => {
  if (!cacheData || getEpisodeCacheId(cacheData) !== targetEpisodeId) return cacheData;
  if (cacheData?.data && typeof cacheData.data === "object") {
    return {
      ...cacheData,
      data: markEpisodePurchased(cacheData.data, targetEpisodeId),
    };
  }
  return markEpisodePurchased(cacheData, targetEpisodeId);
};

const refreshPurchasedEpisodeContent = async (
  queryClient: QueryClient,
  episodeId: string,
) => {
  const queryKey = queryKeys.read.episodeContent(episodeId);
  let lastRefreshError: unknown = null;

  for (let attempt = 0; attempt < PURCHASED_EPISODE_REFETCH_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await delay(PURCHASED_EPISODE_REFETCH_DELAY_MS * attempt);
    }

    try {
      const freshEpisode = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => fetchEpisodeContent(episodeId),
        staleTime: 0,
      });

      if (hasReadableEpisodeContent(freshEpisode)) {
        queryClient.setQueryData(queryKey, freshEpisode);
        return true;
      }
    } catch (error) {
      lastRefreshError = error;
    }
  }

  if (lastRefreshError) {
    console.warn("[read-purchase] purchased episode content was not ready after retries", lastRefreshError);
  }
  await queryClient.invalidateQueries({ queryKey, exact: true });
  return false;
};

export function useReadEpisodePurchase({
  bookId,
  episodeId,
  episode,
  displayTitle,
  isLoggedIn,
  openLoginModal,
  notification,
  purchaseState,
  rpImageUrl,
  hasEpisodePurchaseReward = false,
  log,
}: UseReadEpisodePurchaseParams) {
  const queryClient = useQueryClient();
  const updateToken = useAuthStore((s: AuthState) => s.updateToken);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMethod, setConfirmMethod] = useState<ReadPayMethod | null>(null);
  const [confirmFastMethod, setConfirmFastMethod] = useState<ReadFastPayMethod>("fast_ticket");
  const [confirmAmount, setConfirmAmount] = useState<number | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [rewardPreview, setRewardPreview] = useState<EpisodePurchaseRewardPreviewResult | null>(null);
  const [rewardPreviewLoading, setRewardPreviewLoading] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);

  const loadRewardPreview = async () => {
    setRewardPreview(null);
    if (!hasEpisodePurchaseReward) return;

    const ep = episode as any;
    const epId = Number(ep?.ep_id ?? ep?.epID ?? episodeId);
    if (!Number.isFinite(epId)) return;

    try {
      setRewardPreviewLoading(true);
      const preview = await fetchEpisodePurchaseRewardPreview(epId);
      setRewardPreview(preview);
    } catch (error) {
      console.warn('[episode-purchase-reward-preview] fallback to normal read buy flow', error);
      setRewardPreview(null);
    } finally {
      setRewardPreviewLoading(false);
    }
  };

  const openConfirm = (method: ReadPayMethod, amount?: number | null) => {
    setConfirmMethod(method);
    setConfirmFastMethod(purchaseState.canFastTicket ? "fast_ticket" : "coin");
    setConfirmAmount(typeof amount === "number" ? amount : null);
    setConfirmOpen(true);
    void loadRewardPreview();
  };

  const handleBuy = async (method: ReadPayMethod, earlyMethod: ReadFastPayMethod = "coin") => {
    if (rewardPreviewLoading) return;

    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    try {
      setBuyLoading(true);
      const ep = episode as any;

      if (purchaseState.isFastLocked) {
        notification.error({
          message: "ตอนนี้ยังไม่เปิดให้ซื้อ",
          description: "ตอนล่วงหน้ายังไม่สามารถซื้อได้ในตอนนี้",
          placement: "topRight",
        });
        return;
      }

      if (purchaseState.isEarlyAccess && method === "freecoin") {
        notification.error({
          message: "ไม่รองรับการซื้อด้วยถุงเงิน",
          description: "ตอนล่วงหน้าไม่รองรับการซื้อด้วยถุงเงิน",
          placement: "topRight",
        });
        return;
      }

      const epId = String(ep?.ep_id ?? ep?.epID ?? episodeId);
      const { coinPrice, freecoinPrice: freeCoinPrice } = getRegularEpisodePrices(ep);
      const priceToDeduct = method === "coin" ? coinPrice : freeCoinPrice;

      const payload = buildReadBuyPayload(epId, method, earlyMethod, purchaseState);
      const res = await apiClient.post("/buy/eps", payload);

      if (res?.data?.code === 200) {
        const respMsg = res.data?.message || "ซื้อสำเร็จ! กำลังอัปเดตเนื้อหา...";

        log("buy_episode", "book", bookId, {
          episode_id: epId,
          method,
          price: priceToDeduct,
          name: ep?.name || displayTitle || "",
        });

        if (res.data?.data?.rp_earned && res.data.data.rp_earned > 0) {
          notification.success({
            message: "ยินดีด้วย!",
            description: (
              <div className="flex items-center gap-1">
                <span>คุณได้รับ {res.data.data.rp_earned}</span>
                {rpImageUrl ? (
                  <Image src={rpImageUrl} alt="RP" width={16} height={16} unoptimized className="object-contain" />
                ) : (
                  <span>RP</span>
                )}
              </div>
            ),
            placement: "topRight",
          });
        }

        notification.success({
          message: respMsg,
          description: respMsg,
          placement: "topRight",
        });

        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          let finalCoin = Number(currentUser.coin) || 0;
          let finalFreeCoin = Number(currentUser.freecoin) || 0;

          if (method === "coin") finalCoin = Math.max(0, finalCoin - (Number(priceToDeduct) || 0));
          else if (method === "freecoin") finalFreeCoin = Math.max(0, finalFreeCoin - (Number(priceToDeduct) || 0));

          const updatedUser = { ...currentUser, coin: finalCoin, freecoin: finalFreeCoin };
          const maybeToken = res?.data?.data?.token ?? res?.data?.token;
          if (maybeToken) {
            await updateToken(maybeToken);
          } else {
            useAuthStore.getState().login(updatedUser, useAuthStore.getState().token || "");
          }
        }

        setConfirmOpen(false);
        setRewardPreview(null);
        queryClient.setQueriesData(
          { queryKey: queryKeys.book.episodesRoot() },
          (cacheData: unknown) => markPurchasedEpisodeInListCache(cacheData, epId),
        );
        queryClient.setQueryData(
          queryKeys.read.episodeContent(epId),
          (cacheData: unknown) => markPurchasedEpisodeInContentCache(cacheData, epId),
        );
        try {
          await queryClient.invalidateQueries({ queryKey: queryKeys.book.episodes(bookId) });
          await refreshPurchasedEpisodeContent(queryClient, epId);
          await requestNavbarRankRefresh(queryClient);
        } catch (refreshError) {
          console.warn("[read-purchase] episode purchased but content refresh is pending", refreshError);
          void queryClient.invalidateQueries({ queryKey: queryKeys.read.episodeContent(epId), exact: true });
          void queryClient.invalidateQueries({ queryKey: queryKeys.book.episodes(bookId) });
        }
      } else {
        notification.error({
          message: "ซื้อไม่สำเร็จ",
          description: res?.data?.message || "ซื้อไม่สำเร็จ",
          placement: "topRight",
        });
      }
    } catch {
      notification.error({
        message: "ซื้อไม่สำเร็จ",
        description: "ยอดเหรียญไม่เพียงพอ",
        placement: "topRight",
      });
    } finally {
      setBuyLoading(false);
    }
  };

  return {
    confirmOpen,
    setConfirmOpen,
    confirmMethod,
    setConfirmMethod,
    confirmFastMethod,
    setConfirmFastMethod,
    confirmAmount,
    setConfirmAmount,
    buyLoading,
    rewardPreview,
    rewardPreviewLoading,
    cancelHover,
    setCancelHover,
    openConfirm,
    handleBuy,
  };
}
