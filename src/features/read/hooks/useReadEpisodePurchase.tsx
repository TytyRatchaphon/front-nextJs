import { useState, type ReactNode } from "react";
import Image from "next/image";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
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
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
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
            updateToken(maybeToken);
          } else {
            useAuthStore.getState().login(updatedUser, useAuthStore.getState().token || "");
          }
        }

        setConfirmOpen(false);
        setRewardPreview(null);
        await queryClient.invalidateQueries({ queryKey: ["episodeContent", episodeId] });
        await queryClient.invalidateQueries({ queryKey: ["bookEpisodes", bookId] });
        await requestNavbarRankRefresh(queryClient);
      } else {
        notification.error({
          message: "ซื้อไม่สำเร็จ",
          description: res?.data?.message || "ซื้อไม่สำเร็จ",
          icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
          placement: "topRight",
        });
      }
    } catch {
      notification.error({
        message: "ซื้อไม่สำเร็จ",
        description: "ยอดเหรียญไม่เพียงพอ",
        icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
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
