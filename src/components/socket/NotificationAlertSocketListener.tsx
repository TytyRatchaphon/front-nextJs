"use client";
import Image from "next/image";

import * as React from "react";
import { App } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query";

import { useSocket } from "@/providers/SocketProvider";
import { useAuthStore } from "@/stores/authStore";

type NotificationAlertStatus = "success" | "warning" | "error" | "info";

type NotificationAlertPayload = {
  type?: string;
  status?: NotificationAlertStatus;
  message?: string;
  img?: string | null;
  data?: {
    reward_ep_ids?: unknown;
    [key: string]: unknown;
  } | null;
};

const normalizeAlertStatus = (status?: string): NotificationAlertStatus => (
  status === "success" || status === "warning" || status === "error" || status === "info"
    ? status
    : "info"
);

const getRewardEpisodeIds = (payload?: NotificationAlertPayload): number[] => {
  const rewardEpIds = payload?.data?.reward_ep_ids;
  if (!Array.isArray(rewardEpIds)) return [];

  return rewardEpIds
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
};

const markEpisodePurchased = (episode: any, rewardEpisodeIds: Set<number>) => {
  const episodeId = Number(episode?.ep_id ?? episode?.epID);
  if (!Number.isFinite(episodeId) || !rewardEpisodeIds.has(episodeId)) return episode;

  return {
    ...episode,
    isBuy: true,
    is_buy: true,
    purchased: true,
  };
};

const markRewardEpisodesInBookEpisodeCache = (cacheData: any, rewardEpIds: number[]) => {
  if (!cacheData || rewardEpIds.length === 0) return cacheData;
  const rewardEpisodeIds = new Set(rewardEpIds);

  if (Array.isArray(cacheData?.groups)) {
    return {
      ...cacheData,
      groups: cacheData.groups.map((group: any) => ({
        ...group,
        list: Array.isArray(group?.list)
          ? group.list.map((episode: any) => markEpisodePurchased(episode, rewardEpisodeIds))
          : group?.list,
      })),
    };
  }

  if (Array.isArray(cacheData?.data?.groups)) {
    return {
      ...cacheData,
      data: {
        ...cacheData.data,
        groups: cacheData.data.groups.map((group: any) => ({
          ...group,
          list: Array.isArray(group?.list)
            ? group.list.map((episode: any) => markEpisodePurchased(episode, rewardEpisodeIds))
            : group?.list,
        })),
      },
    };
  }

  return cacheData;
};

const markEpisodeContentPurchased = (cacheData: any, rewardEpId: number) => {
  if (!cacheData) return cacheData;
  const cachedEpId = Number(cacheData?.ep_id ?? cacheData?.epID ?? cacheData?.data?.ep_id ?? cacheData?.data?.epID);
  if (!Number.isFinite(cachedEpId) || cachedEpId !== rewardEpId) return cacheData;

  if (cacheData?.data && typeof cacheData.data === "object") {
    return {
      ...cacheData,
      data: {
        ...cacheData.data,
        isBuy: true,
        is_buy: true,
        purchased: true,
      },
    };
  }

  return {
    ...cacheData,
    isBuy: true,
    is_buy: true,
    purchased: true,
  };
};

export default function NotificationAlertSocketListener() {
  const { socket } = useSocket();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();

  React.useEffect(() => {
    if (!socket || !isLoggedIn) return;

    const markEpisodesAsPurchased = (rewardEpIds: number[]) => {
      if (rewardEpIds.length === 0) return;

      queryClient.setQueriesData(
        { queryKey: queryKeys.book.episodesRoot() },
        (cacheData: unknown) => markRewardEpisodesInBookEpisodeCache(cacheData, rewardEpIds),
      );

      rewardEpIds.forEach((epId) => {
        queryClient.setQueryData(
          queryKeys.read.episodeContent(epId),
          (cacheData: unknown) => markEpisodeContentPurchased(cacheData, epId),
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.read.episodeContent(epId), exact: true });
      });
    };

    const showAlert = (payload: NotificationAlertPayload) => {
      const status = normalizeAlertStatus(payload.status);
      const message = typeof payload.message === "string" && payload.message.trim()
        ? payload.message.trim()
        : "การแจ้งเตือน";
      const img = typeof payload.img === "string" && payload.img.trim() ? payload.img.trim() : null;

      notification[status]({
        key: `notification-alert-${payload.type || "general"}-${Date.now()}`,
        message,
        icon: img ? (
          <Image
            src={img || ''}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-contain"
            unoptimized
          />
        ) : undefined,
        placement: "topRight",
        duration: status === "error" ? 6 : 5,
      });
    };

    const handleNotificationAlert = (payload?: NotificationAlertPayload) => {
      if (!payload || typeof payload !== "object") return;

      showAlert(payload);

      if (payload.type === "ep_purchase_reward_granted") {
        markEpisodesAsPurchased(getRewardEpisodeIds(payload));
      }
    };

    socket.on("notification:alert", handleNotificationAlert);

    return () => {
      socket.off("notification:alert", handleNotificationAlert);
    };
  }, [isLoggedIn, notification, queryClient, socket]);

  return null;
}
