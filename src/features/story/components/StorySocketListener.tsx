import React, { useCallback, useEffect } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { useStoryStore } from '../stores/storyStore';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { storyApi } from '../services/storyApi';
import { message } from 'antd';
import { StoryUploadStatusType } from '../types/storyTypes';

interface StoryUploadProgressPayload {
  storyItemId: number;
  status: StoryUploadStatusType;
  progress?: number;
  stage?: string;
  error?: string;
}

const StorySocketListener = () => {
  const { socket, isConnected } = useSocket();
  const activeUploadId = useStoryStore((state) => state.activeUploadId);
  const setUploadState = useStoryStore((state) => state.setUploadState);
  const resetUpload = useStoryStore((state) => state.resetUpload);
  const uploadStatus = useStoryStore((state) => state.uploadStatus);
  const queryClient = useQueryClient();

  const applyUploadStatus = useCallback((update: {
    status: StoryUploadStatusType;
    progress?: number;
    stage?: string;
    error?: string | null;
  }) => {
    switch (update.status) {
      case 'completed':
        setUploadState('completed', 100, 'อัปโหลดเสร็จสมบูรณ์');
        queryClient.invalidateQueries({ queryKey: ['storyBar'] });
        queryClient.invalidateQueries({ queryKey: ['story-manage'] });
        break;
      case 'failed':
        setUploadState('failed', 0, update.error || 'การประมวลผลล้มเหลว');
        break;
      case 'deleted':
        resetUpload();
        queryClient.invalidateQueries({ queryKey: ['storyBar'] });
        queryClient.invalidateQueries({ queryKey: ['story-manage'] });
        break;
      case 'processing':
      case 'queued':
        setUploadState(
          update.status,
          update.progress ?? 0,
          update.stage || 'กำลังประมวลผล...'
        );
        break;
    }
  }, [queryClient, resetUpload, setUploadState]);

  // HTTP Polling fallback in case WebSocket drops or fails
  useQuery({
    queryKey: ['storyUploadStatus', activeUploadId],
    queryFn: async () => {
      if (!activeUploadId) return null;
      try {
        const data = await storyApi.fetchStoryStatus(activeUploadId);
        if (data && useStoryStore.getState().activeUploadId === data.id) {
          applyUploadStatus({
            status: data.status,
            progress: data.processingProgress?.percent,
            stage: data.processingProgress?.stage,
            error: data.processingJob?.failedReason,
          });
        }
        return data;
      } catch (error: any) {
        console.error("Polling upload status failed", error);
        // Only show the error once while fallback polling retries.
        if (!window.sessionStorage.getItem(`poll_error_${activeUploadId}`)) {
           message.error(`ระบบไม่สามารถตรวจสอบสถานะได้: ${error?.message || 'Network Error'}`);
           window.sessionStorage.setItem(`poll_error_${activeUploadId}`, 'true');
        }
        return null;
      }
    },
    enabled: !!activeUploadId && (uploadStatus === 'processing' || uploadStatus === 'queued' || uploadStatus === 'uploading'),
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join room when there's an active upload
    if (activeUploadId) {
      socket.emit("video_story:join", { storyItemId: activeUploadId }, (ack: any) => {
        if (!ack?.ok) {
          console.warn("Failed to join video_story room", ack);
        }
      });
    }

    const handleUploadProgress = (payload: StoryUploadProgressPayload) => {
      if (payload.storyItemId === activeUploadId) {
        applyUploadStatus(payload);
      }
    };

    socket.on('video_story:updated', handleUploadProgress);

    return () => {
      socket.off('video_story:updated', handleUploadProgress);
    };
  }, [socket, isConnected, activeUploadId, applyUploadStatus]);

  return null;
};

export default StorySocketListener;
