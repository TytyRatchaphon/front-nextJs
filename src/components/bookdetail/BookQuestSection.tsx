"use client";

import * as React from "react";
import { App, Button, Modal, Progress, Skeleton } from "antd";
import { Gift, Info, Sparkles, Trophy } from "lucide-react";
import { useBookQuestDetail, useBookQuests, useClaimBookQuestMutation } from "@/hooks/book/useBookQuest";
import type { BookQuest, BookQuestRewardPreview } from "@/services/api/bookQuestApi";

type BookQuestSectionProps = {
  bookId: number | string;
  isLoggedIn: boolean;
};

const formatReward = (reward: BookQuestRewardPreview) => {
  const amount = Number(reward.amount || 0);
  const itemType = String(reward.item_type || "").replace(/_/g, " ");

  if (reward.item_type === "cashback_wallet") {
    const cashbackPercent = Number((reward.config as any)?.cashback_percent || 0);
    return cashbackPercent > 0 ? `Cashback ${cashbackPercent}%` : "Cashback";
  }

  return amount > 0 ? `${amount.toLocaleString()} ${itemType}` : itemType || "รางวัล";
};

const getQuestDescription = (quest: BookQuest) => {
  if (quest.description) return quest.description;
  if (quest.quest_condition_type === "BUY_EP_RANGE_COUNT") {
    return "ซื้อ EP ตามช่วงที่กำหนดให้ครบเพื่อรับรางวัล";
  }
  if (quest.quest_condition_type === "COMPLETE_ALL_PAID_EPISODES") {
    return "ซื้อ paid EP ทั้งหมดของเล่มนี้เพื่อรับรางวัล";
  }
  return `ซื้อ EP ในเล่มนี้ให้ครบ ${quest.progress?.target_value ?? quest.target_value ?? 0} ตอน`;
};

const QuestRewardChips = ({ rewards }: { rewards: BookQuestRewardPreview[] }) => {
  if (!rewards.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {rewards.slice(0, 3).map((reward, index) => (
        <span
          key={`${reward.item_type}-${reward.item_id ?? index}`}
          className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
        >
          <Gift className="h-3.5 w-3.5" />
          {formatReward(reward)}
        </span>
      ))}
    </div>
  );
};

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
  const progress = quest.progress;
  const isClaimed = Boolean(quest.claim?.is_claimed);
  const canClaim = Boolean(quest.is_claimable) && !isClaimed;

  return (
    <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white via-white to-red-50/60 p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
              <Sparkles className="h-3.5 w-3.5" />
              Book Quest
            </span>
            {isClaimed ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                รับแล้ว
              </span>
            ) : canClaim ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
                รับรางวัลได้
              </span>
            ) : null}
          </div>
          <h3 className="text-base font-bold leading-relaxed text-gray-900">{quest.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-sm leading-relaxed text-gray-500">{getQuestDescription(quest)}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            type="text"
            icon={<Info className="h-4 w-4" />}
            onClick={() => onOpenDetail(quest)}
            className="font-primary text-gray-600 hover:!text-red-600"
          >
            รายละเอียด
          </Button>
          <Button
            type="primary"
            disabled={!canClaim}
            loading={isClaiming}
            onClick={() => onClaim(quest)}
            className="border-none bg-red-600 font-primary shadow-none hover:!bg-red-700 disabled:!bg-gray-200"
          >
            {isClaimed ? "รับแล้ว" : "รับรางวัล"}
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>
              ความคืบหน้า {Number(progress?.progress_value || 0).toLocaleString()} /{" "}
              {Number(progress?.target_value || 0).toLocaleString()}
            </span>
            <span>{Number(progress?.percent || 0)}%</span>
          </div>
          <Progress
            percent={Math.min(100, Math.max(0, Number(progress?.percent || 0)))}
            showInfo={false}
            strokeColor="#ef334e"
            trailColor="#fee2e2"
          />
        </div>
        <QuestRewardChips rewards={quest.reward_preview || []} />
      </div>
    </div>
  );
}

