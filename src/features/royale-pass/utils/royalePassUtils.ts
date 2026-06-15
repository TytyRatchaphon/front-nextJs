import type {
  RoyalePassDetail,
  RoyalePassLevel,
  RoyalePassQuest,
  RoyalePassQuestScope,
  RoyalePassReward,
  RoyalePassTrack,
} from "@/services/api/royalePassApi";

export type RoyalePassRewardLevel = {
  level: number;
  requiredExp: number;
  freeRewards: RoyalePassReward[];
  premiumRewards: RoyalePassReward[];
};

const TH_DATE_FORMATTER = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const getPassBannerSrc = (pass: {
  banner_img?: string | null;
  pre_banner_img?: string | null;
}) => pass.banner_img || pass.pre_banner_img || "/images/banner.jpg";

export const formatPassDate = (value?: string | number | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return TH_DATE_FORMATTER.format(date);
};

export const formatPassDateRange = (start?: string | number | null, end?: string | number | null) => {
  const startText = formatPassDate(start);
  const endText = formatPassDate(end);
  if (startText === "-" && endText === "-") return "-";
  return `${startText} - ${endText}`;
};

export const formatCountdownToStart = (start?: string | number | null) => {
  if (!start) return "ยังไม่เริ่ม";
  const startTime = new Date(start).getTime();
  if (Number.isNaN(startTime)) return "ยังไม่เริ่ม";
  const diffMs = startTime - Date.now();
  if (diffMs <= 0) return "เริ่มแล้ว";
  const diffDays = Math.ceil(diffMs / 86_400_000);
  if (diffDays <= 1) return "เริ่มภายใน 1 วัน";
  return `เริ่มใน ${diffDays} วัน`;
};

export const getUserLevel = (detail: RoyalePassDetail | null | undefined) => {
  const userState = detail?.user_state as any;
  const userLvl = Number(userState?.current_level ?? userState?.level ?? 0);
  const detailLvl = Number((detail as any)?.level ?? detail?.current_level ?? 0);
  return userLvl > 0 ? userLvl : detailLvl;
};

export const getUserExp = (detail: RoyalePassDetail | null | undefined) => {
  const userState = detail?.user_state as any;
  const userExp = Number(userState?.current_exp ?? userState?.exp ?? 0);
  const detailExp = Number((detail as any)?.exp ?? detail?.current_exp ?? 0);
  return userExp > 0 ? userExp : detailExp;
};

export const getRewardImageSrc = (reward: RoyalePassReward) => {
  return reward.reward_image || reward.reward_image_url || null;
};

const asRewardArray = (value: unknown): RoyalePassReward[] => {
  return Array.isArray(value) ? value.filter(Boolean) as RoyalePassReward[] : [];
};

const getTrackRewards = (
  levelData: RoyalePassLevel,
  track: RoyalePassTrack,
): RoyalePassReward[] => {
  const tracks = levelData.tracks as Record<string, unknown> | undefined;
  const trackData = tracks?.[track] as Record<string, unknown> | undefined;
  const items = asRewardArray(trackData?.items);
  const isClaimed = Boolean(trackData?.is_claimed);
  const isUnlocked = Boolean(trackData?.is_unlocked);
  const level = Number(trackData?.level ?? levelData.level ?? 0);

  return items.map((reward) => ({
    ...reward,
    level: Number(reward.level ?? level),
    track: reward.track ?? track,
    is_claimed: Boolean(reward.is_claimed ?? isClaimed),
    is_claimable: Boolean(reward.is_claimable ?? (isUnlocked && !isClaimed)),
    is_unlocked: Boolean(reward.is_unlocked ?? isUnlocked),
  }));
};

export const buildRewardLevels = (detail: RoyalePassDetail | null | undefined): RoyalePassRewardLevel[] => {
  if (!detail) return [];

  const levelMap = new Map<number, RoyalePassRewardLevel>();
  const ensureLevel = (level: number, requiredExp = 0) => {
    const safeLevel = Number.isFinite(level) ? level : 0;
    const current = levelMap.get(safeLevel);
    if (current) {
      current.requiredExp = Math.max(current.requiredExp, requiredExp);
      return current;
    }
    const next = {
      level: safeLevel,
      requiredExp,
      freeRewards: [],
      premiumRewards: [],
    };
    levelMap.set(safeLevel, next);
    return next;
  };

  detail.levels.forEach((levelData) => {
    const level = Number(levelData.level ?? 0);
    const row = ensureLevel(level, Number(levelData.required_exp ?? 0));
    const rewards = levelData.rewards as Record<string, unknown> | undefined;

    row.freeRewards.push(...asRewardArray(levelData.free_rewards));
    row.premiumRewards.push(...asRewardArray(levelData.premium_rewards));
    row.freeRewards.push(...asRewardArray(rewards?.free));
    row.premiumRewards.push(...asRewardArray(rewards?.premium));
    row.freeRewards.push(...getTrackRewards(levelData, "free"));
    row.premiumRewards.push(...getTrackRewards(levelData, "premium"));
  });

  detail.rewards.forEach((reward) => {
    const row = ensureLevel(Number(reward.level ?? 0));
    if (reward.track === "premium") {
      row.premiumRewards.push(reward);
    } else {
      row.freeRewards.push(reward);
    }
  });

  return Array.from(levelMap.values()).sort((a, b) => a.level - b.level);
};

export const groupQuestsByScope = (quests: RoyalePassQuest[]) => {
  return quests.reduce<Record<RoyalePassQuestScope, RoyalePassQuest[]>>(
    (acc, quest) => {
      acc[quest.scope].push(quest);
      return acc;
    },
    { daily: [], weekly: [], season: [] },
  );
};

export const getClaimStateLabel = (reward: Pick<RoyalePassReward, "is_claimable" | "is_claimed" | "reward_type">) => {
  if (reward.is_claimed) return "รับแล้ว";
  if (reward.is_claimable) return "รับได้";
  if (reward.reward_type === "user_coupon") return "ดูรายละเอียด";
  return null;
};

export const getTrackLabel = (track: RoyalePassTrack) => {
  return track === "premium" ? "Premium" : "Free";
};
