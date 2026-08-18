import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { fetchMyVideoStatus } from '@/services/api/bookVideoApi';
import { BookVideoStatus, SocketBookVideoUpdate } from '@/types/bookVideo';

interface UseBookVideoSocketOptions {
  bookId: number;
  videoId: number | null;
  enabled: boolean;
  onUpdate?: (update: SocketBookVideoUpdate) => void;
}

const TERMINAL_STATUSES: BookVideoStatus[] = ['completed', 'failed', 'cancelled', 'deleted'];

export function useBookVideoSocket({
  bookId,
  videoId,
  enabled,
  onUpdate,
}: UseBookVideoSocketOptions) {
  const { socket, isConnected } = useSocket();
  const [statusInfo, setStatusInfo] = useState<SocketBookVideoUpdate | null>(null);
  const [isTerminal, setIsTerminal] = useState(false);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled || !videoId) {
      setIsTerminal(false);
      setStatusInfo(null);
      return;
    }

    let isSubscribed = true;
    let pollInterval: NodeJS.Timeout | null = null;

    // 1. Initial snapshot fetch via HTTP to prevent race conditions
    fetchMyVideoStatus(bookId, videoId)
      .then((data) => {
        if (!isSubscribed) return;
        const update: SocketBookVideoUpdate = {
          videoId: data.videoId,
          status: data.status as BookVideoStatus,
          progress: data.progressPercent || 0,
          stage: data.stage || null,
          updatedAt: new Date().toISOString(),
        };
        setStatusInfo(update);
        if (onUpdateRef.current) onUpdateRef.current(update);

        if (TERMINAL_STATUSES.includes(update.status)) {
          setIsTerminal(true);
        }
      })
      .catch((err) => {
        console.error('Error fetching initial video status snapshot:', err);
      });

    // 2. Socket listener setup
    if (socket && isConnected) {
      socket.emit('book_video:join', { videoId });

      const handleVideoUpdate = (payload: SocketBookVideoUpdate) => {
        if (!isSubscribed) return;
        if (payload.videoId === videoId) {
          setStatusInfo(payload);
          if (onUpdateRef.current) onUpdateRef.current(payload);

          if (TERMINAL_STATUSES.includes(payload.status)) {
            setIsTerminal(true);
            socket.emit('book_video:leave', { videoId });
          }
        }
      };

      socket.on('book_video:updated', handleVideoUpdate);

      return () => {
        isSubscribed = false;
        socket.off('book_video:updated', handleVideoUpdate);
        socket.emit('book_video:leave', { videoId });
        if (pollInterval) clearInterval(pollInterval);
      };
    } else {
      // 3. Fallback Polling if Socket is disconnected
      pollInterval = setInterval(async () => {
        try {
          const data = await fetchMyVideoStatus(bookId, videoId);
          if (!isSubscribed) return;
          const update: SocketBookVideoUpdate = {
            videoId: data.videoId,
            status: data.status as BookVideoStatus,
            progress: data.progressPercent || 0,
            stage: data.stage || null,
            updatedAt: new Date().toISOString(),
          };
          setStatusInfo(update);
          if (onUpdateRef.current) onUpdateRef.current(update);

          if (TERMINAL_STATUSES.includes(update.status)) {
            setIsTerminal(true);
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch (e) {
          console.error('Polling video status failed:', e);
        }
      }, 5000);

      return () => {
        isSubscribed = false;
        if (pollInterval) clearInterval(pollInterval);
      };
    }
  }, [bookId, videoId, enabled, socket, isConnected]);

  return {
    statusInfo,
    isTerminal,
  };
}
