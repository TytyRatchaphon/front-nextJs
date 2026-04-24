"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { App } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { fetchAllRanksData } from "@/services/api/userApi";
import { useAuthStore } from "@/stores/authStore";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getNavbarRankQueryKey } from "@/utils/rankRefresh";

interface ClaimableRankRewardSnapshot {
  count: number;
  signature: string;
  tokens: string[];
}

export function useNavbarRank() {
  const { user, isLoggedIn, token } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const { notification: api } = App.useApp();

  const rankQueryKey = React.useMemo(
    () => getNavbarRankQueryKey(user?.user_id),
    [user?.user_id],
  );

  const cleanRankToken = React.useMemo(() => {
    const rawToken = token || Cookies.get('token') || '';
    return rawToken.replace(/^['\"]+|['\"]+$/g, '').trim();
  }, [token]);

  const { data: rankData } = useQuery({
    queryKey: rankQueryKey,
    queryFn: async () => {
      if (!cleanRankToken) {
        throw new Error('Missing rank auth token');
      }
      const result = await fetchAllRanksData(cleanRankToken);
      if (!result) {
        throw new Error('Failed to fetch /rank/all');
      }
      return result;
    },
    enabled: !!isLoggedIn && !!cleanRankToken,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    retry: 1,
  });

  const getClaimableRankRewardSnapshot = React.useCallback((data: unknown): ClaimableRankRewardSnapshot => {
    const ranks = Array.isArray((data as any)?.ranks) ? (data as any).ranks : [];

    const isTruthy = (value: unknown) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value === 1;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'y' || normalized === 'yes';
      }
      return false;
    };

    const claimableTokens = new Set<string>();

    ranks.forEach((rank: any, rankIndex: number) => {
      const rankCanClaim = isTruthy(rank?.can_claim);
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
        if (!isTruthy(reward?.can_claim)) return;
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

      if (isTruthy(rank?.noti_rewards) && claimableTokens.size === 0) {
        claimableTokens.add(`noti-rank:${rank?.rank_id ?? rankIndex}`);
      }
    });

    if (isTruthy((data as any)?.noti_rewards) && claimableTokens.size === 0) {
      claimableTokens.add('noti_rewards');
    }

    const tokens = Array.from(claimableTokens).sort();
    const signature = tokens.join('|');
    return { count: tokens.length, signature, tokens };
  }, []);

  const claimableRankRewardSnapshot = React.useMemo(
    () => getClaimableRankRewardSnapshot(rankData),
    [getClaimableRankRewardSnapshot, rankData],
  );

  const rankRewardSnapshotStateRef = React.useRef<{ initialized: boolean; tokens: string[] }>({
    initialized: false,
    tokens: [],
  });
  const lastRankRewardNotificationKeyRef = React.useRef<string>('');

  const currentRank = React.useMemo(() => {
    const ranks = Array.isArray(rankData?.ranks) ? rankData.ranks : [];
    return ranks.find((rank) => rank.is_current_rank) ?? ranks[0] ?? null;
  }, [rankData]);

  const hasRankRewardNotification = React.useMemo(() => {
    const ranks = Array.isArray(rankData?.ranks) ? rankData.ranks : [];
    const hasNoti = Boolean(rankData?.noti_rewards) || ranks.some((rank) => Boolean(rank.noti_rewards));
    const hasClaimable = ranks.some((rank) => (
      Boolean(rank.can_claim) || (Array.isArray(rank.rewards) && rank.rewards.some((reward) => Boolean(reward?.can_claim)))
    ));
    return hasNoti || hasClaimable;
  }, [rankData]);

  const rpValue = Number(rankData?.total_rp ?? user?.current_rp ?? user?.total_rp ?? 0);

  const navigateToRankRewards = React.useCallback((closeMenus?: () => void) => {
    closeMenus?.();
    const targetPath = `/mprofile?openRankShowcase=1&rankRefreshTs=${Date.now()}`;
    if (pathname === '/mprofile') {
      router.replace(targetPath, { scroll: false });
      return;
    }
    router.push(targetPath);
  }, [pathname, router]);

  // Toast notification when new claimable rewards appear
  React.useEffect(() => {
    if (!isLoggedIn) {
      rankRewardSnapshotStateRef.current = { initialized: false, tokens: [] };
      return;
    }

    const currentTokens = claimableRankRewardSnapshot.tokens;
    const previousState = rankRewardSnapshotStateRef.current;

    if (!previousState.initialized) {
      rankRewardSnapshotStateRef.current = { initialized: true, tokens: currentTokens };
      return;
    }

    const previousTokenSet = new Set(previousState.tokens);
    const addedTokens = currentTokens.filter((tokenValue) => !previousTokenSet.has(tokenValue));
    rankRewardSnapshotStateRef.current = { initialized: true, tokens: currentTokens };

    if (addedTokens.length === 0 || claimableRankRewardSnapshot.count <= 0) return;

    const notificationIdentity = addedTokens.slice().sort().join('|');
    if (lastRankRewardNotificationKeyRef.current === notificationIdentity) return;
    lastRankRewardNotificationKeyRef.current = notificationIdentity;

    api.success({
      key: `rank-profile-refresh-${Date.now()}`,
      message: 'ยินดีด้วย!',
      description: `มีของรางวัลใหม่ที่รับได้ ${claimableRankRewardSnapshot.count.toLocaleString()} รายการ (กดเพื่อไปที่หน้าของฉัน)`,
      placement: 'topRight',
      duration: 4.5,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      style: { cursor: 'pointer' },
      onClick: () => navigateToRankRewards(),
    });
  }, [api, claimableRankRewardSnapshot, isLoggedIn, navigateToRankRewards]);

  return {
    rankData,
    currentRank,
    hasRankRewardNotification,
    rpValue,
    navigateToRankRewards,
  };
}
