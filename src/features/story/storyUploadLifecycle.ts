import type {
  StoryConfig,
  StoryUploadResponse,
  StoryUploadStatusResponse,
  StoryUploadStatusType,
} from "./types/storyTypes";

export interface StoryUploadIntent {
  file: File;
  sourceType: "user" | "admin";
  startDate?: string;
  endDate?: string;
  links: Array<{ label: string; url: string; orderBy?: number }>;
}

export interface StoryUploadGateway {
  fetchConfig: () => Promise<StoryConfig>;
  readDuration: (file: File) => Promise<number>;
  upload: (
    intent: StoryUploadIntent,
    idempotencyKey: string,
    onProgress?: (progress: number) => void,
  ) => Promise<StoryUploadResponse | number>;
  fetchStatus: (storyItemId: number) => Promise<StoryUploadStatusResponse>;
}

export interface StoryUploadScheduler {
  setTimeout: (callback: () => void, delayMs: number) => number;
  clearTimeout: (id: number) => void;
}

export interface StoryUploadSocket {
  emit: (
    event: string,
    payload: unknown,
    acknowledgement?: (response: { ok?: boolean }) => void,
  ) => void;
  on: (event: string, listener: (payload?: unknown) => void) => void;
  off: (event: string, listener: (payload?: unknown) => void) => void;
  io: {
    on: (event: string, listener: (payload?: unknown) => void) => void;
    off: (event: string, listener: (payload?: unknown) => void) => void;
  };
}

interface StoryUploadSocketPayload {
  storyItemId: number;
  status: StoryUploadStatusType;
  progress?: number;
  stage?: string;
  error?: string;
}

const storyUploadStatuses: ReadonlySet<StoryUploadStatusType> = new Set([
  "queued",
  "processing",
  "completed",
  "failed",
  "deleted",
]);

const isStoryUploadSocketPayload = (payload: unknown): payload is StoryUploadSocketPayload => {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<StoryUploadSocketPayload>;
  return typeof candidate.storyItemId === "number"
    && Number.isFinite(candidate.storyItemId)
    && candidate.storyItemId > 0
    && typeof candidate.status === "string"
    && storyUploadStatuses.has(candidate.status as StoryUploadStatusType)
    && (candidate.progress === undefined
      || (typeof candidate.progress === "number" && Number.isFinite(candidate.progress)))
    && (candidate.stage === undefined || typeof candidate.stage === "string")
    && (candidate.error === undefined || typeof candidate.error === "string");
};

export interface StoryUploadLifecycleState {
  status: "idle" | "validating" | "uploading" | "queued" | "processing" | "completed" | "failed" | "deleted";
  progress: number;
  stage: string;
  error: string | null;
  activeUploadId: number | null;
  config: StoryConfig | null;
  canRetry: boolean;
}

interface CreateStoryUploadLifecycleOptions {
  gateway: StoryUploadGateway;
  scheduler?: StoryUploadScheduler;
  createIdempotencyKey?: () => string;
  pollIntervalMs?: number;
  onCompleted?: () => void;
}

const defaultScheduler: StoryUploadScheduler = {
  setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearTimeout: (id) => window.clearTimeout(id),
};

const defaultCreateIdempotencyKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const getUploadId = (response: StoryUploadResponse | number): number | null => {
  if (typeof response === "number") return response;
  return response.storyItem?.id
    ?? response.id
    ?? response.storyItemId
    ?? response.story_item_id
    ?? null;
};

const getErrorMessage = (error: unknown) => {
  const response = (error as {
    response?: { data?: { code?: string; message?: string } };
    message?: string;
  })?.response;
  if (response?.data?.code === "VIDEO_STORY_DATE_RANGE_INVALID") {
    return "ช่วงเวลาที่ตั้งค่าไม่ถูกต้อง โปรดตรวจสอบ Start Date และ End Date อีกครั้ง";
  }
  return response?.data?.message
    ?? (error instanceof Error ? error.message : null)
    ?? "เกิดข้อผิดพลาดในการอัปโหลด";
};

