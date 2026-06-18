"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Modal, Tabs } from "antd";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Coins,
  Crown,
  Gift,
  Lock,
  Sparkles,
  Swords,
  Ticket,
  Trophy,
  X,
} from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

import GifLoader from "@/components/utility/GifLoader";
import { queryKeys, QUERY_CONFIG } from "@/constants/query";
import {
  buyRoyalePassPremiumWithCoin,
  claimRoyalePassReward,
  fetchRoyalePassDetail,
  type RoyalePassQuest,
  type RoyalePassReward,
  type RoyalePassTrack,
} from "@/services/api/royalePassApi";
import { useAuthStore } from "@/stores/authStore";
import { refreshToken } from "@/services/apiServices";
import { buildCoinEnjoyTopupUrl, navigateSafely, openSafeExternalInNewTab } from "@/utils/navigationUtils";

import { useRoyalePassSocket } from "./hooks/useRoyalePassSocket";
import {
  buildRewardLevels,
  // formatCountdownToStart,
  formatPassDateRange,
  getClaimStateLabel,
  getPassBannerSrc,
  getRewardImageSrc,
  getTrackLabel,
  getUserExp,
  getUserLevel,
  groupQuestsByScope,
} from "./utils/royalePassUtils";

type RoyalePassDetailPageProps = {
  passId: string;
};

const questScopeLabels = {
  daily: "รายวัน",
  weekly: "รายสัปดาห์",
  season: "ตลอดซีซั่น",
} as const;

const rewardTypeFallbackLabel: Record<string, string> = {
  coin: "เหรียญ",
  freecoin: "ถุงเงิน",
  user_coupon: "คูปอง",
  frame: "กรอบโปรไฟล์",
  gift: "ของขวัญ",
};

const getRewardText = (reward: RoyalePassReward) => {
  if (reward.reward_display_text) return reward.reward_display_text;
  const typeLabel = rewardTypeFallbackLabel[reward.reward_type] || reward.reward_type;
  const amount = reward.reward_amount ?? reward.amount;
  return amount ? `${typeLabel} ${Number(amount).toLocaleString("th-TH")}` : typeLabel;
};

function RewardIcon({ reward }: { reward: RoyalePassReward }) {
  const imageSrc = getRewardImageSrc(reward);
  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt={getRewardText(reward)}
        width={44}
        height={44}
        className="h-11 w-11 object-contain"
      />
    );
  }

  if (reward.reward_type === "coin") return <Coins size={28} className="text-amber-500" />;
  if (reward.reward_type === "freecoin") return <Gift size={28} className="text-red-500" />;
  return <Gift size={28} className="text-slate-500" />;
}

function RewardStack({
  claimDisabled,
  level,
  onSelect,
  rewards,
  track,
  currentLevel,
  isPremium,
  isMaxLevel,
  containerClassName,
}: {
  claimDisabled: boolean;
  level: number;
  onSelect: (level: number, track: RoyalePassTrack, rewards: RoyalePassReward[]) => void;
  rewards: RoyalePassReward[];
  track: RoyalePassTrack;
  currentLevel: number;
  isPremium: boolean;
  isMaxLevel?: boolean;
  containerClassName?: string;
}) {
  if (!rewards.length) {
    return <div className={`shrink-0 ${containerClassName || "h-[116px] w-[80px]"}`} />;
  }

  const claimable = rewards.some((reward) => reward.is_claimable && !reward.is_claimed);
  const canClaim = claimable && !claimDisabled;
  const claimed = rewards.every((reward) => reward.is_claimed);
  const isExplicitlyUnlocked = rewards.some((reward) => reward.is_unlocked);

  const isLevelLocked = currentLevel < level;
  const isPremiumLocked = track === "premium" && !isPremium;
  const isRewardLocked = !claimed && !isExplicitlyUnlocked && (isLevelLocked || isPremiumLocked);
  
  const isMega = level % 5 === 0;

  return (
    <div className={`flex flex-col items-center shrink-0 min-w-0 ${containerClassName || "w-[80px] h-[116px]"}`}>
      <button
        type="button"
        onClick={() => onSelect(level, track, rewards)}
        className={`relative flex h-[80px] w-[80px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 ease-out ${
          isMega 
            ? "border-yellow-400 bg-red-50" 
            : claimed
              ? "border-transparent bg-slate-50 opacity-60 grayscale-[30%]"
              : track === "premium" ? "border-transparent bg-red-50/60 hover:bg-red-50" : "border-transparent bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md"
        }`}
      >
        {isMega && (
          <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-2.5 py-[3px] text-[9px] font-black tracking-wider text-white shadow-sm border border-white z-10 leading-none">
            MEGA
          </div>
        )}
        
        <div className="relative flex items-center justify-center w-full h-full">
          <RewardIcon reward={rewards[0]} />
          {isRewardLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/30 rounded-xl backdrop-blur-[0.5px]">
              <Lock size={24} className="text-red-600 drop-shadow-md" />
            </div>
          )}
          {rewards.length > 0 && (
            <span className="absolute bottom-1 right-1 rounded-full bg-slate-600/90 px-2 py-[2px] text-[9px] font-bold text-white shadow-sm border border-white/50 leading-none z-10">
              x{rewards.length > 1 ? rewards.length : rewards[0]?.amount || 1} ชิ้น
            </span>
          )}
          {(canClaim || (isExplicitlyUnlocked && !claimed)) && (
            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white shadow-sm z-20" />
          )}
        </div>
      </button>
      
      <span className={`mt-1.5 truncate w-[110px] max-w-[120%] px-1 text-center text-[11px] font-bold leading-tight ${claimed ? "text-slate-400" : "text-slate-600"}`}>
        {getRewardText(rewards[0])}
      </span>
      {canClaim && (
        <span className="text-[10px] font-extrabold text-red-600 uppercase mt-0.5 leading-none">รับได้</span>
      )}
    </div>
  );
}

