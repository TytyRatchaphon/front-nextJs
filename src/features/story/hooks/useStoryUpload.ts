import { App } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { useSocket } from "@/providers/SocketProvider";
import { queryKeys } from "@/constants/query";
import { useRecoverWhenAvailable } from "@/hooks/useRecoverWhenAvailable";

import {
  createStoryUploadLifecycle,
  type StoryUploadGateway,
  type StoryUploadSocket,
} from "../storyUploadLifecycle";
import { storyApi } from "../services/storyApi";
import { useStoryStore } from "../stores/storyStore";

const readVideoDuration = (file: File) => new Promise<number>((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  const release = () => URL.revokeObjectURL(objectUrl);
  video.preload = "metadata";
  video.onloadedmetadata = () => {
    const duration = video.duration;
    release();
    resolve(duration);
  };
  video.onerror = () => {
    release();
    reject(new Error("VIDEO_METADATA_UNREADABLE"));
  };
  video.src = objectUrl;
});

export const useStoryUpload = () => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const setUploadState = useStoryStore((state) => state.setUploadState);
  const setActiveUploadId = useStoryStore((state) => state.setActiveUploadId);
  const resetStoreUpload = useStoryStore((state) => state.resetUpload);
  const lastErrorRef = useRef<string | null>(null);

  const lifecycle = useMemo(() => {
    const gateway: StoryUploadGateway = {
      fetchConfig: storyApi.fetchStoryConfig,
      readDuration: readVideoDuration,
      upload: (intent, idempotencyKey) => storyApi.uploadStory(
        intent.file,
        idempotencyKey,
        intent.sourceType,
        intent.startDate,
        intent.endDate,
        intent.links,
      ),
      fetchStatus: storyApi.fetchStoryStatus,
    };
    return createStoryUploadLifecycle({
      gateway,
      onCompleted: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.story.bar() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.story.manageRoot() });
        message.success("อัปโหลดเสร็จสมบูรณ์");
      },
    });
  }, [message, queryClient]);

  const state = useSyncExternalStore(
    lifecycle.subscribe,
    lifecycle.getState,
    lifecycle.getState,
  );

  useEffect(() => {
    void lifecycle.loadConfig();
    return () => lifecycle.close();
  }, [lifecycle]);

  useEffect(() => {
    lifecycle.setSocket(socket as StoryUploadSocket | null);
    return () => lifecycle.setSocket(null);
  }, [lifecycle, socket]);

  useRecoverWhenAvailable(lifecycle.recover);

  useEffect(() => {
    if (state.status === "deleted" || state.status === "idle") {
      resetStoreUpload();
      return;
    }
    setUploadState(state.status, state.progress, state.error ?? state.stage);
    setActiveUploadId(state.activeUploadId);
  }, [resetStoreUpload, setActiveUploadId, setUploadState, state]);

  useEffect(() => {
    if (!state.error || state.error === lastErrorRef.current) return;
    lastErrorRef.current = state.error;
    message.error(state.error);
  }, [message, state.error]);

  const uploadStory = (
    file: File,
    sourceType: "user" | "admin" = "user",
    startDate?: string,
    endDate?: string,
    links: Array<{ label: string; url: string; orderBy?: number }> = [],
  ) => lifecycle.submit({ file, sourceType, startDate, endDate, links });

  const replaceUpload = (
    file: File,
    sourceType: "user" | "admin" = "user",
    startDate?: string,
    endDate?: string,
    links: Array<{ label: string; url: string; orderBy?: number }> = [],
  ) => lifecycle.replace({ file, sourceType, startDate, endDate, links });

  return {
    uploadStory,
    replaceUpload,
    retryUpload: lifecycle.retry,
    isUploading: ["validating", "uploading", "queued", "processing"].includes(state.status),
    config: state.config,
    resetUpload: lifecycle.reset,
    state,
  };
};
