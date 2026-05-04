export interface ClaimableRankRewardSnapshot {
  count: number;
  signature: string;
  tokens: string[];
}

export const normalizeRankTruthy = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'y' || normalized === 'yes';
  }
  return false;
};

export const cleanNavbarRankToken = (token?: string | null, cookieToken?: string | null) => {
  const rawToken = token || cookieToken || '';
  return rawToken.replace(/^['"]+|['"]+$/g, '').trim();
};

export const getClaimableRankRewardSnapshot = (data: unknown): ClaimableRankRewardSnapshot => {
  const ranks = Array.isArray((data as any)?.ranks) ? (data as any).ranks : [];
  const claimableTokens = new Set<string>();

  ranks.forEach((rank: any, rankIndex: number) => {
    const rankCanClaim = normalizeRankTruthy(rank?.can_claim);
    const rankGrantId = rank?.grant_id;
    const normalizedRankGrantId = rankGrantId !== null && rankGrantId !== undefined && String(rankGrantId).trim() !== ''
      ? String(rankGrantId)
      : '';

    if (rankCanClaim) {
      if (normalizedRankGrantId) {
        claimableTokens.add(`grant:${normalizedRankGrantId}`);
      } else {
        claimableTokens.add(`rank:${rank?.rank_id ?? rankIndex}`);
      }
    }

    const rewards = Array.isArray(rank?.rewards) ? rank.rewards : [];
    rewards.forEach((reward: any, rewardIndex: number) => {
      if (!normalizeRankTruthy(reward?.can_claim)) return;
      const rewardGrantId = reward?.grant_id ?? rankGrantId;
      const normalizedRewardGrantId = rewardGrantId !== null && rewardGrantId !== undefined && String(rewardGrantId).trim() !== ''
        ? String(rewardGrantId)
        : '';
      if (normalizedRewardGrantId) {
        claimableTokens.add(`grant:${normalizedRewardGrantId}`);
      } else {
        claimableTokens.add(`reward:${rank?.rank_id ?? rankIndex}:${reward?.id ?? rewardIndex}`);
      }
    });

    if (normalizeRankTruthy(rank?.noti_rewards) && claimableTokens.size === 0) {
      claimableTokens.add(`noti-rank:${rank?.rank_id ?? rankIndex}`);
    }
  });

  if (normalizeRankTruthy((data as any)?.noti_rewards) && claimableTokens.size === 0) {
    claimableTokens.add('noti_rewards');
  }

  const tokens = Array.from(claimableTokens).sort();
  const signature = tokens.join('|');

  return {
    count: tokens.length,
    signature,
    tokens,
  };
};

export const getCurrentRank = (rankData: any) => {
  const ranks = Array.isArray(rankData?.ranks) ? rankData.ranks : [];
  return ranks.find((rank: any) => rank.is_current_rank) ?? ranks[0] ?? null;
};

export const getHasRankRewardNotification = (rankData: any) => {
  const ranks = Array.isArray(rankData?.ranks) ? rankData.ranks : [];
  const hasNoti = Boolean(rankData?.noti_rewards) || ranks.some((rank: any) => Boolean(rank.noti_rewards));
  const hasClaimable = ranks.some((rank: any) => (
    Boolean(rank.can_claim) || (Array.isArray(rank.rewards) && rank.rewards.some((reward: any) => Boolean(reward?.can_claim)))
  ));

  return hasNoti || hasClaimable;
};

export const getRankRpValue = (rankData: any, user: any) =>
  Number(rankData?.total_rp ?? user?.current_rp ?? user?.total_rp ?? 0);
