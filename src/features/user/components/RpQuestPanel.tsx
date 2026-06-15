"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { App, Button, Empty, Modal, Progress, Skeleton } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  ListChecks,
  Lock,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";

import { queryKeys } from "@/constants/query";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useAuthStore } from "@/stores/authStore";
import {
  claimRankQuest,
  fetchRankQuestDetail,
  fetchRankQuests,
  type RankQuest,
} from "@/services/api/rankQuestApi";

const QUEST_IMAGE_FALLBACK = "/images/book.png";
const RP_ICON_FALLBACK = "/images/rp.png";
const DEFAULT_PREVIEW_LIMIT = 10;

type QuestFilter = "all" | "claimable" | "completed" | "in_progress";

interface RpQuestPanelProps {
  mode?: "preview" | "full";
  previewLimit?: number;
}

const QUEST_TYPE_LABELS: Record<string, string> = {
  buy_ep_range_claim: "ซื้อ EP ที่กำหนด",
  buy_ep_count_claim: "ซื้อ EP ให้ครบ",
  buy_full_book_claim: "ซื้อทั้งเรื่อง",
};

const QUEST_FILTERS: Array<{ label: string; value: QuestFilter }> = [
  { label: "ทั้งหมด", value: "all" },
  { label: "รอรับของ", value: "claimable" },
  { label: "เควสเสร็จ", value: "completed" },
  { label: "กำลังทำ", value: "in_progress" },
];

const getQuestTypeLabel = (questType: string) => QUEST_TYPE_LABELS[questType] ?? "ภารกิจ RP";

