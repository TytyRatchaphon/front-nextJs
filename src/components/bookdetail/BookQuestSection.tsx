"use client";

import Image from "next/image";
import * as React from "react";
import { App, Button, Modal, Progress, Skeleton } from "antd";
import { BookOpen, Check, ChevronDown, Gift, LockKeyhole, Target } from "lucide-react";
import { useBookQuestDetail, useBookQuests, useClaimBookQuestMutation } from "@/hooks/book/useBookQuest";
import type { BookQuest, BookQuestEpisode, BookQuestRewardPreview } from "@/services/api/bookQuestApi";

type BookQuestSectionProps = {
  bookId: number | string;
  isLoggedIn: boolean;
};

const clampPercent = (value: number | undefined) => Math.min(100, Math.max(0, Number(value || 0)));

const getProgressLabel = (quest: BookQuest) => {
  const progress = Number(quest.progress?.progress_value || 0).toLocaleString();
  const target = Number(quest.progress?.target_value ?? quest.target_value ?? 0).toLocaleString();
  return `${progress}/${target}`;
};

const getRewardAmount = (reward: BookQuestRewardPreview) => Number(
  reward.current_reward_amount ?? reward.reward_amount ?? reward.amount ?? 0,
);

const getRewardLabel = (reward: BookQuestRewardPreview) => {
  const amount = getRewardAmount(reward);

  if (reward.item_type === "user_coupon") return reward.coupon_name || "คูปองพิเศษ";
  if (reward.item_type === "cashback_wallet") {
    return amount > 0 ? `Cashback ${amount.toLocaleString()} Free Coin` : "Cashback (คำนวณ)";
  }
  if (reward.item_type === "rp_up") {
    return amount > 0 ? `RP ${amount.toLocaleString()}` : "RP (คำนวณ)";
  }
  if (reward.item_type === "freecoin") return `Free Coin ${amount.toLocaleString()}`;

  const itemType = String(reward.item_type || "").replace(/_/g, " ");
  return amount > 0 ? `${itemType} ${amount.toLocaleString()}` : itemType || "รางวัล";
};

const getRewardDescription = (reward: BookQuestRewardPreview) => {
  if (reward.condition?.display_text) return reward.condition.display_text;
  if (reward.item_type === "user_coupon") return "คูปอนสำหรับหนังสือเล่มนี้";
  if (reward.is_dynamic_amount) return "คำนวณจากยอดซื้อที่เข้าเงื่อนไข";
  return "จำนวนรางวัลตามเงื่อนไขภารกิจ";
};

const getQuestDescription = (quest: BookQuest) => {
  if (quest.description) return quest.description;
  const target = Number(quest.progress?.target_value ?? quest.target_value ?? 0).toLocaleString();
  if (quest.quest_condition_type === "BUY_EP_RANGE_COUNT") {
    return `ซื้อตอนที่กำหนดให้ครบ ${target} ตอน`;
  }
  if (quest.quest_condition_type === "COMPLETE_ALL_PAID_EPISODES") {
    return "ซื้อตอนแบบเสียเงินทั้งหมดของเล่มนี้";
  }
  return `ซื้อตอนในเล่มนี้ให้ครบ ${target} ตอน`;
};

const getEpisodeName = (episode: BookQuestEpisode) => (
  episode.ep_name || episode.name || `ตอนที่ ${episode.ep_id}`
);

const getStatus = (quest: BookQuest) => {
  if (quest.claim?.is_claimed) {
    return {
      label: "รับรางวัลแล้ว",
      className: "border-emerald-200 bg-emerald-50 text-emerald-600",
    };
  }
  if (quest.is_claimable) {
    return {
      label: "รับรางวัลได้",
      className: "border-red-200 bg-red-50 text-red-600",
    };
  }
  return {
    label: "กำลังทำ",
    className: "border-gray-200 bg-gray-50 text-gray-500",
  };
};

function QuestRewardChips({ rewards }: { rewards: BookQuestRewardPreview[] }) {
  if (!rewards.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {rewards.slice(0, 3).map((reward, index) => (
        <span
          key={`${reward.reward_id ?? reward.item_type}-${index}`}
          className="inline-flex min-h-7 items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600"
        >
          <Gift className="h-3.5 w-3.5" />
          {getRewardLabel(reward)}
        </span>
      ))}
    </div>
  );
}

