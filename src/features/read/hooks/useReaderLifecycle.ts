import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import {
  createReaderLifecycle,
  type ReaderLifecycleSocket,
} from '@/features/read/readerLifecycle';
import { createReadingProgress } from '@/features/read/readingProgress';
import { createReadingSession } from '@/features/read/readingSession';
import { useSocket } from '@/providers/SocketProvider';
import {
  endReadingSession,
  fetchActiveReadingSessions,
  syncReadingProgress,
  takeoverReadingSession,
  updateReadingProgress,
} from '@/services/apiServices';
import { useAuthStore } from '@/stores/authStore';

const getCurrentDeviceId = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('x-device-id') || '';
};

export function useReaderLifecycle(bookId: string, episodeId: string, authenticatedUser: unknown) {
  const { socket } = useSocket();
  const [showNav, setShowNav] = useState(true);
  const contentRef = useRef<HTMLElement>(null);
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

  const progress = useMemo(() => createReadingProgress({
    bookId,
    episodeId,
    viewport: {
      waitUntilStable: () => new Promise((resolve) => window.setTimeout(resolve, 500)),
      read: () => {
        const element = contentRef.current;
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        return {
          elementTop: rect.top + window.scrollY,
          elementHeight: element.scrollHeight,
          viewportHeight: window.innerHeight,
          scrollY: window.scrollY,
        };
      },
      scrollTo: (top) => window.scrollTo({ top, behavior: 'smooth' }),
    },
    persistence: {
      restore: async (currentEpisodeId) => {
        const response = await syncReadingProgress(currentEpisodeId);
        return response?.status === 'success' && typeof response.progress === 'number'
          ? response.progress
          : undefined;
      },
      save: updateReadingProgress,
    },
    onConflict: session.reportConflict,
  }), [bookId, episodeId, session]);

  const lifecycle = useMemo(() => createReaderLifecycle({
    browser: {
      addEventListener: (event, listener) => window.addEventListener(event, listener),
      removeEventListener: (event, listener) => window.removeEventListener(event, listener),
      clearInterval: (handle) => window.clearInterval(handle as number),
      clearTimeout: (handle) => window.clearTimeout(handle as number),
      isDocumentActive: () => (
        document.visibilityState === 'visible' && document.hasFocus()
      ),
      setInterval: (callback, delay) => window.setInterval(callback, delay),
      setTimeout: (callback, delay) => window.setTimeout(callback, delay),
    },
    onProgressCaptured: (currentProgress) => {
      if (currentProgress >= 0.99) setShowNav(true);
    },
    progress,
    session,
  }), [progress, session]);
  const previousLifecycleRef = useRef<ReturnType<typeof createReaderLifecycle> | null>(null);
  const lifecycleTransitionRef = useRef<Promise<void>>(Promise.resolve());

  const state = useSyncExternalStore(session.subscribe, session.getState, session.getState);
  const isAuthenticatedLifecycle = Boolean(bookId && episodeId && authenticatedUser);

  useEffect(() => {
    if (!isAuthenticatedLifecycle) return;
    const previousLifecycle = previousLifecycleRef.current;
    previousLifecycleRef.current = lifecycle;
    let isCancelled = false;
    lifecycleTransitionRef.current = lifecycleTransitionRef.current
      .then(async () => {
        if (previousLifecycle && previousLifecycle !== lifecycle) {
          await previousLifecycle.finishStop();
        }
        if (!isCancelled) await lifecycle.start();
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
      void lifecycle.stop();
    };
  }, [isAuthenticatedLifecycle, lifecycle]);

  useEffect(() => {
    if (!isAuthenticatedLifecycle) return;
    lifecycle.setSocket(socket as ReaderLifecycleSocket | null);

    return () => lifecycle.setSocket(null);
  }, [isAuthenticatedLifecycle, lifecycle, socket]);

  return {
    conflictData: state.conflictData,
    contentRef,
    fetchSessions: session.refresh,
    isConflict: state.isConflict,
    setShowNav,
    showNav,
    takeover: lifecycle.takeover,
  };
}
