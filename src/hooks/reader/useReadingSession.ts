import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { createReadingSession } from '@/features/read/readingSession';
import { useSocket } from '@/providers/SocketProvider';
import {
  endReadingSession,
  fetchActiveReadingSessions,
  takeoverReadingSession,
} from '@/services/apiServices';
import { useAuthStore } from '@/stores/authStore';

const getCurrentDeviceId = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('x-device-id') || '';
};

export function useReadingSession(bookId: string, episodeId: string, user: any) {
  const { socket } = useSocket();
  const currentDeviceId = getCurrentDeviceId();
  const session = useMemo(() => createReadingSession({
    bookId,
    episodeId,
    currentDeviceId,
    gateway: {
      end: endReadingSession,
      fetchActive: fetchActiveReadingSessions,
      takeover: takeoverReadingSession,
    },
    onLogout: () => useAuthStore.getState().logout(),
  }), [bookId, currentDeviceId, episodeId]);
  const state = useSyncExternalStore(session.subscribe, session.getState, session.getState);

  useEffect(() => {
    if (!bookId || !episodeId || !user) return;

    const handleEndSession = () => {
      void session.end();
    };

    window.addEventListener('beforeunload', handleEndSession);
    window.addEventListener('pagehide', handleEndSession);

    return () => {
      window.removeEventListener('beforeunload', handleEndSession);
      window.removeEventListener('pagehide', handleEndSession);
      handleEndSession();
    };
  }, [bookId, episodeId, session, user]);

  useEffect(() => {
    if (!socket || !bookId || !episodeId) return;

    const handleRemoteConflict = (payload: unknown) => {
      session.receiveRemoteConflict(payload);
    };
    const handleDeviceLogout = (payload: unknown) => {
      void session.receiveDeviceLogout(payload);
    };

    socket.on('reading:conflict', handleRemoteConflict);
    socket.on('reading:session_taken_over', handleRemoteConflict);
    socket.on('auth:device_logged_out', handleDeviceLogout);

    return () => {
      socket.off('reading:conflict', handleRemoteConflict);
      socket.off('reading:session_taken_over', handleRemoteConflict);
      socket.off('auth:device_logged_out', handleDeviceLogout);
    };
  }, [bookId, episodeId, session, socket]);

  return {
    isConflict: state.isConflict,
    conflictData: state.conflictData,
    handleConflict: session.reportConflict,
    takeover: session.takeover,
    fetchSessions: session.refresh,
  };
}