function BookQuestDetailModal({
  bookId,
  quest,
  open,
  onClose,
  onClaim,
  isClaiming,
}: {
  bookId: number | string;
  quest: BookQuest | null;
  open: boolean;
  onClose: () => void;
  onClaim: (quest: BookQuest) => void;
  isClaiming: boolean;
}) {
  const { data, isLoading } = useBookQuestDetail(quest?.book_quest_id, open && Boolean(quest));
  const displayQuest = data && quest ? { ...quest, ...data } : data || quest;
  const isClaimed = Boolean(displayQuest?.claim?.is_claimed);
  const canClaim = Boolean(displayQuest?.is_claimable) && !isClaimed;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={560}
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Trophy className="h-5 w-5 text-red-600" />
          รายละเอียด Book Quest
        </div>
      }
    >
      {isLoading || !displayQuest ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : (
        <div className="space-y-5 pt-2 font-primary">
          <div>
            <h3 className="text-xl font-bold leading-relaxed text-gray-900">{displayQuest.name}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">{getQuestDescription(displayQuest)}</p>
          </div>

          <div className="rounded-2xl bg-red-50 p-4">
            <div className="mb-2 flex justify-between text-sm font-semibold text-red-700">
              <span>ความคืบหน้า</span>
              <span>
                {Number(displayQuest.progress?.progress_value || 0).toLocaleString()} /{" "}
                {Number(displayQuest.progress?.target_value || 0).toLocaleString()}
              </span>
            </div>
            <Progress
              percent={Math.min(100, Math.max(0, Number(displayQuest.progress?.percent || 0)))}
              strokeColor="#ef334e"
              trailColor="#fecdd3"
            />
          </div>

          {Array.isArray(displayQuest.episodes) && displayQuest.episodes.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-bold text-gray-800">ตอนที่เกี่ยวข้อง</p>
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
                {displayQuest.episodes.map((episode) => (
                  <div key={`${bookId}-${episode.ep_id}`} className="text-sm text-gray-600">
                    {episode.name}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-bold text-gray-800">รางวัล</p>
            <QuestRewardChips rewards={displayQuest.reward_preview || []} />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button onClick={onClose} className="font-primary">
              ปิด
            </Button>
            <Button
              type="primary"
              disabled={!canClaim}
              loading={isClaiming}
              onClick={() => onClaim(displayQuest)}
              className="border-none bg-red-600 font-primary hover:!bg-red-700 disabled:!bg-gray-200"
            >
              {isClaimed ? "รับแล้ว" : "รับรางวัล"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function BookQuestSection({ bookId, isLoggedIn }: BookQuestSectionProps) {
  const { notification } = App.useApp();
  const [selectedQuest, setSelectedQuest] = React.useState<BookQuest | null>(null);
  const [showAll, setShowAll] = React.useState(false);
  const { data: quests = [], isLoading, isError } = useBookQuests(bookId, isLoggedIn);
  const claimMutation = useClaimBookQuestMutation(bookId);
  const visibleQuests = showAll ? quests : quests.slice(0, 2);
  const hiddenQuestCount = Math.max(0, quests.length - visibleQuests.length);

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

  if (!isLoggedIn) return null;
  if (isError) return null;
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    );
  }
  if (!quests.length) return null;

  return (
    <section className="space-y-3 rounded-[18px] border border-red-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500">Book Quest</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900">ภารกิจประจำเล่ม</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
            {quests.length.toLocaleString()} ภารกิจ
          </span>
          {quests.length > 2 ? (
            <Button
              type="text"
              onClick={() => setShowAll((value) => !value)}
              className="h-8 rounded-full px-3 font-primary text-xs font-semibold text-red-600 hover:!bg-red-50 hover:!text-red-700"
            >
              {showAll ? "ย่อ" : `ดูทั้งหมด`}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {visibleQuests.map((quest) => (
          <BookQuestCard
            key={quest.book_quest_id}
            quest={quest}
            onClaim={handleClaim}
            onOpenDetail={setSelectedQuest}
            isClaiming={claimMutation.isPending && claimMutation.variables?.book_quest_id === quest.book_quest_id}
          />
        ))}
      </div>

      {hiddenQuestCount > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-2xl border border-dashed border-red-200 bg-red-50/60 px-4 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
        >
          ดูเพิ่มอีก {hiddenQuestCount.toLocaleString()} ภารกิจ
        </button>
      ) : null}

      <BookQuestDetailModal
        bookId={bookId}
        quest={selectedQuest}
        open={Boolean(selectedQuest)}
        onClose={() => setSelectedQuest(null)}
        onClaim={handleClaim}
        isClaiming={claimMutation.isPending}
      />
    </section>
  );
}