function QuestList({ quests, isPremium }: { quests: RoyalePassQuest[]; isPremium: boolean }) {
  if (!quests.length) {
    return <div className="rounded-xl bg-slate-50/50 border border-slate-100 p-8 text-center text-sm font-bold text-slate-500">ไม่มีภารกิจในหมวดนี้</div>;
  }

  return (
    <div className="space-y-3">
      {quests.map((quest, index) => {
        const progress = quest.target_value > 0
          ? Math.min(100, Math.round((quest.progress_value / quest.target_value) * 100))
          : 0;
        const questId = quest.quest_id ?? quest.royale_pass_quest_id ?? index;
        const isLockedPremiumQuest = quest.track === "premium" && !isPremium;
        return (
          <div key={`${questId}-${index}`} className={`rounded-xl bg-white border border-slate-100/80 p-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-all duration-300 hover:shadow-md hover:border-slate-200/60 ${isLockedPremiumQuest ? "opacity-50 grayscale" : ""}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-800">{quest.name}</h3>
                  <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${
                    quest.track === "premium" 
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white" 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {getTrackLabel(quest.track)}
                  </span>
                  {quest.is_completed && (
                    <span className="rounded-lg bg-green-50 border border-green-100 px-2 py-0.5 text-[11px] font-bold text-green-600">สำเร็จแล้ว</span>
                  )}
                </div>
                {quest.description && <p className="mt-1 text-xs font-semibold text-slate-500">{quest.description}</p>}
              </div>
              <div className="text-sm font-extrabold text-slate-800">
                {quest.progress_value.toLocaleString("th-TH")} / {quest.target_value.toLocaleString("th-TH")}
              </div>
            </div>
            <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>EXP +{quest.exp_reward.toLocaleString("th-TH")}</span>
              {quest.occurrence_end_at && <span>หมดเวลา {new Date(quest.occurrence_end_at).toLocaleDateString("th-TH")}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RoyalePassDetailPage({ passId }: RoyalePassDetailPageProps) {
  const { hasMounted, isLoggedIn, token, updateToken } = useAuthStore();
  const { notification, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [selectedRewards, setSelectedRewards] = React.useState<{
    level: number;
    track: RoyalePassTrack;
    rewards: RoyalePassReward[];
  } | null>(null);

  const [activePageTab, setActivePageTab] = React.useState<"rewards" | "quests">("rewards");
  const [nextMegaLevel, setNextMegaLevel] = React.useState<number | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false);
  const [swiperInstance, setSwiperInstance] = React.useState<any>(null);
  const [isMobile, setIsMobile] = React.useState(false);


  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateNextMega = React.useCallback((swiper: any) => {
    if (!swiper || !swiper.slides) return;
    let firstVisibleIndex = 0;
    for (let i = 0; i < swiper.slides.length; i++) {
      const slide = swiper.slides[i];
      if (slide.offsetLeft + 5 >= Math.abs(swiper.translate)) {
        firstVisibleIndex = i;
        break;
      }
    }
    let maxVisibleLevel = 0;
    for (let i = firstVisibleIndex; i < swiper.slides.length; i++) {
      if (swiper.slides[i].classList.contains('swiper-slide-visible') || swiper.slides[i].classList.contains('swiper-slide-fully-visible')) {
        const levelAttr = swiper.slides[i].getAttribute('data-level');
        if (levelAttr) {
          const level = Number(levelAttr);
          if (level > maxVisibleLevel) maxVisibleLevel = level;
        }
      }
    }
    if (maxVisibleLevel > 0) {
      const calcMega = Math.ceil((maxVisibleLevel + 1) / 5) * 5;
      setNextMegaLevel(prev => (prev !== calcMega ? calcMega : prev));
    }
  }, []);

  useRoyalePassSocket(passId);

  const detailQuery = useQuery({
    queryKey: queryKeys.royalePass.detail(passId),
    queryFn: () => fetchRoyalePassDetail(passId),
    enabled: hasMounted && isLoggedIn && Boolean(passId),
    staleTime: QUERY_CONFIG.STALE_TIME_SHORT,
    refetchOnWindowFocus: false,
  });

  const detail = detailQuery.data;

  React.useEffect(() => {
    // document.title override removed in favor of SSR metadata
  }, [detail?.name]);

  const rewardLevels = React.useMemo(() => buildRewardLevels(detail), [detail]);
  const questGroups = React.useMemo(() => groupQuestsByScope(detail?.quests ?? []), [detail?.quests]);
  const visibleQuestScopes = (Object.keys(questGroups) as Array<keyof typeof questGroups>).filter(
    (scope) => questGroups[scope].length > 0,
  );
  const questTabScopes = visibleQuestScopes.length ? visibleQuestScopes : (["season"] as Array<keyof typeof questGroups>);
  const currentLevel = getUserLevel(detail);
  const currentExp = getUserExp(detail);
  const nextRequiredExp = detail?.next_required_exp ?? rewardLevels.find((level) => level.level > currentLevel)?.requiredExp ?? currentExp;
  const currentLevelExp = rewardLevels.find((level) => level.level === currentLevel)?.requiredExp ?? 0;
  
  let progressPercent = 0;
  if (nextRequiredExp > currentLevelExp) {
    progressPercent = Math.max(0, Math.min(100, Math.round(((currentExp - currentLevelExp) / (nextRequiredExp - currentLevelExp)) * 100)));
  } else if (currentExp >= nextRequiredExp && nextRequiredExp > 0) {
    progressPercent = 100;
  }
  const isPremium = Boolean(detail?.user_state?.is_premium || ["active", "unlocked"].includes(String(detail?.user_state?.premium_status ?? "").toLowerCase()));
  const canUsePass = Boolean(detail?.is_started);
  const purchaseOptions = detail?.purchase_options;
  const isPreorder = detail?.is_preorder_period;
  
  // Coin Option Logic
  const isCoinEnabled = (detail as any)?.premium_coin_enabled === 1 || (purchaseOptions as any)?.coin_enabled === true || (purchaseOptions as any)?.coin_enabled === 1 || (detail as any)?.premium_coin_enabled === undefined; // Default to true if not specified
  const rawCoinPrice = (detail as any)?.premium_coin_price ?? purchaseOptions?.coin_price;
  const coinPrice = isPreorder ? (purchaseOptions?.preorder_coin_price ?? rawCoinPrice) : rawCoinPrice;

  // Payment Option Logic
  const isPaymentEnabled = (detail as any)?.premium_payment_enabled === 1 || (purchaseOptions as any)?.payment_enabled === true || (purchaseOptions as any)?.payment_enabled === 1;
  const rawPaymentPrice = (detail as any)?.premium_payment_price ?? purchaseOptions?.payment_price;
  const paymentPrice = isPreorder ? (purchaseOptions?.preorder_payment_price ?? rawPaymentPrice) : rawPaymentPrice;

  const invalidatePass = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.royalePass.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.royalePass.detail(passId) });
  }, [passId, queryClient]);

  const buyPremiumMutation = useMutation({
    mutationFn: () => buyRoyalePassPremiumWithCoin(passId),
    onSuccess: async () => {
      notification.success({ message: "ซื้อ Premium สำเร็จ", placement: "topRight" });
      invalidatePass();
      try {
        const refreshResp = await refreshToken() as any;
        const newToken = refreshResp?.data || refreshResp?.access;
        if (newToken && typeof newToken === "string") {
          await updateToken(newToken);
        }
      } catch (err) {
        console.error("Failed to update token", err);
      }
    },
    onError: (error: any) => {
      notification.error({
        message: error?.response?.data?.message || "ซื้อ Premium ไม่สำเร็จ",
        placement: "topRight",
      });
    },
  });

  const claimMutation = useMutation({
    mutationFn: ({ level, track }: { level: number; track: RoyalePassTrack }) =>
      claimRoyalePassReward(passId, level, track),
    onSuccess: async () => {
      notification.success({ message: "รับรางวัลสำเร็จ", placement: "topRight" });
      setSelectedRewards(null);
      invalidatePass();
      try {
        const refreshResp = await refreshToken() as any;
        const newToken = refreshResp?.data || refreshResp?.access;
        if (newToken && typeof newToken === "string") {
          await updateToken(newToken);
        }
      } catch (err) {
        console.error("Failed to update token", err);
      }
    },
    onError: (error: any) => {
      notification.error({
        message: error?.response?.data?.message || "รับรางวัลไม่สำเร็จ",
        placement: "topRight",
      });
    },
  });

  const handleBuyPremium = () => {
    setIsUpgradeModalOpen(true);
  };

  if (!hasMounted || detailQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white font-primary">
        <GifLoader width={150} height={150} />
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center font-primary">
        <Lock size={36} className="text-red-600" />
        <h1 className="mt-4 text-2xl font-black text-slate-950">กรุณาเข้าสู่ระบบก่อนดู Royale Pass</h1>
      </main>
    );
  }

  if (detailQuery.isError || !detail) {
    return (
      <main className="min-h-screen bg-[#f5f6f8] px-4 py-10 font-primary">
        <div className="mx-auto max-w-[720px] rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">ไม่พบ Royale Pass</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafbfc] pb-16 font-primary">
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0">
          <Image src={getPassBannerSrc(detail)} alt={detail.name} fill className="object-cover object-center" />
        </div>
        <div className="relative mx-auto max-w-[1440px] px-4 py-8 md:px-6 md:py-12">
            <Link href="/royale-pass" className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-xl border border-white/20 hover:-translate-y-0.5 w-fit shadow-xl" style={{ backgroundColor: '#1a1b1e', color: 'white' }}>
              <ChevronLeft size={18} style={{ color: 'white' }} />
              <span className="font-bold text-sm tracking-wide" style={{ color: 'white' }}>ย้อนกลับหน้ารวม Royale Pass</span>
            </Link>

          <div className="max-w-3xl p-6 md:p-8 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl text-white drop-shadow-lg">{detail.name}</h1>
            
            {detail.description && (
              <p className="mt-4 text-sm md:text-base text-white/80 font-medium leading-relaxed max-w-2xl">
                {detail.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {!isPremium && canUsePass && (
                <button
                  onClick={handleBuyPremium}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-6 py-3 text-sm font-extrabold text-amber-950 shadow-[0_4px_16px_rgba(251,191,36,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Crown size={18} className="text-amber-900" />
                  อัปเกรด Premium
                </button>
              )}
              
              <div className="flex items-center gap-2 bg-black/30 rounded-xl px-5 py-3 border border-white/10 backdrop-blur-sm text-white">
                <CalendarDays size={18} className="text-red-400" />
                <span className="text-sm font-bold tracking-wide">
                  {formatPassDateRange(detail.start_date, detail.end_date)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.01)] sticky top-0 z-20">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="flex gap-8">
            <button onClick={() => setActivePageTab("rewards")} className={`py-4 text-sm font-bold border-b-2 ${activePageTab === "rewards" ? "border-red-600 text-red-600" : "border-transparent text-slate-500"}`}>รางวัล LV</button>
            <button onClick={() => setActivePageTab("quests")} className={`py-4 text-sm font-bold border-b-2 ${activePageTab === "quests" ? "border-red-600 text-red-600" : "border-transparent text-slate-500"}`}>ภารกิจ</button>
          </div>
        </div>
      </div>

      {activePageTab === "rewards" ? (
        <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-6">
          <div className={`flex items-start bg-white border border-slate-100 p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden ${isMobile ? "flex-col gap-3 h-[600px]" : "flex-row gap-4"}`}>
            <div className={`shrink-0 select-none z-10 bg-white ${isMobile ? "grid grid-cols-[60px_1fr_1fr] w-full gap-4 pb-4 border-b border-slate-100" : "flex flex-col w-[130px] pr-4 gap-4"}`}>
              <div className={`${isMobile ? "h-auto py-2" : "h-[64px] shrink-0 pt-1.5"} flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#ce2424] to-[#a61313] text-white shadow-[0_2px_8px_rgba(220,38,38,0.25)] border border-red-500/20`}>
                <p className="text-[7.5px] font-extrabold text-white/90 tracking-wider">เลเวล</p>
                <p className="text-[13px] font-black tracking-widest leading-none mt-1.5">LV. {currentLevel}</p>
                <p className="text-[8px] font-bold text-white/80 mt-1.5 tracking-wider">{currentExp} / {nextRequiredExp} EXP</p>
              </div>
              <div className={`${isMobile ? "h-[48px] text-[13px]" : "h-[116px] text-[15px] shrink-0"} flex items-center justify-center rounded-xl bg-white border border-red-100 font-black text-red-500 shadow-sm`}>ฟรี</div>
              <div className={`${isMobile ? "h-[48px] flex-row gap-1.5 p-1" : "h-[116px] flex-col gap-1.5 p-2 shrink-0"} flex items-center justify-center rounded-xl bg-gradient-to-b from-red-700 to-red-900 border border-red-500/30 text-center relative overflow-hidden shadow-[0_4px_12px_rgba(153,27,27,0.3)]`}>
                <Crown size={isMobile ? 18 : 24} className="text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]" />
                {isMobile && <span className="text-[10px] font-black tracking-widest text-amber-300 mt-0.5">พรีเมียม</span>}
              </div>
            </div>

            <div className={`flex-1 min-w-0 relative ${isMobile ? "w-full h-full mt-2" : "pr-2"}`}>
              <Swiper
                direction={isMobile ? "vertical" : "horizontal"}
                modules={[FreeMode]}
                freeMode={true}
                slidesPerView="auto"
                spaceBetween={isMobile ? 16 : 12}
                className={`py-1 ${isMobile ? "h-full" : ""}`}
                watchSlidesProgress={true}
                onSwiper={(swiper) => {
                  setSwiperInstance(swiper);
                  updateNextMega(swiper);
                }}
                onUpdate={updateNextMega}
                onProgress={updateNextMega}
                onSetTranslate={updateNextMega}
              >
                {rewardLevels.map((level, index) => {
                  const isLevelReached = currentLevel >= level.level;

                  return (
                    <SwiperSlide key={level.level} data-level={level.level} className={`shrink-0 ${isMobile ? "!h-auto w-full pb-4 border-b border-slate-50 last:border-0" : "!w-auto flex flex-col pr-2"}`}>
                      <div className={`${isMobile ? "grid grid-cols-[60px_1fr_1fr] w-full gap-4 items-center" : "flex flex-col gap-4 shrink-0"}`}>
                        {/* Level Number & Path */}
                        <div className={`relative flex items-center justify-center ${isMobile ? "h-[80px]" : "h-[64px] w-[80px] shrink-0"}`}>
                          {/* Connecting Line to Next Level */}
                          {index < rewardLevels.length - 1 && (
                            <div className={`absolute z-0 bg-slate-100 overflow-hidden rounded-full ${
                              isMobile 
                                ? "left-1/2 -translate-x-1/2 top-1/2 bottom-[-16px] w-[3px]" 
                                : "top-1/2 -translate-y-1/2 left-1/2 right-[-52px] h-[3px]"
                            }`}>
                              <div 
                                className="bg-red-500 absolute top-0 left-0 transition-all duration-500 ease-out"
                                style={{
                                  width: isMobile ? "100%" : (currentLevel > level.level ? "100%" : currentLevel === level.level ? `${progressPercent}%` : "0%"),
                                  height: isMobile ? (currentLevel > level.level ? "100%" : currentLevel === level.level ? `${progressPercent}%` : "0%") : "100%",
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Level Circle */}
                          <div className={`relative z-10 w-[36px] h-[36px] rounded-full flex items-center justify-center border-2 text-[13px] font-black transition-all duration-300 bg-white ${
                            currentLevel >= level.level
                              ? "border-red-500 text-red-600 shadow-[0_2px_8px_rgba(239,68,68,0.2)]"
                              : "border-slate-100 text-slate-400"
                          }`}>
                            {level.level}
                          </div>
                          
                          {/* EXP label */}
                          {level.level > 1 && level.requiredExp > 0 && (
                            <div className={`absolute z-20 text-[9px] font-extrabold text-slate-300 leading-none whitespace-nowrap bg-white px-1 ${
                              isMobile ? "left-1/2 -translate-x-1/2 top-0" : "left-[-6px] top-0 -translate-x-1/2"
                            }`}>
                              {level.requiredExp.toLocaleString("th-TH")} EXP
                            </div>
                          )}
                        </div>

                        {/* Free rewards */}
                        <RewardStack
                          claimDisabled={!canUsePass}
                          level={level.level}
                          onSelect={(selectedLevel, track, rewards) => setSelectedRewards({ level: selectedLevel, track, rewards })}
                          rewards={level.freeRewards}
                          track="free"
                          currentLevel={currentLevel}
                          isPremium={isPremium}
                          containerClassName={isMobile ? "w-full h-[80px]" : "w-[80px] h-[116px]"}
                        />

                        {/* Premium rewards */}
                        <RewardStack
                          claimDisabled={!canUsePass}
                          level={level.level}
                          onSelect={(selectedLevel, track, rewards) => setSelectedRewards({ level: selectedLevel, track, rewards })}
                          rewards={level.premiumRewards}
                          track="premium"
                          currentLevel={currentLevel}
                          isPremium={isPremium}
                          containerClassName={isMobile ? "w-full h-[80px]" : "w-[80px] h-[116px]"}
                        />
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* Right side fixed column (Next Milestone) */}
            {(() => {
              const maxLvl = rewardLevels.length > 0 ? rewardLevels[rewardLevels.length - 1].level : 0;
              let targetNextMega = nextMegaLevel;
              if (!targetNextMega) {
                targetNextMega = Math.ceil((currentLevel + 1) / 5) * 5;
                if (targetNextMega === 0) targetNextMega = 5;
              }
              
              const isHidden = targetNextMega > maxLvl;
              const displayNextMega = isHidden ? Math.ceil(maxLvl / 5) * 5 : targetNextMega;
              const milestoneLevel = rewardLevels.find(l => l.level === displayNextMega) || rewardLevels[rewardLevels.length - 1];
              
              if (!milestoneLevel) return null;

              return (
                <div 
                  className={`shrink-0 overflow-hidden transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    isHidden ? "w-0 opacity-0 -ml-4 pointer-events-none" : "w-[110px] opacity-100 ml-0"
                  }`}
                >
                  <div 
                    onClick={() => {
                      const slideIndex = rewardLevels.findIndex(l => l.level === milestoneLevel.level);
                      if (slideIndex !== -1 && swiperInstance) {
                        swiperInstance.slideTo(slideIndex, 500); // 500ms smooth scroll
                      }
                    }}
                    className="w-[110px] shrink-0 border border-red-100 rounded-2xl p-2.5 bg-red-50/20 shadow-sm flex flex-col gap-4 items-center cursor-pointer hover:bg-red-50 hover:border-red-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    {/* Level Number */}
                    <div className="relative h-[48px] shrink-0 flex items-center justify-center w-full">
                      <div className="relative z-10 w-[36px] h-[36px] rounded-full flex items-center justify-center border-2 border-slate-100 text-slate-700 text-[13px] font-black bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] group-hover:border-red-200 group-hover:text-red-600 transition-colors">
                        {milestoneLevel.level}
                      </div>
                    </div>

                    {/* Free rewards (Middle) */}
                    <RewardStack
                      claimDisabled={!canUsePass}
                      level={milestoneLevel.level}
                      onSelect={(selectedLevel, track, rewards) => setSelectedRewards({ level: selectedLevel, track, rewards })}
                      rewards={milestoneLevel.freeRewards}
                      track="free"
                      currentLevel={currentLevel}
                      isPremium={isPremium}
                    />

                    {/* Premium rewards (Bottom) */}
                    <RewardStack
                      claimDisabled={!canUsePass}
                      level={milestoneLevel.level}
                      onSelect={(selectedLevel, track, rewards) => setSelectedRewards({ level: selectedLevel, track, rewards })}
                      rewards={milestoneLevel.premiumRewards}
                      track="premium"
                      currentLevel={currentLevel}
                      isPremium={isPremium}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      ) : (
        <section className="mx-auto grid max-w-[1200px] gap-6 px-4 py-8 md:px-6 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <Tabs
                className="my-red-tabs"
                items={questTabScopes.map((scope) => ({
                  key: scope,
                  label: questScopeLabels[scope as keyof typeof questScopeLabels],
                  children: <QuestList quests={questGroups[scope as keyof typeof questGroups]} isPremium={isPremium} />,
                }))}
              />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <h2 className="text-lg font-bold text-slate-900">Quest</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500 leading-relaxed">ทำภารกิจเพื่อเพิ่ม EXP และปลดล็อกเลเวล</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["daily", "weekly", "season"] as const).map((scope) => {
                  const count = questGroups[scope].length;
                  return (
                    <div key={scope} className={`rounded-xl p-3 text-center border transition-all ${
                      count > 0 
                        ? "bg-red-50/30 border-red-100/60 text-red-600 font-bold" 
                        : "bg-slate-50 border-slate-100 text-slate-500"
                    }`}>
                      <p className="text-2xl font-extrabold leading-tight">{count}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider mt-1">{questScopeLabels[scope]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>
      )}

      <Modal
        open={Boolean(selectedRewards)}
        onCancel={() => setSelectedRewards(null)}
        footer={null}
        centered
        className="custom-modal-store"
        title={selectedRewards ? `Level ${selectedRewards.level} ${getTrackLabel(selectedRewards.track)}` : undefined}
      >
        <div className="space-y-3 mt-4">
          {selectedRewards?.rewards.map((reward, index) => {
            const isClaimed = reward.is_claimed;
            return (
              <div key={`${reward.reward_type}-${index}`} className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                isClaimed 
                  ? "bg-slate-50/50 border-slate-100/80" 
                  : "bg-white border-slate-100 hover:border-slate-200"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                    isClaimed ? "bg-slate-100/60" : "bg-red-50/50"
                  }`}>
                    <RewardIcon reward={reward} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm flex gap-2 items-center ${isClaimed ? "text-slate-500 line-through" : "text-slate-800"}`}>
                      <span>{getRewardText(reward)}</span>
                      {(reward.amount > 1 || reward.amount > 1) && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isClaimed ? "bg-slate-200 text-slate-500" : "bg-red-50 text-red-600"}`}>
                          x{reward.amount || reward.amount} ชิ้น
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400">
                      {reward.reward_type === "user_coupon" ? "ดูรายละเอียดคูปองได้หลังรับรางวัล" : reward.reward_type}
                    </p>
                  </div>
                </div>
                {getClaimStateLabel(reward) && (
                  <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-sm ${
                    isClaimed 
                      ? "bg-slate-100 text-slate-500" 
                      : reward.is_claimable 
                        ? "bg-red-600 text-white" 
                        : "bg-slate-50 border border-slate-100 text-slate-500"
                  }`}>
                    {getClaimStateLabel(reward)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {canUsePass && selectedRewards?.rewards.some((reward) => reward.is_claimable && !reward.is_claimed) && (
          <Button
            type="primary"
            danger
            block
            loading={claimMutation.isPending}
            onClick={() => claimMutation.mutate({ level: selectedRewards.level, track: selectedRewards.track })}
            className="mt-6 h-11 rounded-full font-bold shadow-md shadow-red-200/50 bg-gradient-to-r from-red-500 to-red-600 border-none hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-2"
          >
            <Check size={16} />
            รับรางวัล
          </Button>
        )}
      </Modal>
      {/* Upgrade Premium Modal */}
      <Modal
        title={null}
        open={isUpgradeModalOpen}
        onCancel={() => setIsUpgradeModalOpen(false)}
        footer={null}
        centered
        width={600}
        styles={{ body: { padding: 0 }, content: { borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9' } }}
        closeIcon={
          <div className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 hover:scale-105 transition mt-2 mr-2">
            <X size={18} className="text-slate-600" />
          </div>
        }
      >
        <div className="p-10 font-primary">
          <h2 className="text-center text-2xl font-black tracking-tight text-slate-800">อัปเกรด Premium Royale Pass</h2>
          <p className="text-center text-sm font-semibold text-slate-500 mt-3 mb-10 px-4">
            เลือกวิธีชำระเงินที่คุณต้องการเพื่อปลดล็อครางวัลแถว Premium ทั้งหมดทันที!
          </p>

          <div className={`grid grid-cols-1 ${isCoinEnabled && isPaymentEnabled ? 'sm:grid-cols-2' : 'max-w-sm mx-auto'} gap-5`}>
            {/* Coin Option */}
            {isCoinEnabled && (
            <div className="rounded-[20px] border border-amber-100 p-8 flex flex-col items-center text-center shadow-[0_4px_24px_rgba(245,158,11,0.06)] hover:border-amber-300 hover:shadow-lg hover:-translate-y-1 transition duration-300 bg-gradient-to-b from-white to-amber-50/50">
              <div className="h-16 w-16 rounded-full bg-amber-100/60 flex items-center justify-center text-amber-500 mb-5 shadow-sm">
                <Ticket size={32} strokeWidth={2.5} className="rotate-[-10deg]" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg">ซื้อด้วยเหรียญทอง</h3>
              <p className="text-xs font-semibold text-slate-500 mt-2.5 mb-8 leading-relaxed px-2">หักจากยอดคงเหลือในบัญชีผู้ใช้ (เหรียญทอง)</p>
              
              <div className="mt-auto w-full">
                <div className="text-2xl font-black text-slate-800 mb-5 flex items-center justify-center gap-2">
                  {Number(coinPrice ?? 0).toLocaleString("th-TH")} <span className="text-lg">เหรียญทอง</span>
                </div>
                <button
                  onClick={() => {
                    setIsUpgradeModalOpen(false);
                    buyPremiumMutation.mutateAsync();
                  }}
                  disabled={buyPremiumMutation.isPending}
                  className="w-full rounded-xl bg-gradient-to-b from-[#bd7916] to-[#99600e] hover:from-[#d1871a] hover:to-[#a86a10] !text-white font-extrabold py-3.5 transition shadow-[0_4px_12px_rgba(189,121,22,0.3)] hover:shadow-[0_6px_16px_rgba(189,121,22,0.4)] tracking-wide"
                >
                  {buyPremiumMutation.isPending ? "กำลังดำเนินการ..." : "ซื้อด้วยเหรียญทอง"}
                </button>
              </div>
            </div>
            )}

            {/* Fiat Option */}
            {isPaymentEnabled && (
            <div className="rounded-[20px] border border-red-100 p-8 flex flex-col items-center text-center shadow-[0_4px_24px_rgba(220,38,38,0.06)] hover:border-red-300 hover:shadow-lg hover:-translate-y-1 transition duration-300 bg-gradient-to-b from-white to-red-50/50">
              <div className="h-16 w-16 rounded-full bg-red-100/60 flex items-center justify-center text-red-500 mb-5 shadow-sm">
                <Crown size={32} strokeWidth={2.5} />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg">ชำระเงินตรง (เงินจริง)</h3>
              <p className="text-xs font-semibold text-slate-500 mt-2.5 mb-8 leading-relaxed px-2">ปลดล็อคพรีเมียมด้วยการชำระเงินจริงโดยตรง สะดวก รวดเร็ว</p>
              
              <div className="mt-auto w-full">
                <div className="text-2xl font-black text-slate-800 mb-5 flex items-center justify-center gap-2">
                  {paymentPrice ? Number(paymentPrice).toLocaleString("th-TH") : "299.00"} <span className="text-lg">บาท</span>
                </div>
                <button
                  onClick={() => {
                    setIsUpgradeModalOpen(false);
                    if (token) {
                      const topupUrl = buildCoinEnjoyTopupUrl(token);
                      openSafeExternalInNewTab(topupUrl);
                    } else {
                      notification.info({ message: "กรุณาเข้าสู่ระบบ", placement: "topRight" });
                    }
                  }}
                  className="w-full rounded-xl bg-gradient-to-b from-[#c41b1b] to-[#a31515] hover:from-[#d91e1e] hover:to-[#b51717] !text-white font-extrabold py-3.5 transition shadow-[0_4px_12px_rgba(196,27,27,0.3)] hover:shadow-[0_6px_16px_rgba(196,27,27,0.4)] tracking-wide"
                >
                  ชำระเงิน {paymentPrice ? Number(paymentPrice).toLocaleString("th-TH") : "299.00"} บาท
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      </Modal>
    </main>
  );
}