export const createStoryUploadLifecycle = ({
  gateway,
  scheduler = defaultScheduler,
  createIdempotencyKey = defaultCreateIdempotencyKey,
  pollIntervalMs = 2_000,
  onCompleted = () => undefined,
}: CreateStoryUploadLifecycleOptions) => {
  let state: StoryUploadLifecycleState = {
    status: "idle",
    progress: 0,
    stage: "",
    error: null,
    activeUploadId: null,
    config: null,
    canRetry: false,
  };
  let intent: StoryUploadIntent | null = null;
  let idempotencyKey: string | null = null;
  let generation = 0;
  let pollTimer: number | null = null;
  let refreshPromise: Promise<void> | null = null;
  let socket: StoryUploadSocket | null = null;
  let completedGeneration: number | null = null;
  let lastProcessingUpdatedAt: number | null = null;
  const listeners = new Set<(state: StoryUploadLifecycleState) => void>();

  const publish = (patch: Partial<StoryUploadLifecycleState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  };

  const stopPolling = () => {
    if (pollTimer === null) return;
    scheduler.clearTimeout(pollTimer);
    pollTimer = null;
  };

  const joinActiveUpload = () => {
    if (!socket || !state.activeUploadId) return;
    socket.emit("video_story:join", { storyItemId: state.activeUploadId });
  };

  const leaveActiveUpload = () => {
    if (!socket || !state.activeUploadId) return;
    socket.emit("video_story:leave", { storyItemId: state.activeUploadId });
  };

  const isTerminal = () => ["completed", "failed", "deleted"].includes(state.status);

  const applyStatus = (update: StoryUploadStatusResponse) => {
    if (update.id !== state.activeUploadId || isTerminal()) return false;
    const incomingUpdatedAt = update.processingProgress?.updatedAt
      ? Date.parse(update.processingProgress.updatedAt)
      : null;
    if (
      incomingUpdatedAt !== null
      && Number.isFinite(incomingUpdatedAt)
      && lastProcessingUpdatedAt !== null
      && incomingUpdatedAt < lastProcessingUpdatedAt
    ) return false;
    const incomingProgress = update.processingProgress?.percent
      ?? (update.status === "completed" ? 100 : state.progress);
    const progress = update.status === "completed"
      ? 100
      : Math.max(state.progress, incomingProgress);
    const stage = update.processingProgress?.stage ?? update.status;

    if (update.status === "completed") {
      stopPolling();
      publish({ status: "completed", progress: 100, stage, error: null, canRetry: false });
      if (completedGeneration !== generation) {
        completedGeneration = generation;
        onCompleted();
      }
      return true;
    }
    if (update.status === "failed") {
      stopPolling();
      publish({
        status: "failed",
        progress,
        stage,
        error: update.processingJob?.failedReason ?? "การประมวลผลล้มเหลว",
        canRetry: false,
      });
      return true;
    }
    if (update.status === "deleted") {
      stopPolling();
      publish({ status: "deleted", progress, stage, error: null, canRetry: false });
      return true;
    }
    if (state.status === "processing" && update.status === "queued") return false;
    if (incomingUpdatedAt !== null && Number.isFinite(incomingUpdatedAt)) {
      lastProcessingUpdatedAt = incomingUpdatedAt;
    }
    publish({ status: update.status, progress, stage, error: null, canRetry: false });
    return true;
  };

  const pollNow = () => {
    if (refreshPromise) return refreshPromise;
    if (pollTimer !== null) scheduler.clearTimeout(pollTimer);
    pollTimer = null;
    const uploadId = state.activeUploadId;
    const currentGeneration = generation;
    if (!uploadId || isTerminal()) return Promise.resolve();
    const currentRefresh = (async () => {
      try {
        const update = await gateway.fetchStatus(uploadId);
        if (currentGeneration !== generation) return;
        applyStatus(update);
      } catch (error) {
        if (currentGeneration === generation) {
          publish({ error: getErrorMessage(error) });
        }
      }
    })().finally(() => {
      if (refreshPromise === currentRefresh) refreshPromise = null;
      if (currentGeneration === generation && !isTerminal()) {
        pollTimer = scheduler.setTimeout(() => void pollNow(), pollIntervalMs);
      }
    });
    refreshPromise = currentRefresh;
    return currentRefresh;
  };

  const schedulePoll = () => {
    stopPolling();
    if (!state.activeUploadId || isTerminal()) return;
    pollTimer = scheduler.setTimeout(() => void pollNow(), pollIntervalMs);
  };

  const loadConfig = async () => {
    try {
      const nextConfig = await gateway.fetchConfig();
      publish({ config: nextConfig, error: null });
      return nextConfig;
    } catch (error) {
      publish({ error: getErrorMessage(error) });
      return null;
    }
  };

  const validate = async (nextIntent: StoryUploadIntent) => {
    const currentConfig = state.config ?? await loadConfig();
    if (!currentConfig) return "ยังไม่สามารถอัปโหลดได้ โปรดลองอีกครั้ง";
    const { file } = nextIntent;
    if (nextIntent.sourceType === "user" && !currentConfig.canUploadStory) {
      return "You do not have permission to upload a story";
    }
    if (nextIntent.sourceType === "admin" && !currentConfig.canUploadAdminStory) {
      return "You do not have permission to upload an admin story";
    }
    if (nextIntent.startDate || nextIntent.endDate) {
      const start = nextIntent.startDate ? Date.parse(nextIntent.startDate) : null;
      const end = nextIntent.endDate ? Date.parse(nextIntent.endDate) : null;
      if ((start !== null && !Number.isFinite(start))
        || (end !== null && !Number.isFinite(end))
        || (start !== null && end !== null && start >= end)) {
        return "The story schedule is invalid";
      }
    }
    if (nextIntent.links.length > currentConfig.maxCtaLinks) {
      return `A story can have at most ${currentConfig.maxCtaLinks} links`;
    }
    const hasInvalidLink = nextIntent.links.some(({ label, url }) => {
      if (!label.trim() || !url.trim()) return true;
      try {
        return !["http:", "https:"].includes(new URL(url).protocol);
      } catch {
        return true;
      }
    });
    if (hasInvalidLink) return "One or more story links are invalid";
    if (file.size <= 0) return "ไฟล์วิดีโอไม่ถูกต้อง";
    if (file.size > currentConfig.maxUploadBytes) {
      return `ไฟล์ใหญ่เกินไป (จำกัด ${Math.floor(currentConfig.maxUploadBytes / 1024 / 1024)}MB)`;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const extensionAllowed = currentConfig.allowedExtensions
      .some((item) => item.replace(/^\./, "").toLowerCase() === extension);
    const mime = file.type.toLowerCase();
    const mimeAllowed = !mime
      || currentConfig.allowedMimeTypes.length === 0
      || currentConfig.allowedMimeTypes.some((item) => item.toLowerCase() === mime);
    if (!extensionAllowed || !mimeAllowed) {
      return `รองรับเฉพาะไฟล์ ${currentConfig.allowedExtensions.join(", ")}`;
    }
    try {
      const duration = await gateway.readDuration(file);
      if (!Number.isFinite(duration)) return "ไม่สามารถอ่านความยาววิดีโอได้";
      if (duration > currentConfig.maxDurationSeconds) {
        return `วิดีโอยาวเกินกำหนด (สูงสุด ${currentConfig.maxDurationSeconds} วินาที)`;
      }
    } catch {
      return "ไม่สามารถอ่านข้อมูลวิดีโอได้ กรุณาเลือกไฟล์ใหม่";
    }
    return null;
  };

  const runUpload = async () => {
    if (!intent || !idempotencyKey) return false;
    const currentGeneration = generation;
    publish({ status: "validating", progress: 0, stage: "กำลังตรวจสอบไฟล์...", error: null });
    const validationError = await validate(intent);
    if (currentGeneration !== generation) return false;
    if (validationError) {
      publish({ status: "failed", error: validationError, canRetry: false });
      return false;
    }
    publish({ status: "uploading", progress: 0, stage: "กำลังอัปโหลดไฟล์...", error: null });
    try {
      const response = await gateway.upload(intent, idempotencyKey, (progress) => {
        if (currentGeneration === generation && state.status === "uploading") {
          publish({ progress });
        }
      });
      if (currentGeneration !== generation) return false;
      const uploadId = getUploadId(response);
      if (!uploadId) throw new Error("ไม่พบ ID ของวิดีโอจากเซิร์ฟเวอร์");
      publish({
        status: "queued",
        progress: 0,
        stage: "อัปโหลดสำเร็จ รอการประมวลผล...",
        activeUploadId: uploadId,
        error: null,
        canRetry: false,
      });
      joinActiveUpload();
      schedulePoll();
      return true;
    } catch (error) {
      if (currentGeneration === generation) {
        publish({ status: "failed", error: getErrorMessage(error), canRetry: true });
      }
      return false;
    }
  };

  const submit = async (nextIntent: StoryUploadIntent) => {
    if (["validating", "uploading", "queued", "processing"].includes(state.status)) return false;
    stopPolling();
    refreshPromise = null;
    generation += 1;
    completedGeneration = null;
    lastProcessingUpdatedAt = null;
    intent = nextIntent;
    idempotencyKey = createIdempotencyKey();
    publish({ activeUploadId: null, canRetry: false });
    return runUpload();
  };

  const replace = async (nextIntent: StoryUploadIntent) => {
    leaveActiveUpload();
    stopPolling();
    refreshPromise = null;
    generation += 1;
    completedGeneration = null;
    lastProcessingUpdatedAt = null;
    intent = nextIntent;
    idempotencyKey = createIdempotencyKey();
    publish({
      status: "idle",
      progress: 0,
      stage: "",
      error: null,
      activeUploadId: null,
      canRetry: false,
    });
    return runUpload();
  };

  const retry = async () => {
    if (!intent || !state.canRetry || state.activeUploadId) return false;
    return runUpload();
  };

  const reset = () => {
    leaveActiveUpload();
    stopPolling();
    refreshPromise = null;
    generation += 1;
    lastProcessingUpdatedAt = null;
    intent = null;
    idempotencyKey = null;
    publish({
      status: "idle",
      progress: 0,
      stage: "",
      error: null,
      activeUploadId: null,
      canRetry: false,
    });
  };

  const handleSocketUpdate = (payload?: unknown) => {
    if (!isStoryUploadSocketPayload(payload)) return;
    applyStatus(toStoryUploadStatusResponse(payload));
  };
  const handleReconnect = () => {
    joinActiveUpload();
    void pollNow();
  };

  const setSocket = (nextSocket: StoryUploadSocket | null) => {
    if (socket === nextSocket) return;
    if (socket) {
      leaveActiveUpload();
      socket.off("video_story:updated", handleSocketUpdate);
      socket.io.off("reconnect", handleReconnect);
    }
    socket = nextSocket;
    if (socket) {
      socket.on("video_story:updated", handleSocketUpdate);
      socket.io.on("reconnect", handleReconnect);
      joinActiveUpload();
    }
  };

  return {
    getState: () => state,
    subscribe: (listener: (state: StoryUploadLifecycleState) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    loadConfig,
    submit,
    replace,
    retry,
    applyStatus,
    recover: pollNow,
    setSocket,
    reset,
    close: () => {
      setSocket(null);
      reset();
    },
  };
};

export const toStoryUploadStatusResponse = (payload: {
  storyItemId: number;
  status: StoryUploadStatusType;
  progress?: number;
  stage?: string;
  error?: string;
}): StoryUploadStatusResponse => ({
  id: payload.storyItemId,
  status: payload.status,
  processingProgress: payload.progress === undefined && payload.stage === undefined
    ? undefined
    : {
      percent: payload.progress ?? 0,
      stage: payload.stage ?? payload.status,
      updatedAt: new Date().toISOString(),
    },
  processingJob: payload.error === undefined
    ? undefined
    : { id: "socket", state: payload.status, attemptsMade: 0, failedReason: payload.error },
});
