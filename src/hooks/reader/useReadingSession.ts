import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/providers/SocketProvider';
import { useAuthStore } from '@/stores/authStore';
import {
  endReadingSession,
  takeoverReadingSession,
  fetchActiveReadingSessions,
  ReadingSessionActiveData,
  updateReadingProgress,
} from '@/services/apiServices';

const getCurrentDeviceId = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('x-device-id') || '';
};

const normalizeReadingConflictPayload = (payload: any) => {
  const currentDeviceId = getCurrentDeviceId();
  const activeDevicesRaw = Array.isArray(payload?.active_devices)
    ? payload.active_devices.filter(Boolean)
    : [];

  const activeDevice =
    payload?.active_device ||
    activeDevicesRaw.find((device: any) => device?.is_reading) ||
    null;

  return {
    sourceDeviceId: payload?.source_device_id || null,
    activeDevice,
    activeDevices: activeDevicesRaw.map((device: any) => ({
      device_id: String(device?.device_id || ""),
      user_agent: device?.user_agent || "",
      book_id: device?.book_id ?? null,
      ep_id: device?.ep_id ?? null,
      started_at: device?.started_at || "",
      last_seen_at: device?.last_seen_at || "",
      // ONLY rely on device_id to determine current device to prevent socket payloads from triggering false positives
      is_current_device: String(device?.device_id || "") === currentDeviceId,
      can_logout:
        String(device?.device_id || "") !== currentDeviceId &&
        device?.can_logout !== false,
      is_reading: device?.is_reading === true,
    })).filter((device: any) => device.device_id),
  };
};

export function useReadingSession(bookId: string, episodeId: string, user: any) {
  const { socket } = useSocket();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isConflict, setIsConflict] = useState(false);
  const [conflictData, setConflictData] = useState<ReadingSessionActiveData | null>(null);
  const [isSessionEnding, setIsSessionEnding] = useState(false);
  const currentProgressRef = useRef<number>(0);

  // Expose a method to update progress from scroll
  const updateProgressRef = useCallback((progress: number) => {
    currentProgressRef.current = progress;
  }, []);

  const fetchSessions = useCallback(async () => {
    const data = await fetchActiveReadingSessions();
    if (data) {
      const normalizedData = normalizeReadingConflictPayload(data);
      setConflictData({
        current_device: normalizedData.activeDevice,
        active_devices: normalizedData.activeDevices
      } as any);
    }
  }, []);

  const handleConflict = useCallback((data: any) => {
    setIsConflict(true);
    setConflictData(data);
  }, []);

  // Heartbeat - 30 seconds + Initial call
  useEffect(() => {
    if (!bookId || !episodeId || !user || isConflict) return;

    const performUpdate = async () => {
      // For interval calls, we might want to check visibility/focus,
      // but for the initial call, it's fine to just execute.
      try {
        await updateReadingProgress(bookId, episodeId, currentProgressRef.current);
      } catch (error: any) {
        if (error?.code === 409001 || error?.error_code === "READING_CONFLICT") {
          handleConflict(error.data);
        }
      }
    };

    // Initial call right when entering the page
    performUpdate();

    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        performUpdate();
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [bookId, episodeId, user, isConflict, handleConflict]);

  // Session end on unmount / pagehide
  useEffect(() => {
    if (!bookId || !episodeId || !user) return;

    const handleEndSession = () => {
      if (!isSessionEnding && !isConflict) {
        setIsSessionEnding(true);
        endReadingSession(bookId, episodeId);
      }
    };

    window.addEventListener('beforeunload', handleEndSession);
    window.addEventListener('pagehide', handleEndSession);

    return () => {
      window.removeEventListener('beforeunload', handleEndSession);
      window.removeEventListener('pagehide', handleEndSession);
      handleEndSession();
    };
  }, [bookId, episodeId, user, isSessionEnding, isConflict]);

  // Socket Listeners
  useEffect(() => {
    if (!socket || !bookId || !episodeId) return;

    const handleSocketConflict = (payload: any) => {
      try {
        const data = normalizeReadingConflictPayload(payload);
        const currentDeviceId = getCurrentDeviceId();

        // Ignore if the conflict source is this device itself
        if (data.sourceDeviceId && currentDeviceId && data.sourceDeviceId === currentDeviceId) {
          return;
        }

        handleConflict({
          current_device: data.activeDevice,
          active_devices: data.activeDevices
        });
      } catch (error) {
        console.error("[reading:conflict] handle failed", error);
        handleConflict({
          current_device: null,
          active_devices: []
        });
      }
    };

    const handleSessionTakenOver = (payload: any) => {
      try {
        const data = normalizeReadingConflictPayload(payload);
        const currentDeviceId = getCurrentDeviceId();

        // Check if another device took over
        if (data.sourceDeviceId && currentDeviceId && data.sourceDeviceId !== currentDeviceId) {
           handleConflict({
             current_device: data.activeDevice,
             active_devices: data.activeDevices
           });
        } else if (!data.sourceDeviceId) {
           handleConflict({
             current_device: data.activeDevice,
             active_devices: data.activeDevices
           });
        }
      } catch (error) {
        console.error("[reading:session_taken_over] handle failed", error);
        handleConflict({
          current_device: null,
          active_devices: []
        });
      }
    };

    const handleDeviceLoggedOut = (data: any) => {
      const currentDeviceId = getCurrentDeviceId();
      if (currentDeviceId && data?.target_device_id === currentDeviceId) {
        setIsConflict(true);
        useAuthStore.getState().logout();
        queryClient.clear();
        router.push('/');
      }
    };

    socket.on('reading:conflict', handleSocketConflict);
    socket.on('reading:session_taken_over', handleSessionTakenOver);
    socket.on('auth:device_logged_out', handleDeviceLoggedOut);

    return () => {
      socket.off('reading:conflict', handleSocketConflict);
      socket.off('reading:session_taken_over', handleSessionTakenOver);
      socket.off('auth:device_logged_out', handleDeviceLoggedOut);
    };
  }, [socket, bookId, episodeId, handleConflict]);

  const takeover = async () => {
    try {
      await takeoverReadingSession(bookId, episodeId);
      setIsConflict(false);
      setConflictData(null);
      // Heartbeat will automatically resume because isConflict is false
    } catch (error) {
      console.error('Takeover failed', error);
    }
  };

  return {
    isConflict,
    conflictData,
    handleConflict,
    takeover,
    updateProgressRef,
    fetchSessions
  };
}
