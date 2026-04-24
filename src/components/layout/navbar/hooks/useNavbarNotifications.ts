"use client";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { fetchAllNotifications } from "@/services/api/miscApi";
import { useSocket } from "@/providers/SocketProvider";
import { useAuthStore } from "@/stores/authStore";
import { queryKeys } from "@/constants/queryKeys";

export function useNavbarNotifications() {
  const { user, isLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { notification: api } = App.useApp();

  const { data: notificationResponse } = useQuery({
    queryKey: queryKeys.navbar.notifications(),
    queryFn: () => fetchAllNotifications(1, 5, 'all'),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    enabled: !!isLoggedIn && !!user,
    staleTime: 30000,
  });

  const notifications = notificationResponse?.notifications ?? [];
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.readed === 'N').length,
    [notifications],
  );

  useEffect(() => {
    if (!socket || !isLoggedIn) return;

    const joinRoom = () => {
      if (socket.connected) {
        socket.emit('join:notifications');
      }
    };

    if (isConnected) {
      joinRoom();
    }

    const handleNewNotification = (data: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navbar.notifications() });

      api.info({
        message: data.title || 'การแจ้งเตือนใหม่',
        description: data.message || 'คุณมีการแจ้งเตือนใหม่',
        placement: 'topRight',
        duration: 4,
        key: `noti-${Date.now()}`,
        style: { cursor: 'pointer' },
        onClick: () => {
          // Optional: Navigate to notification list or specific URL
        }
      });
    };

    const handleReadNotification = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navbar.notifications() });
    };

    const handleReadAllNotification = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.navbar.notifications() });
    };

    socket.on('connect', joinRoom);
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleReadNotification);
    socket.on('notification:read-all', handleReadAllNotification);

    const roomCheckInterval = setInterval(() => {
      if (socket.connected) {
        joinRoom();
      }
    }, 45000);

    return () => {
      clearInterval(roomCheckInterval);
      socket.off('connect', joinRoom);
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read', handleReadNotification);
      socket.off('notification:read-all', handleReadAllNotification);
    };
  }, [socket, isLoggedIn, isConnected, queryClient, api]);

  return { notifications, unreadCount };
}
