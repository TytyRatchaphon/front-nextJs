"use client";

import * as React from "react";
import { App } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";

import { fetchAllRanksData } from "@/services/api/userApi";
import type { UserData } from "@/stores/authStore";
import { getNavbarRankQueryKey } from "@/utils/rankRefresh";
import {
  cleanNavbarRankToken,
  getClaimableRankRewardSnapshot,
  getCurrentRank,
  getHasRankRewardNotification,
  getRankRpValue,
} from "../navbarRankUtils";

type UseNavbarRankRewardsParams = {
  isLoggedIn: boolean;
  token?: string | null;
  user?: UserData | null;
  onNavigateToRankRewards: () => void;
};

export function useNavbarRankRewards({
  isLoggedIn,
  token,
  user,
  onNavigateToRankRewards,
}: UseNavbarRankRewardsParams) {
  const { notification: api } = App.useApp();
  const rankQueryKey = React.useMemo(
    () => getNavbarRankQueryKey(user?.user_id),
    [user?.user_id],
  );
  const cleanRankToken = React.useMemo(() => (
    cleanNavbarRankToken(token, Cookies.get("token"))
  ), [token]);

  const { data: rankData } = useQuery({
    queryKey: rankQueryKey,
    queryFn: async () => {
      if (!cleanRankToken) {
        throw new Error("Missing rank auth token");
      }
      const result = await fetchAllRanksData(cleanRankToken);
      if (!result) {
        throw new Error("Failed to fetch /rank/all");
      }
      return result;
    },
    enabled: !!isLoggedIn && !!cleanRankToken,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    retry: 1,
  });

  const claimableRankRewardSnapshot = React.useMemo(
    () => getClaimableRankRewardSnapshot(rankData),
    [rankData],
  );
  const rankRewardSnapshotStateRef = React.useRef<{ initialized: boolean; tokens: string[] }>({
    initialized: false,
    tokens: [],
  });
  const lastRankRewardNotificationKeyRef = React.useRef<string>("");

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

    const notificationIdentity = addedTokens.slice().sort().join("|");
    if (lastRankRewardNotificationKeyRef.current === notificationIdentity) return;
    lastRankRewardNotificationKeyRef.current = notificationIdentity;

    api.success({
      key: `rank-profile-refresh-${Date.now()}`,
      message: "ยินดีด้วย!",
      description: `มีของรางวัลใหม่ที่รับได้ ${claimableRankRewardSnapshot.count.toLocaleString()} รายการ (กดเพื่อไปที่หน้าของฉัน)`,
      placement: "topRight",
      duration: 4.5,
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      style: { cursor: "pointer" },
      onClick: onNavigateToRankRewards,
    });
  }, [api, claimableRankRewardSnapshot, isLoggedIn, onNavigateToRankRewards]);

  return {
    currentRank: getCurrentRank(rankData),
    hasRankRewardNotification: getHasRankRewardNotification(rankData),
    rpValue: getRankRpValue(rankData, user),
  };
}