function BookQuestCard({
  quest,
  onClaim,
  onOpenDetail,
  isClaiming,
}: {
  quest: BookQuest;
  onClaim: (quest: BookQuest) => void;
  onOpenDetail: (quest: BookQuest) => void;
  isClaiming: boolean;
}) {
  const status = getStatus(quest);
  const canClaim = Boolean(quest.is_claimable) && !quest.claim?.is_claimed;

  return (
    <article className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:border-red-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onOpenDetail(quest)}
        >
          <h3 className="line-clamp-1 text-sm font-semibold leading-6 text-gray-900">{quest.name}</h3>
          <p className="line-clamp-1 text-xs font-normal leading-5 text-gray-500">
            {getQuestDescription(quest)}
          </p>
        </button>

        <div className="w-full shrink-0 sm:w-40">
          <div className="mb-1 flex justify-between text-xs font-medium text-gray-500">
            <span>ความคืบหน้า</span>
            <span>{getProgressLabel(quest)}</span>
          </div>
          <Progress
            percent={clampPercent(quest.progress?.percent)}
            showInfo={false}
            size="small"
            strokeColor="#ef334e"
            trailColor="#f1f2f4"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <QuestRewardChips rewards={quest.reward_preview || []} />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(quest)}
            className="text-xs font-medium text-gray-500 transition hover:text-red-600"
          >
            ดูรายละเอียด
          </button>
          {canClaim ? (
            <Button
              type="primary"
              size="small"
              loading={isClaiming}
              onClick={() => onClaim(quest)}
              className="border-none bg-red-500 font-primary text-xs shadow-none hover:!bg-red-600"
            >
              กดรับรางวัล
            </Button>
          ) : (
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function RewardCard({ reward }: { reward: BookQuestRewardPreview }) {
  const amount = getRewardAmount(reward);
  const prominent = reward.item_type !== "user_coupon";

  return (
    <div
      className={prominent
        ? "flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-white p-4"
        : "flex items-center justify-between gap-3 rounded-xl border border-dashed border-red-200 bg-white p-4"}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
          <Gift className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-gray-900">{getRewardLabel(reward)}</p>
          <p className="line-clamp-2 text-xs font-normal leading-5 text-gray-500">
            {getRewardDescription(reward)}
          </p>
        </div>
      </div>
      {amount > 0 && reward.item_type !== "user_coupon" ? (
        <span className="shrink-0 text-xl font-semibold text-red-500">{amount.toLocaleString()}</span>
      ) : null}
    </div>
  );
}

function EpisodeChecklist({ episodes }: { episodes: BookQuestEpisode[] }) {
  const purchasedCount = episodes.filter((episode) => episode.is_bought).length;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between border-b border-red-100 pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <BookOpen className="h-4 w-4 text-gray-400" />
          เช็กลิสต์ตอนที่กำหนด
        </h4>
        <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
          ตอนที่ซื้อแล้ว: {purchasedCount}/{episodes.length}
        </span>
      </div>
      <div className="max-h-[335px] space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/60 p-3">
        {episodes.map((episode) => (
          <div
            key={episode.ep_id}
            className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-3 ${
              episode.is_bought ? "border-emerald-200 bg-emerald-50/40" : "border-gray-100"
            }`}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-normal text-gray-400">ID: {episode.ep_id}</p>
              <p className="line-clamp-2 text-sm font-medium leading-5 text-gray-700">
                {getEpisodeName(episode)}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                episode.is_bought
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-red-100 bg-red-50 text-red-500"
              }`}
            >
              {episode.is_bought ? <Check className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}
              {episode.is_bought ? "ซื้อแล้ว" : "ล็อกอยู่"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BookQuestDetailModal({
  quest,
  open,
  onClose,
  onClaim,
  isClaiming,
}: {
  quest: BookQuest | null;
  open: boolean;
  onClose: () => void;
  onClaim: (quest: BookQuest) => void;
  isClaiming: boolean;
}) {
  const { data, isLoading } = useBookQuestDetail(quest?.book_quest_id, open && Boolean(quest));
  const displayQuest = data && quest ? { ...quest, ...data } : data || quest;
  const status = displayQuest ? getStatus(displayQuest) : null;
  const canClaim = Boolean(displayQuest?.is_claimable) && !displayQuest?.claim?.is_claimed;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      zIndex={2200}
      styles={{ body: { maxHeight: "calc(100vh - 170px)", overflowY: "auto" } }}
      title={
        displayQuest ? (
          <div className="flex min-w-0 items-center gap-3 pr-8">
            <span className="rounded-md border border-red-100 bg-red-50 px-2 py-1 text-xs font-medium text-red-500">
              ID: {displayQuest.book_quest_id}
            </span>
            <span className="truncate text-base font-semibold text-gray-800">{displayQuest.name}</span>
          </div>
        ) : "รายละเอียดภารกิจ"
      }
    >
      {isLoading || !displayQuest ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <div className="space-y-5 pt-3 font-primary">
          <section className="rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/70 to-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                {displayQuest.book?.img ? (
                  <Image
                    src={displayQuest.book.img}
                    alt={displayQuest.book.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <BookOpen className="absolute inset-0 m-auto h-7 w-7 text-gray-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-red-500">หนังสือของภารกิจ</p>
                <h3 className="mt-1 line-clamp-1 text-xl font-semibold text-gray-900">
                  {displayQuest.book?.title || displayQuest.book?.name || displayQuest.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm font-normal leading-6 text-gray-500">
                  {getQuestDescription(displayQuest)}
                </p>
                <div className="mt-3 rounded-xl border border-gray-100 bg-white/90 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      ความคืบหน้าภารกิจ {getProgressLabel(displayQuest)}
                    </span>
                    {status ? (
                      <span className={`rounded-full border px-3 py-1 ${status.className}`}>{status.label}</span>
                    ) : null}
                  </div>
                  <Progress
                    percent={clampPercent(displayQuest.progress?.percent)}
                    showInfo={false}
                    strokeColor="#ef334e"
                    trailColor="#eaecf0"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.82fr]">
            <section>
              <h4 className="mb-3 flex items-center gap-2 border-b border-red-100 pb-3 text-sm font-semibold text-red-600">
                <Gift className="h-4 w-4" />
                ของรางวัลที่จะได้รับ ({displayQuest.reward_preview?.length || 0} รายการ)
              </h4>
              <div className="space-y-3">
                {(displayQuest.reward_preview || []).map((reward, index) => (
                  <RewardCard key={`${reward.reward_id ?? reward.item_type}-${index}`} reward={reward} />
                ))}
              </div>
            </section>

            {displayQuest.episodes?.length ? (
              <EpisodeChecklist episodes={displayQuest.episodes} />
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button onClick={onClose} className="font-primary">
              ปิดหน้าต่าง
            </Button>
            {canClaim ? (
              <Button
                type="primary"
                loading={isClaiming}
                onClick={() => onClaim(displayQuest)}
                className="border-none bg-red-500 font-primary shadow-none hover:!bg-red-600"
              >
                กดรับรางวัล
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function BookQuestSection({ bookId, isLoggedIn }: BookQuestSectionProps) {
  const { notification } = App.useApp();
  const [selectedQuest, setSelectedQuest] = React.useState<BookQuest | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const { data: quests = [], isLoading, isError } = useBookQuests(bookId, isLoggedIn);
  const claimMutation = useClaimBookQuestMutation(bookId);
  const claimableCount = quests.filter((quest) => quest.is_claimable && !quest.claim?.is_claimed).length;

  const handleClaim = async (quest: BookQuest) => {
    try {
      const response = await claimMutation.mutateAsync(quest);
      if (response?.code && response.code !== 200) {
        throw new Error(response.message || "ไม่สามารถรับรางวัลได้");
      }

      const rewards = response.data?.rewards || [];
      notification.success({
        message: "รับรางวัลสำเร็จ",
        description: rewards.length
          ? rewards.map((reward) => `${reward.amount.toLocaleString()} ${reward.item_type.replace(/_/g, " ")}`).join(", ")
          : "ระบบอัปเดตสถานะภารกิจเรียบร้อยแล้ว",
        placement: "topRight",
      });
      setSelectedQuest(null);
    } catch (error: any) {
      notification.error({
        message: "ไม่สามารถรับรางวัลได้",
        description: error?.response?.data?.message || error?.message || "กรุณาลองใหม่อีกครั้ง",
        placement: "topRight",
      });
    }
  };

  if (!isLoggedIn || isError) return null;
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }
  if (!quests.length) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-3 w-3 shrink-0 rounded-full bg-red-500" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-6 text-red-600">รายการภารกิจทั้งหมด</h2>
            <p className="truncate text-xs font-normal text-gray-500">
              คลิกเพื่อดูเงื่อนไขและรับรางวัลจากการอ่าน
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {claimableCount > 0 ? (
            <span className="hidden rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 sm:inline-flex">
              รับได้ {claimableCount} ภารกิจ
            </span>
          ) : null}
          <ChevronDown className={`h-4 w-4 text-red-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-red-50 bg-[#fffdfd] p-4">
          {quests.map((quest) => (
            <BookQuestCard
              key={quest.book_quest_id}
              quest={quest}
              onClaim={handleClaim}
              onOpenDetail={setSelectedQuest}
              isClaiming={claimMutation.isPending && claimMutation.variables?.book_quest_id === quest.book_quest_id}
            />
          ))}
        </div>
      ) : null}

      <BookQuestDetailModal
        quest={selectedQuest}
        open={Boolean(selectedQuest)}
        onClose={() => setSelectedQuest(null)}
        onClaim={handleClaim}
        isClaiming={claimMutation.isPending}
      />
    </section>
  );
}
