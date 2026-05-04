"use client";

import * as React from "react";
import { App } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useSocket } from "@/providers/SocketProvider";
import { fetchAllNotifications } from "@/services/api/miscApi";
import type { NotificationData } from "@/services/api/miscApi";

const NAVBAR_NOTIFICATIONS_QUERY_KEY = ["navbarNotifications"] as const;
const NOTIFICATION_ROOM_REFRESH_MS = 45_000;
const NAVBAR_NOTIFICATION_PREVIEW_LIMIT = 10;

type NavbarNotificationUser = {
  user_id?: string | number | null;
  id?: string | number | null;
  userId?: string | number | null;
} | null | undefined;

type SocketNotificationPayload = {
  title?: string;
  message?: string;
  body?: string;
};

type UseNavbarNotificationsParams = {
  isLoggedIn: boolean;
  user: NavbarNotificationUser;
};

const getNavbarNotificationUserId = (user: NavbarNotificationUser) => (
  user?.user_id ?? user?.id ?? user?.userId ?? null
);

export const getNavbarUnreadNotificationCount = (notifications: NotificationData[]) => (
  notifications.filter((notification) => notification.readed === "N").length
);

export const formatNavbarNotificationBadgeCount = (count: number) => (
  count > 9 ? "9+" : String(Math.max(0, count))
);

export function useNavbarNotifications({ isLoggedIn, user }: UseNavbarNotificationsParams) {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { notification: notificationApi } = App.useApp();
  const userId = getNavbarNotificationUserId(user);

  const {
    data: notificationResponse,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: NAVBAR_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => fetchAllNotifications(1, NAVBAR_NOTIFICATION_PREVIEW_LIMIT, "all"),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    enabled: !!isLoggedIn && !!userId,
    staleTime: 30_000,
  });

  const notifications = notificationResponse?.notifications ?? [];
  const unreadCount = getNavbarUnreadNotificationCount(notifications);

  const refreshNotifications = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: NAVBAR_NOTIFICATIONS_QUERY_KEY });
    void refetchNotifications();
  }, [queryClient, refetchNotifications]);

  React.useEffect(() => {
    if (!socket || !isLoggedIn || !userId) return;

    const joinNotificationRoom = () => {
      if (!socket.connected) return;

      socket.emit("join:notifications");
    };

    joinNotificationRoom();

    const handleNewNotification = (payload?: SocketNotificationPayload) => {
      refreshNotifications();

      notificationApi.info({
        message: payload?.title || "การแจ้งเตือนใหม่",
        description: payload?.message || payload?.body || "คุณมีการแจ้งเตือนใหม่",
        placement: "topRight",
        duration: 4,
        key: `noti-${Date.now()}`,
        style: { cursor: "pointer" },
      });
    };

    const handleNotificationChanged = () => {
      refreshNotifications();
    };

    socket.on("connect", joinNotificationRoom);
    socket.io.on("reconnect", joinNotificationRoom);
    socket.on("notification:new", handleNewNotification);
    socket.on("notification:read", handleNotificationChanged);
    socket.on("notification:read-all", handleNotificationChanged);

    const roomRefreshTimer = window.setInterval(joinNotificationRoom, NOTIFICATION_ROOM_REFRESH_MS);

    return () => {
      window.clearInterval(roomRefreshTimer);
      socket.off("connect", joinNotificationRoom);
      socket.io.off("reconnect", joinNotificationRoom);
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:read", handleNotificationChanged);
      socket.off("notification:read-all", handleNotificationChanged);
    };
  }, [isConnected, isLoggedIn, notificationApi, refreshNotifications, socket, userId]);

  return {
    notifications,
    unreadCount,
  };
}