const formatDate = (value?: string | null) => {
  if (!value) return "ไม่จำกัดเวลา";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ไม่จำกัดเวลา";
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getQuestStatus = (quest: RankQuest) => {
  if (quest.claim?.is_claimed) {
    return {
      label: "รับแล้ว",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (quest.is_claimable) {
    return {
      label: "รับได้",
      className: "border-red-200 bg-red-50 text-red-600",
    };
  }

  if (quest.progress?.is_completed) {
    return {
      label: "สำเร็จแล้ว",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "กำลังทำ",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  };
};

const getSafePercent = (quest: RankQuest) => {
  const percent = Number(quest.progress?.percent ?? 0);
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
};

const isQuestClaimable = (quest: RankQuest) => quest.is_claimable && !quest.claim?.is_claimed;

const isQuestCompleted = (quest: RankQuest) => Boolean(quest.progress?.is_completed || quest.claim?.is_claimed);

const isQuestInProgress = (quest: RankQuest) => !isQuestClaimable(quest) && !isQuestCompleted(quest);

const getQuestPriority = (quest: RankQuest) => {
  if (isQuestClaimable(quest)) return 0;
  if (quest.progress?.is_completed && !quest.claim?.is_claimed) return 1;
  if (isQuestInProgress(quest)) return 2;
  return 3;
};

const getFilteredQuests = (quests: RankQuest[], filter: QuestFilter) => {
  const filtered = quests.filter((quest) => {
    if (filter === "claimable") return isQuestClaimable(quest);
    if (filter === "completed") return isQuestCompleted(quest);
    if (filter === "in_progress") return isQuestInProgress(quest);
    return true;
  });

  return filtered.sort((firstQuest, secondQuest) => {
    const priorityDiff = getQuestPriority(firstQuest) - getQuestPriority(secondQuest);
    if (priorityDiff !== 0) return priorityDiff;
    return getSafePercent(secondQuest) - getSafePercent(firstQuest);
  });
};

interface QuestCardProps {
  quest: RankQuest;
  rpIcon: string;
  isClaiming: boolean;
  isClaimLoading: boolean;
  onClaim: () => void;
  onOpenDetail: () => void;
}

const QuestCard = ({
  quest,
  rpIcon,
  isClaiming,
  isClaimLoading,
  onClaim,
  onOpenDetail,
}: QuestCardProps) => {
  const status = getQuestStatus(quest);
  const percent = getSafePercent(quest);
  const progressValue = Number(quest.progress?.progress_value ?? 0);
  const targetValue = Number(quest.progress?.target_value ?? 0);
  const canClaim = quest.is_claimable && !quest.claim?.is_claimed;

  return (
    <article className="group flex h-full min-h-[260px] flex-col overflow-hidden rounded-3xl border border-white bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-xl hover:shadow-red-100/70">
      <div className="flex gap-3 p-4 pb-3">
        <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
          <Image
            src={quest.book?.img || QUEST_IMAGE_FALLBACK}
            alt={quest.book?.name || quest.name}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white shadow-sm">
              <Image
                src={rpIcon}
                alt="RP"
                width={14}
                height={14}
                className="h-3.5 w-3.5 object-contain"
                unoptimized
              />
              {Number(quest.rp_reward || 0).toLocaleString()}
            </span>
          </div>
          <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-950">
            {quest.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
            {quest.book?.name || "หนังสือภารกิจ"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-600">
          <Target size={14} className="text-red-500" />
          {getQuestTypeLabel(quest.quest_type)}
        </div>

        <Progress
          percent={percent}
          showInfo={false}
          strokeColor={canClaim ? "#dc2626" : "#ef4444"}
          trailColor="#fee2e2"
        />

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            {progressValue.toLocaleString()} / {targetValue.toLocaleString()}
          </span>
          <span className="text-slate-500">ถึง {formatDate(quest.end_date)}</span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Button
            type={canClaim ? "primary" : "default"}
            danger={canClaim}
            disabled={!canClaim || isClaiming}
            loading={isClaimLoading}
            onClick={onClaim}
            className={`h-10 flex-1 rounded-full font-bold ${canClaim ? "shadow-md shadow-red-100" : ""}`}
          >
            {quest.claim?.is_claimed ? "รับแล้ว" : canClaim ? (
              <span className="inline-flex items-center justify-center gap-1">
                รับ
                <Image
                  src={rpIcon}
                  alt="RP"
                  width={15}
                  height={15}
                  className="h-[15px] w-[15px] object-contain"
                  unoptimized
                />
              </span>
            ) : "ยังไม่สำเร็จ"}
          </Button>

          <Button
            onClick={onOpenDetail}
            className="h-10 rounded-full px-3 font-bold"
          >
            ดูรายละเอียด
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
};

const RpQuestPanel = ({
  mode = "preview",
  previewLimit = DEFAULT_PREVIEW_LIMIT,
}: RpQuestPanelProps) => {
  const { user, isLoggedIn } = useAuthStore();
  const { settings } = useWebsiteSettings();
  const queryClient = useQueryClient();
  const { notification } = App.useApp();
  const searchParams = useSearchParams();
  const panelRef = React.useRef<HTMLElement | null>(null);
  const [selectedQuest, setSelectedQuest] = React.useState<RankQuest | null>(null);
  const [isRefreshingQuest, setIsRefreshingQuest] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<QuestFilter>("all");

  const questListQuery = useQuery({
    queryKey: queryKeys.rank.quests(),
    queryFn: fetchRankQuests,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const questDetailQuery = useQuery({
    queryKey: queryKeys.rank.questDetail(selectedQuest?.rp_quest_id),
    queryFn: () => fetchRankQuestDetail(selectedQuest!.rp_quest_id),
    enabled: Boolean(selectedQuest?.rp_quest_id),
    staleTime: 60 * 1000,
  });

  const claimMutation = useMutation({
    mutationFn: (questId: number | string) => claimRankQuest(questId),
    onSuccess: async () => {
      notification.success({
        message: "รับ RP สำเร็จ",
        description: "ระบบกำลังอัปเดตข้อมูลภารกิจและอันดับของคุณ",
        placement: "topRight",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.rank.quests() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.rank.questDetail(selectedQuest?.rp_quest_id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.rank.navbarProfile(user?.user_id) }),
      ]);
    },
    onError: (error: any) => {
      notification.error({
        message: "รับ RP ไม่สำเร็จ",
        description: error?.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        placement: "topRight",
      });
    },
  });

  const quests = questListQuery.data ?? [];
  const isPreviewMode = mode === "preview";
  const filteredQuests = React.useMemo(() => getFilteredQuests(quests, activeFilter), [activeFilter, quests]);
  const displayedQuests = isPreviewMode ? filteredQuests.slice(0, previewLimit) : filteredQuests;
  const rpIcon = settings?.rp || RP_ICON_FALLBACK;
  const claimableCount = quests.filter(isQuestClaimable).length;
  const completedCount = quests.filter(isQuestCompleted).length;
  const inProgressCount = quests.filter(isQuestInProgress).length;

  const getFilterCount = React.useCallback((filter: QuestFilter) => {
    if (filter === "claimable") return claimableCount;
    if (filter === "completed") return completedCount;
    if (filter === "in_progress") return inProgressCount;
    return quests.length;
  }, [claimableCount, completedCount, inProgressCount, quests.length]);

  React.useEffect(() => {
    if (!selectedQuest) return;

    const updatedQuest = quests.find((quest) => quest.rp_quest_id === selectedQuest.rp_quest_id);
    if (updatedQuest && updatedQuest !== selectedQuest) {
      setSelectedQuest(updatedQuest);
    }
  }, [quests, selectedQuest]);

  const handleRefreshSelectedQuest = React.useCallback(async () => {
    if (!selectedQuest) return;

    setIsRefreshingQuest(true);
    try {
      await Promise.all([
        questListQuery.refetch(),
        questDetailQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: queryKeys.rank.navbarProfile(user?.user_id) }),
      ]);
    } finally {
      setIsRefreshingQuest(false);
    }
  }, [questDetailQuery, questListQuery, queryClient, selectedQuest, user?.user_id]);

  React.useEffect(() => {
    if (searchParams.get("openRpQuest") !== "1") return;
    window.setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [searchParams]);

  if (!isLoggedIn) return null;

  return (
    <section
      ref={panelRef}
      id="rp-quest"
      className="scroll-mt-24 overflow-hidden rounded-[28px] border border-red-100 bg-gradient-to-br from-white via-rose-50/80 to-orange-50 p-4 shadow-[0_18px_50px_-30px_rgba(220,38,38,0.45)] md:p-6"
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            ภารกิจเพิ่มแต้ม
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
            ทำภารกิจจากหนังสือที่กำหนดเพื่อสะสมแต้มและไต่อันดับของคุณ
          </p>
          {isPreviewMode ? (
            <Link
              href="/all-quest"
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-red-200 bg-white px-4 text-sm font-bold !text-red-600 shadow-sm transition-all hover:!border-red-600 hover:!bg-red-600 hover:!text-white"
            >
              ดูภารกิจทั้งหมด
              <ChevronRight size={16} />
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-red-100 bg-white/80 p-1.5 shadow-sm backdrop-blur md:min-w-[210px]">
          <div className="rounded-xl bg-gradient-to-br from-red-600 to-rose-600 px-3 py-2 text-white shadow-md shadow-red-100">
            <p className="text-[10px] text-white/75">ทั้งหมด</p>
            <p className="text-base font-black">{quests.length.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-[10px] text-red-500/80">สำเร็จ</p>
            <p className="text-base font-black text-red-700">{completedCount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {!questListQuery.isLoading && quests.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {QUEST_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.value;
            const count = getFilterCount(filter.value);

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold transition-all ${
                  isActive
                    ? "border-red-600 bg-red-600 !text-white shadow-md shadow-red-100"
                    : "border-red-100 bg-white/85 text-slate-600 hover:border-red-300 hover:text-red-600"
                }`}
              >
                {filter.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  isActive ? "bg-white/20 text-white" : "bg-red-50 text-red-500"
                }`}>
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {questListQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-3xl border border-white bg-white/80 p-4">
              <Skeleton active avatar paragraph={{ rows: 4 }} />
            </div>
          ))}
        </div>
      ) : quests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-red-200 bg-white/70 p-10">
          <Empty description="ยังไม่มีภารกิจ RP ในตอนนี้" />
        </div>
      ) : displayedQuests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-red-200 bg-white/70 p-10">
          <Empty description="ไม่พบภารกิจในตัวกรองนี้" />
        </div>
      ) : isPreviewMode ? (
        <Swiper
          modules={[FreeMode]}
          freeMode={{ enabled: true, sticky: false, momentumRatio: 0.6 }}
          grabCursor
          slidesPerView={1.05}
          spaceBetween={14}
          breakpoints={{
            640: { slidesPerView: 1.35, spaceBetween: 16 },
            768: { slidesPerView: 2.05, spaceBetween: 18 },
            1280: { slidesPerView: 3.05, spaceBetween: 18 },
          }}
          className="-mx-1 px-1 pb-2"
        >
          {displayedQuests.map((quest) => (
            <SwiperSlide key={quest.rp_quest_id} className="!h-auto">
              <QuestCard
                quest={quest}
                rpIcon={rpIcon}
                isClaiming={claimMutation.isPending}
                isClaimLoading={claimMutation.isPending && claimMutation.variables === quest.rp_quest_id}
                onClaim={() => claimMutation.mutate(quest.rp_quest_id)}
                onOpenDetail={() => setSelectedQuest(quest)}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {displayedQuests.map((quest) => (
            <QuestCard
              key={quest.rp_quest_id}
              quest={quest}
              rpIcon={rpIcon}
              isClaiming={claimMutation.isPending}
              isClaimLoading={claimMutation.isPending && claimMutation.variables === quest.rp_quest_id}
              onClaim={() => claimMutation.mutate(quest.rp_quest_id)}
              onOpenDetail={() => setSelectedQuest(quest)}
            />
          ))}
        </div>
      )}

      {claimableCount > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-100 bg-white/80 px-4 py-3 text-sm font-bold text-red-600">
          <CheckCircle2 size={18} />
          มี {claimableCount.toLocaleString()} ภารกิจที่รับรางวัลได้แล้ว
        </div>
      )}

      <Modal
        open={Boolean(selectedQuest)}
        onCancel={() => setSelectedQuest(null)}
        footer={null}
        centered
        width={620}
        title={null}
      >
        {selectedQuest && (
          <div className="pt-3">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <ListChecks size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">Quest Detail</p>
                <h3 className="mt-1 text-xl font-black leading-snug text-slate-950">
                  {selectedQuest.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{selectedQuest.description || getQuestTypeLabel(selectedQuest.quest_type)}</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">รางวัล</p>
                <p className="inline-flex items-center gap-1 font-black text-red-600">
                  <Image
                    src={rpIcon}
                    alt="RP"
                    width={16}
                    height={16}
                    className="h-4 w-4 object-contain"
                    unoptimized
                  />
                  {Number(selectedQuest.rp_reward || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">ความคืบหน้า</p>
                <p className="font-black text-slate-900">{getSafePercent(selectedQuest)}%</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">หมดเขต</p>
                <p className="font-black text-slate-900">{formatDate(selectedQuest.end_date)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-black text-slate-900">รายการตอนในภารกิจ</p>
                <Button
                  size="small"
                  icon={<RefreshCw size={14} />}
                  loading={isRefreshingQuest}
                  onClick={handleRefreshSelectedQuest}
                >
                  รีเฟรช
                </Button>
              </div>

              {questDetailQuery.isLoading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : !questDetailQuery.data?.items?.length ? (
                <div className="rounded-2xl bg-white p-4 text-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                      <Lock size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">
                        ภารกิจนี้ไม่มีรายการตอนเฉพาะ
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        ให้ทำตามเงื่อนไขหลักของภารกิจจากหนังสือที่กำหนด
                      </p>
                      {selectedQuest.book?.book_id ? (
                        <Link
                          href={`/book/${selectedQuest.book.book_id}`}
                          className="mt-3 inline-flex h-10 items-center gap-2 rounded-full !border !border-red-600 !bg-red-600 px-4 text-sm font-bold !text-white shadow-md shadow-red-100 transition-colors hover:!border-red-700 hover:!bg-red-700 hover:!text-white focus:!bg-red-700 focus:!text-white active:!bg-red-800 active:!text-white"
                        >
                          ไปที่หนังสือ
                          <ChevronRight size={16} />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {questDetailQuery.data.items.map((item) => (
                    <Link
                      key={item.ep.ep_id}
                      href={`/read/${item.ep.book_id}/${item.ep.ep_id}`}
                      className="group flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50/70 hover:shadow-md"
                    >
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                        item.is_purchased ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                      }`}>
                        {item.is_purchased ? <CheckCircle2 size={18} /> : <BookOpenCheck size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-bold text-slate-900 transition-colors group-hover:text-red-700">{item.ep.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.is_purchased ? "ซื้อแล้ว" : "ยังไม่ได้ซื้อ"}
                        </p>
                      </div>
                      <ChevronRight size={16} className="flex-shrink-0 text-slate-300 transition-colors group-hover:text-red-500" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default RpQuestPanel;
