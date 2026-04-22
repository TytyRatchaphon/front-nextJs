"use client";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Modal, App } from "antd";
import Cookies from "js-cookie";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useWebsiteStore } from "@/stores/websiteStore";
import { fetchAllRanksData, claimRankReward, claimAllRankRewards } from "@/services/api/userApi";
import type { AllRanksData, RankItem, RankProfileResponse } from "@/services/api/userApi";
import { useSocket } from "@/providers/SocketProvider";
import { getNavbarRankQueryKey } from "@/utils/rankRefresh";

interface UserRankShowcaseProps {
  className?: string;
  variant?: "default" | "compact";
}

const RANK_IMAGE_FALLBACK = "/images/user.png";
const OPEN_RANK_SHOWCASE_PARAM = "openRankShowcase";

const cleanTokenValue = (value?: string | null) => (value || "").replace(/^['"]+|['"]+$/g, "");
const resolveRankImage = (value?: string | null) => {
  const cleaned = typeof value === "string" ? value.trim().replace(/^['"]+|['"]+$/g, "") : "";
  return cleaned || RANK_IMAGE_FALLBACK;
};
const isTruthyFlag = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "y" || normalized === "yes";
  }
  return false;
};

type RankRewardFailedGrant = {
  grant_id?: number | string | null;
  rank_id?: number | string | null;
  message?: string | null;
};

type ClaimedRankRewardItem = {
  item_type?: string | null;
  item_id?: number | string | null;
  amount?: number | string | null;
  name?: string | null;
  img?: string | null;
};

type RankRewardClaimData = ClaimedRankRewardItem[] | {
  claimed_grants?: unknown[];
  claimed_rewards_summary?: ClaimedRankRewardItem[];
  failed_grants?: RankRewardFailedGrant[];
};

type RankRewardClaimResponse = {
  code?: number | string;
  status?: string | null;
  message?: string | null;
  data?: RankRewardClaimData | null;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const getRankClaimDataRecord = (response?: RankRewardClaimResponse | null) => (
  isObjectRecord(response?.data) ? response.data : null
);

const normalizeClaimedRewardItem = (item: unknown): ClaimedRankRewardItem | null => {
  if (!isObjectRecord(item)) return null;
  const amount = item.amount ?? item.quantity ?? item.qty ?? 1;
  const name = item.name ?? item.reward_name ?? item.item_name ?? item.title;
  const img = item.img ?? item.image ?? item.icon ?? item.reward_img;
  const itemType = item.item_type ?? item.reward_type ?? item.type ?? item.rewardType;

  return {
    item_type: typeof itemType === "string" ? itemType : null,
    item_id: typeof item.item_id === "string" || typeof item.item_id === "number" ? item.item_id : null,
    amount: typeof amount === "string" || typeof amount === "number" ? amount : 1,
    name: typeof name === "string" ? name : null,
    img: typeof img === "string" ? img : null,
  };
};

const getClaimedRewardItems = (response?: RankRewardClaimResponse | null): ClaimedRankRewardItem[] => {
  if (Array.isArray(response?.data)) {
    return response.data.map(normalizeClaimedRewardItem).filter((item): item is ClaimedRankRewardItem => Boolean(item));
  }

  const dataRecord = getRankClaimDataRecord(response);
  if (!dataRecord) return [];

  if (Array.isArray(dataRecord.claimed_rewards_summary)) {
    return dataRecord.claimed_rewards_summary
      .map(normalizeClaimedRewardItem)
      .filter((item): item is ClaimedRankRewardItem => Boolean(item));
  }

  if (Array.isArray(dataRecord.claimed_grants)) {
    return dataRecord.claimed_grants.flatMap((grant) => {
      if (!isObjectRecord(grant)) return [];
      const rewards = Array.isArray(grant.rewards) ? grant.rewards : [grant];
      return rewards.map(normalizeClaimedRewardItem).filter((item): item is ClaimedRankRewardItem => Boolean(item));
    });
  }

  return [];
};

const isRankRewardWarningResponse = (response?: RankRewardClaimResponse | null) => {
  const status = typeof response?.status === "string" ? response.status.toLowerCase() : "";
  const code = Number(response?.code);
  const failedCount = getRankClaimDataRecord(response)?.failed_grants?.length ?? 0;
  return code === 202 || status === "successwarning" || failedCount > 0;
};

const getRankRewardWarningDescription = (response?: RankRewardClaimResponse | null) => {
  const dataRecord = getRankClaimDataRecord(response);
  const failedMessages = Array.from(
    new Set(
      (dataRecord?.failed_grants ?? [])
        .map((item) => item.message?.trim())
        .filter((message): message is string => Boolean(message)),
    ),
  );

  if (failedMessages.length > 0) {
    const visibleMessages = failedMessages.slice(0, 3).join(" / ");
    const hiddenCount = failedMessages.length - 3;
    return hiddenCount > 0
      ? `${visibleMessages} และอีก ${hiddenCount} รายการ`
      : visibleMessages;
  }

  return response?.message || "มีรางวัลบางรายการที่ยังรับไม่ได้ เพราะต้องทำตามเงื่อนไขเพิ่มเติม";
};

const createRankDataFromAllRanks = (
  payload: AllRanksData | null,
  userTotalRp?: number,
): RankProfileResponse["data"] | null => {
  const ranks = payload?.ranks ?? [];
  const currentRank = ranks.find((rank) => rank.is_current_rank) ?? ranks[0];
  if (!currentRank) return null;

  const currentIndex = ranks.findIndex((rank) => rank.rank_id === currentRank.rank_id);
  const nextRank = currentIndex >= 0 ? ranks[currentIndex + 1] : undefined;
  const payloadTotalRp = Number(payload?.total_rp);
  const totalRp = Number.isFinite(payloadTotalRp)
    ? Math.max(0, payloadTotalRp)
    : Number(userTotalRp ?? currentRank.min_rp ?? 0);
  const nextMinRp = nextRank?.min_rp ?? totalRp;
  const payloadRpNeeded = Number(payload?.rp_needed);
  const rpNeeded = Number.isFinite(payloadRpNeeded)
    ? Math.max(0, payloadRpNeeded)
    : Math.max(0, nextMinRp - totalRp);

  return {
    total_rp: totalRp,
    rp_needed: rpNeeded,
    noti_rewards: payload?.noti_rewards ?? false,
    current_rank: {
      rank_id: currentRank.rank_id,
      name: currentRank.name,
      min_rp: currentRank.min_rp,
      max_rp: currentRank.max_rp ?? Math.max(currentRank.min_rp, totalRp),
      rank_img: currentRank.rank_img,
    },
    next_rank: {
      name: nextRank?.name ?? "",
      rank_img: nextRank?.rank_img ?? "",
    },
  };
};

const createSingleRankFallback = (profile: RankProfileResponse["data"] | null): RankItem[] => {
  if (!profile) return [];

  return [
    {
      rank_id: profile.current_rank.rank_id,
      name: profile.current_rank.name,
      min_rp: profile.current_rank.min_rp,
      max_rp: profile.current_rank.max_rp,
      rank_img: profile.current_rank.rank_img,
      is_current_rank: true,
      noti_rewards: false,
      can_claim: false,
      grant_id: null,
      rewards: [],
      reward_note: null,
    },
  ];
};

const createMinimalRankData = (totalRp: number): RankProfileResponse["data"] => {
  const safeTotalRp = Number.isFinite(totalRp) ? Math.max(0, totalRp) : 0;

  return {
    total_rp: safeTotalRp,
    rp_needed: 0,
    noti_rewards: false,
    current_rank: {
      rank_id: 0,
      name: "Member",
      min_rp: 0,
      max_rp: Math.max(1, safeTotalRp),
      rank_img: RANK_IMAGE_FALLBACK,
    },
    next_rank: {
      name: "",
      rank_img: RANK_IMAGE_FALLBACK,
    },
  };
};

export default function UserRankShowcase({
  className = "",
  variant = "default",
}: UserRankShowcaseProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, hasMounted, token: authToken, user } = useAuthStore();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { settings } = useWebsiteStore();
  const { notification: notificationApi } = App.useApp();
  const [rankData, setRankData] = useState<RankProfileResponse["data"] | null>(null);
  const [allRanks, setAllRanks] = useState<RankItem[]>([]);
  const [isRankLoading, setIsRankLoading] = useState(true);
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [claimingId, setClaimingId] = useState<number | string | null>(null);
  const [isClaimingAllRewards, setIsClaimingAllRewards] = useState(false);
  const [claimAllResult, setClaimAllResult] = useState<RankRewardClaimResponse | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const navbarRankQueryKey = useMemo(() => getNavbarRankQueryKey(user?.user_id), [user?.user_id]);
  const userRp = Number(user?.total_rp ?? user?.current_rp ?? 0);
  const fallbackRankData = useMemo(() => createMinimalRankData(userRp), [userRp]);
  const effectiveRankData = rankData ?? fallbackRankData;
  const claimedRewardItems = useMemo(() => getClaimedRewardItems(claimAllResult), [claimAllResult]);
  const claimedRewardTotal = useMemo(() => (
    claimedRewardItems.reduce((total, item) => {
      const amount = Number(item.amount ?? 1);
      return total + (Number.isFinite(amount) ? Math.max(0, amount) : 1);
    }, 0)
  ), [claimedRewardItems]);

  const displayRanks = useMemo(() => (
    allRanks.length > 0 ? allRanks : createSingleRankFallback(effectiveRankData)
  ), [allRanks, effectiveRankData]);

  const currentRankIndex = useMemo(() => {
    if (!Array.isArray(displayRanks)) return 0;
    const idx = displayRanks.findIndex((rank) => rank.is_current_rank);
    return idx >= 0 ? idx : 0;
  }, [displayRanks]);

  const isTopRank = useMemo(() => {
    const currentRank = displayRanks[currentRankIndex];
    if (currentRank?.is_current_rank && currentRank.max_rp === null) return true;
    if (effectiveRankData.rp_needed === 0) return true;
    if (!effectiveRankData.next_rank?.name?.trim()) return true;
    return false;
  }, [displayRanks, currentRankIndex, effectiveRankData]);

  const activeRank = useMemo(() => {
    if (!Array.isArray(displayRanks) || displayRanks.length === 0) return null;
    return displayRanks[activeSlideIndex] ?? displayRanks[currentRankIndex] ?? null;
  }, [activeSlideIndex, currentRankIndex, displayRanks]);

  const activeRankRewards = activeRank?.rewards ?? [];
  const activeRewardNote = activeRank?.reward_note?.trim() ?? "";
  const activeRankCanClaim = isTruthyFlag(activeRank?.can_claim);
  const activeRankGrantId = activeRank?.grant_id ?? null;
  const activeRewardClaimId = activeRankRewards.find((reward) => reward.grant_id)?.grant_id ?? null;
  const activeClaimGrantId = activeRankGrantId ?? activeRewardClaimId;
  const canClaimActiveRank = (
    activeClaimGrantId !== null
    && activeClaimGrantId !== undefined
    && (activeRankCanClaim || activeRankRewards.some((reward) => isTruthyFlag(reward.can_claim)))
  );

  const hasNotiRewards = isTruthyFlag(effectiveRankData?.noti_rewards)
    || displayRanks.some((rank) => isTruthyFlag(rank.noti_rewards));
  const hasClaimableRewards = hasNotiRewards
    || displayRanks.some((rank) => (
      isTruthyFlag(rank.can_claim)
      || rank.rewards?.some((reward) => isTruthyFlag(reward.can_claim))
    ));

  const getCleanToken = useCallback(() => {
    return cleanTokenValue(Cookies.get("token") || authToken);
  }, [authToken]);

  const showRewardSuccess = useCallback((title: string) => {
    notificationApi.success({
      key: "rank-reward-result",
      message: title,
      description: "รางวัลถูกเพิ่มเข้าบัญชีของคุณแล้ว",
      placement: "top",
      duration: 2.6,
      className: "rank-reward-notification",
    });
  }, [notificationApi]);

  const showRewardError = useCallback((message?: string) => {
    notificationApi.error({
      key: "rank-reward-result",
      message: message || "ไม่สามารถรับรางวัลได้",
      description: "กรุณาลองใหม่อีกครั้ง",
      placement: "top",
      duration: 3,
      className: "rank-reward-notification",
    });
  }, [notificationApi]);

  const showRewardWarning = useCallback((description?: string) => {
    notificationApi.warning({
      key: "rank-reward-result",
      message: "รับรางวัลได้บางส่วน",
      description: description || "มีรางวัลบางรายการที่ยังรับไม่ได้ เพราะต้องทำตามเงื่อนไขเพิ่มเติม",
      placement: "top",
      duration: 5,
      className: "rank-reward-notification",
    });
  }, [notificationApi]);

  const messageApi = useMemo(() => ({
    success: showRewardSuccess,
    error: showRewardError,
    warning: showRewardWarning,
  }), [showRewardError, showRewardSuccess, showRewardWarning]);

  const reloadRankData = useCallback(async () => {
    const token = getCleanToken();
    if (!token) return false;
    try {
      const allRanksData = await fetchAllRanksData(token);
      if (!allRanksData || !Array.isArray(allRanksData.ranks)) {
        throw new Error("Invalid rank payload");
      }
      const rankList = Array.isArray(allRanksData?.ranks) ? allRanksData.ranks : [];
      const fallbackRp = Number(user?.total_rp ?? user?.current_rp);
      const parsedRankData = createRankDataFromAllRanks(
        allRanksData,
        Number.isFinite(fallbackRp) ? fallbackRp : undefined,
      );
      setAllRanks(rankList);
      setRankData(parsedRankData);
      queryClient.setQueryData(navbarRankQueryKey, allRanksData);
      return true;
    } catch (error) {
      console.error("reloadRankData error:", error);
      return false;
    }
  }, [getCleanToken, navbarRankQueryKey, queryClient, user?.total_rp, user?.current_rp]);

  const handleClaimReward = useCallback(async (grantId: number | string) => {
    const token = getCleanToken();
    if (!token) return false;
    setClaimingId(grantId);
    try {
      const result = await claimRankReward(grantId, token) as RankRewardClaimResponse;
      await reloadRankData();
      if (isRankRewardWarningResponse(result)) {
        messageApi.warning(getRankRewardWarningDescription(result));
        return false;
      }
      messageApi.success("รับรางวัลสำเร็จ!");
      return true;
    } catch {
      messageApi.error("ไม่สามารถรับรางวัลได้ กรุณาลองใหม่");
      return false;
    } finally {
      setClaimingId(null);
    }
  }, [getCleanToken, messageApi, reloadRankData]);

  const handleClaimActiveRank = useCallback(async () => {
    if (activeClaimGrantId === null || activeClaimGrantId === undefined) return;
    await handleClaimReward(activeClaimGrantId);
  }, [activeClaimGrantId, handleClaimReward]);

  const handleClaimAllRankRewards = useCallback(async () => {
    const token = getCleanToken();
    if (!token || isClaimingAllRewards) return;
    setIsClaimingAllRewards(true);
    try {
      const result = await claimAllRankRewards(token) as RankRewardClaimResponse;
      const claimedItems = getClaimedRewardItems(result);
      await reloadRankData();
      if (claimedItems.length > 0) {
        setClaimAllResult(result);
      }
      if (isRankRewardWarningResponse(result)) {
        messageApi.warning(getRankRewardWarningDescription(result));
        return;
      }
      messageApi.success("รับรางวัลทั้งหมดสำเร็จ!");
    } catch {
      messageApi.error("ไม่สามารถรับรางวัลทั้งหมดได้ กรุณาลองใหม่");
    } finally {
      setIsClaimingAllRewards(false);
    }
  }, [getCleanToken, isClaimingAllRewards, messageApi, reloadRankData]);

  const formatRewardTypeLabel = (value?: string | null) => {
    const label = typeof value === "string" ? value.replace(/[_-]+/g, " ").trim() : "";
    if (!label) return "Reward";
    return label.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleRankImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    if (!target.src.includes(RANK_IMAGE_FALLBACK)) {
      target.src = RANK_IMAGE_FALLBACK;
    }
  };

  const scrollToCard = useCallback((index: number) => {
    const card = cardRefs.current.get(index);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, []);

  const handleSelectRank = useCallback((index: number) => {
    setActiveSlideIndex(index);
    scrollToCard(index);
  }, [scrollToCard]);

  const handlePrev = useCallback(() => {
    const newIndex = Math.max(0, activeSlideIndex - 1);
    handleSelectRank(newIndex);
  }, [activeSlideIndex, handleSelectRank]);

  const handleNext = useCallback(() => {
    const newIndex = Math.min(displayRanks.length - 1, activeSlideIndex + 1);
    handleSelectRank(newIndex);
  }, [activeSlideIndex, displayRanks.length, handleSelectRank]);

  // Listen to rank_profile_refresh from backend via socket
  useEffect(() => {
    if (!socket || !isLoggedIn) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const handleRankRefresh = (payload?: { action?: string; timestamp?: number }) => {
      // Debounce short frequency events
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        console.log('[socket] received rank_profile_refresh -> reloadRankData', {
          payload,
          socketId: socket.id,
          at: new Date().toISOString(),
        });
        reloadRankData();
      }, 500);
    };

    socket.on('rank_profile_refresh', handleRankRefresh);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      socket.off('rank_profile_refresh', handleRankRefresh);
    };
  }, [socket, isLoggedIn, reloadRankData]);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Reset when logged out so we re-fetch on next login
    if (!isLoggedIn) {
      hasFetchedRef.current = false;
      setRankData(null);
      setAllRanks([]);
      setIsRankLoading(false);
      return;
    }

    if (!hasMounted) return;

    // Prevent duplicate fetches from dependency changes during hydration
    if (hasFetchedRef.current) return;

    let cancelled = false;

    const loadRankData = async () => {
      const token = cleanTokenValue(Cookies.get("token") || authToken);
      if (!token) {
        setRankData(null);
        setAllRanks([]);
        queryClient.setQueryData(navbarRankQueryKey, null);
        setIsRankLoading(false);
        return;
      }

      try {
        hasFetchedRef.current = true;
        setIsRankLoading(true);
        const allRanksData = await fetchAllRanksData(token);
        if (!allRanksData || !Array.isArray(allRanksData.ranks)) {
          throw new Error("Invalid rank payload");
        }

        if (cancelled) return;

        const rankList = allRanksData.ranks;
        const fallbackRp = Number(user?.total_rp ?? user?.current_rp);
        const parsedRankData = createRankDataFromAllRanks(
          allRanksData,
          Number.isFinite(fallbackRp) ? fallbackRp : undefined,
        );
        setAllRanks(rankList);
        setRankData(parsedRankData);
        queryClient.setQueryData(navbarRankQueryKey, allRanksData);
      } catch (error) {
        console.error("fetchAllRanksData error:", error);
        hasFetchedRef.current = false; // Allow retry on error
      } finally {
        if (!cancelled) {
          setIsRankLoading(false);
        }
      }
    };

    loadRankData();

    return () => {
      cancelled = true;
      hasFetchedRef.current = false; // Reset for React Strict Mode remount
    };
  }, [authToken, hasMounted, isLoggedIn, navbarRankQueryKey, queryClient, user?.current_rp, user?.total_rp]);

  useEffect(() => {
    if (showRanksModal) {
      setActiveSlideIndex(currentRankIndex);
      // Scroll to current rank card after modal opens
      requestAnimationFrame(() => {
        setTimeout(() => scrollToCard(currentRankIndex), 150);
      });
    }
  }, [currentRankIndex, showRanksModal, scrollToCard]);

  useEffect(() => {
    if (!hasMounted || !isLoggedIn || pathname !== "/mprofile") return;

    const shouldOpenRankModal = (() => {
      const value = searchParams.get(OPEN_RANK_SHOWCASE_PARAM);
      if (!value) return false;
      const normalized = value.trim().toLowerCase();
      return normalized === "1" || normalized === "true" || normalized === "yes";
    })();

    if (!shouldOpenRankModal) return;

    setShowRanksModal(true);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(OPEN_RANK_SHOWCASE_PARAM);
    nextParams.delete("rankRefreshTs");
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [hasMounted, isLoggedIn, pathname, router, searchParams]);

  if (!hasMounted || !isLoggedIn) {
    return null;
  }

  const isCompact = variant === "compact";

  if (isRankLoading && !rankData) {
    return (
      <div
        className={`overflow-hidden rounded-[28px] border border-stone-200 bg-stone-100/80 p-5 shadow-sm ${isCompact ? "min-h-[160px] p-4" : "min-h-[236px]"} ${className}`}
      >
        <div className={`animate-pulse ${isCompact ? "space-y-3" : "space-y-4"}`}>
          <div className="h-4 w-24 rounded-full bg-stone-200" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`${isCompact ? "h-11 w-11" : "h-14 w-14"} rounded-full bg-stone-200`} />
              <div className="space-y-2">
                <div className={`rounded bg-stone-200 ${isCompact ? "h-3.5 w-20" : "h-4 w-24"}`} />
                <div className={`rounded bg-stone-200 ${isCompact ? "h-3 w-24" : "h-3 w-32"}`} />
              </div>
            </div>
            <div className={`${isCompact ? "h-8 w-16" : "h-9 w-20"} rounded-xl bg-stone-200`} />
          </div>
          <div className="h-2.5 w-full rounded-full bg-stone-200" />
          <div className={`${isCompact ? "h-3.5 w-4/5" : "h-4 w-2/3"} rounded bg-stone-200`} />
        </div>
      </div>
    );
  }

  const progressWidth =
    effectiveRankData.current_rank.max_rp > 0
      ? Math.min(100, Math.max(0, (effectiveRankData.total_rp / effectiveRankData.current_rank.max_rp) * 100))
      : isTopRank
        ? 100
        : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowRanksModal(true)}
        title="ดูแรงก์ทั้งหมด"
        className={`relative w-full overflow-hidden rounded-[24px] border border-stone-200 bg-gradient-to-br from-[#eceef2] via-[#f8f8fa] to-[#dcdee5] text-left shadow-sm transition hover:shadow-md sm:rounded-[28px] ${isCompact ? "min-h-[148px] p-3.5 md:p-4" : "p-4 sm:p-5"} ${className}`}
      >
        {/* noti_rewards notification dot */}
        {hasNotiRewards && (
          <span className="absolute right-3 top-3 z-20 flex h-3 w-3 sm:right-4 sm:top-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`absolute opacity-15 ${
              isCompact
                ? "-bottom-5 -right-5 h-20 w-20 md:h-24 md:w-24"
                : "-bottom-10 -right-10 h-48 w-48"
            }`}
          >
            <Image
              src={resolveRankImage(effectiveRankData.current_rank.rank_img)}
              alt=""
              fill
              className="object-contain object-right-bottom"
              unoptimized
              onError={handleRankImageError}
            />
          </div>
        </div>

        <div className="relative z-10">
          <div className={`flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center ${isCompact ? "mb-2.5" : "mb-4"}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/70 p-2 shadow-sm ${isCompact ? "h-10 w-10" : "h-16 w-16"}`}
              >
                <Image
                  src={resolveRankImage(effectiveRankData.current_rank.rank_img)}
                  alt={effectiveRankData.current_rank.name}
                  width={isCompact ? 26 : 48}
                  height={isCompact ? 26 : 48}
                  className="object-contain"
                  unoptimized
                  onError={handleRankImageError}
                />
              </div>
              <div className="min-w-0">
                <p className={`font-semibold uppercase text-stone-500 ${isCompact ? "text-[10px] tracking-[0.18em]" : "text-[11px] tracking-[0.24em]"}`}>
                  Current Rank
                </p>
                <p className={`truncate font-bold text-stone-950 ${isCompact ? "text-sm leading-tight" : "text-lg"}`}>
                  {effectiveRankData.current_rank.name}
                </p>
              </div>
            </div>

            <div className={`flex max-w-full items-center gap-1.5 self-start rounded-xl border border-red-200/60 bg-red-100/60 sm:self-auto ${isCompact ? "px-2 py-1" : "px-3 py-1.5"}`}>
              {settings?.exp && (
                <Image
                  src={settings.exp}
                  alt="RP"
                  width={isCompact ? 14 : 18}
                  height={isCompact ? 14 : 18}
                  className="object-contain"
                  unoptimized
                />
              )}
              <span className={`font-bold text-red-600 ${isCompact ? "text-sm" : "text-lg"}`}>
                {effectiveRankData.total_rp.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-[#fa807280] shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${isTopRank ? "bg-emerald-500" : "bg-[#ff0000]"}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>

          <p className={`font-medium text-stone-700 ${isCompact ? "mt-1.5 text-[11px] leading-[1.45]" : "mt-3 text-sm"}`}>
            {isTopRank ? (
              <span className="font-semibold text-emerald-700">อยู่ในระดับสูงสุดแล้ว</span>
            ) : (
              <>
                ต้องการอีก <span className="font-bold text-red-600">{effectiveRankData.rp_needed.toLocaleString()}</span>{" "}
                แต้ม เพื่ออัปแรงก์เป็น <span className="font-bold text-amber-600">{effectiveRankData.next_rank.name}</span>
              </>
            )}
          </p>
        </div>
      </button>

      <Modal
        open={showRanksModal}
        onCancel={() => setShowRanksModal(false)}
        footer={null}
        title={null}
        closable
        centered
        width="min(760px, calc(100vw - 24px))"
        zIndex={10050}
        className="ranks-modal"
        styles={{ body: { padding: 0 } }}
      >
        <div className="max-h-[calc(100dvh-96px)] overflow-y-auto px-3 py-4 sm:px-5 sm:py-6">
          <h2 className="mb-1 text-center text-lg font-bold text-gray-900 sm:text-xl">แรงก์ทั้งหมด</h2>
          <p className="mb-4 text-center text-xs text-gray-500 sm:mb-5 sm:text-sm">สะสมแต้มเพื่ออัปแรงก์ของคุณ</p>

          {showRanksModal && displayRanks.length > 0 && (
            <>
              {/* Rank Cards Carousel with Arrow Buttons */}
              <div className="relative mb-4">
                {/* Left Arrow */}
                {activeSlideIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute -left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-all hover:bg-gray-50 hover:shadow-lg active:scale-90 sm:-left-2 sm:h-9 sm:w-9"
                    aria-label="Previous rank"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}

                {/* Right Arrow */}
                {activeSlideIndex < displayRanks.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute -right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-all hover:bg-gray-50 hover:shadow-lg active:scale-90 sm:-right-2 sm:h-9 sm:w-9"
                    aria-label="Next rank"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}

                {/* Cards Container */}
                <div
                  ref={scrollContainerRef}
                  className="flex gap-3 overflow-hidden px-6 py-1 sm:px-8"
                >
                  {displayRanks.map((rank, index) => {
                    const isCurrentTopRank = rank.is_current_rank && isTopRank;
                    const isActive = activeSlideIndex === index;

                    return (
                      <button
                        key={rank.rank_id}
                        ref={(el) => {
                          if (el) cardRefs.current.set(index, el);
                          else cardRefs.current.delete(index);
                        }}
                        type="button"
                        onClick={() => handleSelectRank(index)}
                        style={{ minWidth: "160px", maxWidth: "196px", flexShrink: 0, scrollSnapAlign: "center" }}
                        className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all duration-300 sm:gap-2.5 sm:p-4 ${
                          rank.is_current_rank
                            ? "border-red-400 bg-gradient-to-br from-red-50 to-red-100 shadow-xl shadow-red-100"
                            : isActive
                              ? "border-red-200 bg-red-50/50 shadow-md"
                              : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full sm:h-16 sm:w-16 ${
                            rank.is_current_rank
                              ? isCurrentTopRank
                                ? "bg-emerald-50 ring-2 ring-emerald-300"
                                : "bg-red-50 ring-2 ring-red-300"
                              : "bg-gray-50"
                          }`}
                        >
                          <img
                            src={resolveRankImage(rank.rank_img)}
                            alt={rank.name}
                            className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                            onError={handleRankImageError}
                          />
                          {/* noti dot per rank card */}
                          {rank.noti_rewards && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-white" />
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-sm font-bold leading-tight ${
                            rank.is_current_rank
                              ? isCurrentTopRank
                                ? "text-emerald-600"
                                : "text-red-600"
                              : "text-gray-700"
                          }`}
                        >
                          {rank.name}
                        </p>

                        <p className="text-xs text-gray-400">
                          {rank.max_rp !== null
                            ? `${rank.min_rp.toLocaleString()} - ${rank.max_rp.toLocaleString()} RP`
                            : `${rank.min_rp.toLocaleString()}+ RP`}
                        </p>

                        <div className="mt-auto flex min-h-[22px] items-center justify-center">
                          {rank.rewards && rank.rewards.length > 0 ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                              ของรางวัล {rank.rewards.length} รายการ
                            </span>
                          ) : (
                            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-medium text-stone-500">
                              ไม่มีของรางวัล
                            </span>
                          )}
                        </div>

                        {rank.is_current_rank && (
                          <span
                            className={`rounded-full px-3.5 py-1 text-[11px] font-semibold text-white ${
                              isCurrentTopRank ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          >
                            {isCurrentTopRank ? "อยู่ในระดับสูงสุดแล้ว" : "แรงค์ปัจจุบัน"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Dots indicator */}
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  {displayRanks.map((rank, index) => (
                    <button
                      key={rank.rank_id}
                      type="button"
                      onClick={() => handleSelectRank(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeSlideIndex === index
                          ? "w-5 bg-red-500"
                          : rank.is_current_rank
                            ? "w-2.5 bg-red-300"
                            : "w-1.5 bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to ${rank.name}`}
                    />
                  ))}
                </div>
                {hasClaimableRewards && (
                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={handleClaimAllRankRewards}
                      disabled={isClaimingAllRewards}
                      className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-red-500 px-4 py-1.5 text-[11px] font-semibold !text-white shadow-sm transition-all hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isClaimingAllRewards ? (
                        <>
                          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          กำลังรับ...
                        </>
                      ) : (
                        "รับรางวัลทั้งหมด"
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Reward Details */}
              <div className="relative overflow-hidden rounded-[18px] border border-red-100 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(255,245,245,0.92)_52%,_rgba(255,236,236,0.9)_100%)] px-2.5 py-2.5 shadow-[0_24px_48px_-36px_rgba(239,68,68,0.35)] sm:rounded-[20px]">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute -left-8 top-0 h-24 w-24 rounded-full bg-red-200/25 blur-2xl" />
                  <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-amber-200/20 blur-2xl" />
                </div>

                <div className="relative z-10">
                  <div className="mb-2.5 flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/90 shadow-[0_12px_20px_-18px_rgba(239,68,68,0.8)] sm:h-9 sm:w-9">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4 text-red-500"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M22 7h-5.2a2.8 2.8 0 1 0-4.8-2A2.8 2.8 0 1 0 7.2 7H2v5h20V7Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v15" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold leading-tight text-stone-900 sm:text-sm">
                          {activeRank ? `ของรางวัลแรงก์ ${activeRank.name}` : "ของรางวัลของแรงก์"}
                        </h3>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                          {activeRankRewards.length > 0
                            ? "เลื่อนดูของรางวัลที่จะได้รับเมื่อถึงแรงก์นี้"
                            : "ยังไม่มีของรางวัลสำหรับแรงก์นี้ในตอนนี้"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                      {activeRank && (
                        <div className="shrink-0 rounded-full border border-white/90 bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-stone-600 shadow-sm">
                          {activeRank.max_rp !== null
                            ? `${activeRank.min_rp.toLocaleString()} - ${activeRank.max_rp.toLocaleString()} RP`
                            : `${activeRank.min_rp.toLocaleString()}+ RP`}
                        </div>
                      )}
                      <div className="shrink-0 rounded-full border border-red-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-red-500">
                        {activeRankRewards.length > 0
                          ? `${activeRankRewards.length} รางวัล`
                          : "ยังไม่มีรางวัล"}
                      </div>
                    </div>
                  </div>

                  {activeRewardNote && (
                    <div className="mb-2.5 rounded-[14px] border border-amber-200/80 bg-amber-50/80 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-900">
                      {activeRewardNote}
                    </div>
                  )}

                  {activeRankRewards.length > 0 ? (
                    <Swiper
                      key={`rewards-${activeRank?.rank_id ?? 'default'}`}
                      modules={[FreeMode]}
                       freeMode={{ enabled: true, sticky: false, momentumRatio: 0.5 }}
                       slidesPerView="auto"
                       spaceBetween={10}
                       className="-mx-1 px-1 pb-1"
                     >
                    {activeRankRewards.map((reward, index) => (
                      <SwiperSlide
                        key={reward.id ?? `${activeRank?.rank_id ?? 'rank'}-reward-${index}`}
                        style={{ width: "auto" }}
                      >
                        <div
                          className="flex h-[178px] w-[140px] flex-col rounded-[18px] border border-white/90 bg-white/95 p-2.5 shadow-[0_18px_30px_-26px_rgba(220,38,38,0.5)] transition-transform duration-200 hover:-translate-y-0.5 sm:h-[192px] sm:w-[160px]"
                        >
                          <div className="relative mb-2 flex h-[68px] items-center justify-center overflow-hidden rounded-[14px] border border-red-100/80 bg-[linear-gradient(180deg,_rgba(254,242,242,0.96),_rgba(255,255,255,0.98))] ring-1 ring-red-100 sm:h-[76px]">
                            {reward.img ? (
                              <Image
                                src={reward.img}
                                alt={reward.name || 'Reward'}
                                fill
                                className="object-contain p-2"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-dashed border-red-200 bg-white text-red-400">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 7h-5.2a2.8 2.8 0 1 0-4.8-2A2.8 2.8 0 1 0 7.2 7H2v5h20V7Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v15" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="mb-1.5 flex items-center justify-between gap-1.5">
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-red-500">
                              {formatRewardTypeLabel(reward.type)}
                            </span>
                            <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[9px] font-semibold text-stone-600">
                              {reward.amount && reward.amount > 1 ? `x${reward.amount}` : "x1"}
                            </span>
                          </div>

                          <p className="line-clamp-2 min-h-[32px] text-xs font-semibold leading-snug text-stone-800 sm:min-h-[34px]">
                            {reward.name || 'ของรางวัล'}
                          </p>

                          {reward.description ? (
                            <p className="mt-0.5 line-clamp-2 min-h-[28px] text-[10px] leading-relaxed text-stone-500">
                              {reward.description}
                            </p>
                          ) : (
                            <div className="mt-0.5 h-7" />
                          )}

                          {/* Claim button per reward */}
                          {false && (
                            <button
                              type="button"
                              disabled={claimingId === (reward.grant_id ?? activeRankGrantId)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClaimReward((reward.grant_id ?? activeRankGrantId)!);
                              }}
                              className="mt-1.5 w-full rounded-lg bg-emerald-500 py-1.5 text-[10px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {claimingId === (reward.grant_id ?? activeRankGrantId) ? (
                                <span className="flex items-center justify-center gap-1">
                                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                  กำลังรับ...
                                </span>
                              ) : "รับรางวัล"}
                            </button>
                          )}
                        </div>
                      </SwiperSlide>
                    ))}
                    </Swiper>
                  ) : (
                    <div className="flex min-h-[80px] items-center justify-center rounded-[16px] border border-dashed border-red-100 bg-white/45 text-xs font-medium text-stone-400">
                      ยังไม่มีของรางวัลเพิ่มเติมในตอนนี้
                    </div>
                  )}

                  {canClaimActiveRank && (
                    <div className="mt-1.5 flex justify-center">
                      <button
                        type="button"
                        disabled={claimingId === activeClaimGrantId}
                        onClick={handleClaimActiveRank}
                        className="rounded-full bg-red-500 px-3.5 py-1.5 text-[11px] font-semibold !text-white shadow-sm transition-all hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {claimingId === activeClaimGrantId ? (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            กำลังรับรางวัล...
                          </span>
                        ) : "รับรางวัล"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Back to current rank button */}
              <div className={activeSlideIndex === currentRankIndex ? "hidden" : "mt-3 flex justify-center"}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSlideIndex(currentRankIndex);
                    scrollToCard(currentRankIndex);
                  }}
                  className="inline-flex max-w-full items-center justify-center gap-1.5 rounded-full bg-red-500 px-3 py-2 text-center text-xs font-semibold !text-white shadow-md transition-all duration-200 hover:bg-red-600 hover:shadow-lg active:scale-95 sm:px-4 sm:text-sm"
                >
                  {activeSlideIndex > currentRankIndex && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  )}
                  กลับไปแรงก์ของฉัน
                  {activeSlideIndex < currentRankIndex && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={claimedRewardItems.length > 0}
        onCancel={() => setClaimAllResult(null)}
        footer={null}
        title={null}
        closable
        centered
        width="min(520px, calc(100vw - 24px))"
        zIndex={10070}
        className="rank-claim-result-modal"
        styles={{ body: { padding: 0 } }}
      >
        <div className="relative overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_top_left,_rgba(254,226,226,0.95),_rgba(255,255,255,0.98)_42%,_rgba(255,247,237,0.92)_100%)]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-red-200/40 blur-3xl" />
            <div className="absolute -bottom-12 right-2 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl" />
          </div>

          <div className="relative z-10 px-4 pb-4 pt-5 sm:px-5 sm:pb-5">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-red-500 shadow-[0_18px_36px_-24px_rgba(220,38,38,0.8)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 7h-5.2a2.8 2.8 0 1 0-4.8-2A2.8 2.8 0 1 0 7.2 7H2v5h20V7Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v15" />
              </svg>
            </div>

            <h3 className="text-center text-lg font-bold text-stone-950 sm:text-xl">
              รับรางวัลสำเร็จ
            </h3>
            <p className="mx-auto mt-1 max-w-[360px] text-center text-xs leading-relaxed text-stone-500 sm:text-sm">
              รางวัลทั้งหมดถูกเพิ่มเข้าบัญชีแล้ว รวม {claimedRewardItems.length.toLocaleString()} รายการ / {claimedRewardTotal.toLocaleString()} ชิ้น
            </p>

            <div className="mt-4 max-h-[48vh] space-y-2 overflow-y-auto pr-1">
              {claimedRewardItems.map((item, index) => {
                const amount = Number(item.amount ?? 1);
                const displayAmount = Number.isFinite(amount) ? Math.max(0, amount) : 1;

                return (
                  <div
                    key={`${item.item_type ?? "reward"}-${item.item_id ?? index}-${index}`}
                    className="group flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-2.5 shadow-[0_16px_30px_-26px_rgba(120,53,15,0.8)] transition-colors duration-200 hover:border-red-100 hover:bg-white"
                  >
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-red-100 bg-red-50/60">
                      {item.img ? (
                        <Image
                          src={item.img}
                          alt={item.name || "Reward"}
                          fill
                          className="object-contain p-2"
                          unoptimized
                        />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-7 w-7 text-red-400"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M22 7h-5.2a2.8 2.8 0 1 0-4.8-2A2.8 2.8 0 1 0 7.2 7H2v5h20V7Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v15" />
                        </svg>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-red-500">
                          {formatRewardTypeLabel(item.item_type)}
                        </span>
                        <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[9px] font-semibold text-stone-600">
                          x{displayAmount.toLocaleString()}
                        </span>
                      </div>
                      <p className="truncate text-sm font-bold text-stone-900">
                        {item.name || "ของรางวัล"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setClaimAllResult(null)}
              className="mt-4 w-full rounded-full bg-red-500 px-4 py-2.5 text-sm font-semibold !text-white shadow-sm transition-colors duration-200 hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 active:scale-[0.99]"
            >
              เรียบร้อย
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
