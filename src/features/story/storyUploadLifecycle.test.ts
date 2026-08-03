import { describe, expect, it, vi } from "vitest";

import {
  createStoryUploadLifecycle,
  type StoryUploadGateway,
  type StoryUploadScheduler,
  type StoryUploadSocket,
} from "./storyUploadLifecycle";
import type { StoryConfig, StoryUploadStatusResponse } from "./types/storyTypes";

const config: StoryConfig = {
  maxUploadBytes: 10 * 1024 * 1024,
  maxDurationSeconds: 60,
  allowedExtensions: ["mp4", "webm"],
  allowedMimeTypes: ["video/mp4", "video/webm"],
  maxCtaLinks: 3,
  isAdmin: false,
  manageVideoStory: false,
  canUploadStory: true,
  canUploadAdminStory: false,
};

const file = (overrides: Partial<File> = {}) => ({
  name: "story.mp4",
  size: 1024,
  type: "video/mp4",
  ...overrides,
}) as File;

const status = (
  value: StoryUploadStatusResponse["status"],
  overrides: Partial<StoryUploadStatusResponse> = {},
): StoryUploadStatusResponse => ({
  id: 77,
  status: value,
  processingProgress: {
    percent: value === "completed" ? 100 : 40,
    stage: value,
    updatedAt: "2026-08-03T07:00:00.000Z",
  },
  ...overrides,
});

const createScheduler = () => {
  let nextId = 1;
  const tasks = new Map<number, () => void>();
  const scheduler: StoryUploadScheduler = {
    setTimeout: (callback) => {
      const id = nextId++;
      tasks.set(id, callback);
      return id;
    },
    clearTimeout: (id) => tasks.delete(id),
  };
  return {
    scheduler,
    runNext: async () => {
      const entry = tasks.entries().next().value as [number, () => void] | undefined;
      if (!entry) return false;
      tasks.delete(entry[0]);
      entry[1]();
      await vi.waitFor(() => expect(tasks.size).toBeGreaterThanOrEqual(0));
      return true;
    },
    size: () => tasks.size,
  };
};

const createGateway = (): StoryUploadGateway => ({
  fetchConfig: vi.fn().mockResolvedValue(config),
  readDuration: vi.fn().mockResolvedValue(30),
  upload: vi.fn().mockResolvedValue({ id: 77 }),
  fetchStatus: vi.fn()
    .mockResolvedValueOnce(status("processing"))
    .mockResolvedValueOnce(status("completed")),
});

const createSocket = () => {
  const listeners = new Map<string, Set<(payload?: unknown) => void>>();
  const on = (event: string, listener: (payload?: unknown) => void) => {
    const eventListeners = listeners.get(event) ?? new Set();
    eventListeners.add(listener);
    listeners.set(event, eventListeners);
  };
  const off = (event: string, listener: (payload?: unknown) => void) =>
    listeners.get(event)?.delete(listener);
  return {
    adapter: {
      emit: vi.fn(),
      on,
      off,
      io: { on, off },
    } satisfies StoryUploadSocket,
    emit: (event: string, payload?: unknown) =>
      listeners.get(event)?.forEach((listener) => listener(payload)),
  };
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

describe("StoryUploadLifecycle", () => {
  it("reuses one idempotency key when a recoverable upload is retried", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.upload)
      .mockRejectedValueOnce(new Error("network interrupted"))
      .mockResolvedValueOnce({ storyItem: { id: 77 } });
    const scheduler = createScheduler();
    const lifecycle = createStoryUploadLifecycle({
      gateway,
      scheduler: scheduler.scheduler,
      createIdempotencyKey: () => "stable-intent-key",
    });

    await lifecycle.loadConfig();
    expect(await lifecycle.submit({ file: file(), sourceType: "user", links: [] })).toBe(false);
    expect(lifecycle.getState()).toMatchObject({ status: "failed", activeUploadId: null });

    expect(await lifecycle.retry()).toBe(true);

    expect(vi.mocked(gateway.upload).mock.calls.map((call) => call[1])).toEqual([
      "stable-intent-key",
      "stable-intent-key",
    ]);
    expect(lifecycle.getState()).toMatchObject({ status: "queued", activeUploadId: 77 });
  });

  it("polls an accepted upload through the shared transition path and stops at completion", async () => {
    const gateway = createGateway();
    const scheduler = createScheduler();
    const onCompleted = vi.fn();
    const lifecycle = createStoryUploadLifecycle({
      gateway,
      scheduler: scheduler.scheduler,
      createIdempotencyKey: () => "intent-key",
      onCompleted,
    });

    await lifecycle.loadConfig();
    await lifecycle.submit({ file: file(), sourceType: "user", links: [] });
    await scheduler.runNext();
    await vi.waitFor(() => expect(lifecycle.getState().status).toBe("processing"));
    await scheduler.runNext();
    await vi.waitFor(() => expect(lifecycle.getState().status).toBe("completed"));

    expect(scheduler.size()).toBe(0);
    expect(onCompleted).toHaveBeenCalledOnce();
  });

  it("converges Socket and polling updates without moving a terminal upload backward", async () => {
    const gateway = createGateway();
    const scheduler = createScheduler();
    const socket = createSocket();
    const onCompleted = vi.fn();
    const lifecycle = createStoryUploadLifecycle({
      gateway,
      scheduler: scheduler.scheduler,
      createIdempotencyKey: () => "intent-key",
      onCompleted,
    });

    await lifecycle.loadConfig();
    await lifecycle.submit({ file: file(), sourceType: "user", links: [] });
    lifecycle.setSocket(socket.adapter);
    socket.emit("video_story:updated", { storyItemId: 999, status: "completed" });
    socket.emit("video_story:updated", { storyItemId: 77, status: "processing", progress: 50 });
    socket.emit("video_story:updated", { storyItemId: 77, status: "completed", progress: 100 });

    expect(lifecycle.getState()).toMatchObject({ status: "completed", progress: 100 });
    expect(lifecycle.applyStatus(status("queued"))).toBe(false);
    expect(lifecycle.getState().status).toBe("completed");
    expect(onCompleted).toHaveBeenCalledOnce();
    expect(scheduler.size()).toBe(0);

    lifecycle.close();
    socket.emit("video_story:updated", { storyItemId: 77, status: "failed" });
    expect(lifecycle.getState().status).toBe("idle");
  });

  it("replaces active ownership, leaves the old Socket room and coalesces status refresh", async () => {
    const gateway = createGateway();
    const scheduler = createScheduler();
    const socket = createSocket();
    const pendingStatus = deferred<StoryUploadStatusResponse>();
    vi.mocked(gateway.upload)
      .mockResolvedValueOnce({ id: 77 })
      .mockResolvedValueOnce({ id: 88 });
    vi.mocked(gateway.fetchStatus).mockReturnValue(pendingStatus.promise);
    const lifecycle = createStoryUploadLifecycle({
      gateway,
      scheduler: scheduler.scheduler,
      createIdempotencyKey: () => "intent-key",
    });
    lifecycle.setSocket(socket.adapter);
    await lifecycle.loadConfig();
    await lifecycle.submit({ file: file(), sourceType: "user", links: [] });

    await lifecycle.replace({ file: file({ name: "replacement.webm", type: "video/webm" }), sourceType: "user", links: [] });

    expect(socket.adapter.emit).toHaveBeenCalledWith("video_story:leave", { storyItemId: 77 });
    expect(socket.adapter.emit).toHaveBeenCalledWith("video_story:join", { storyItemId: 88 });

    const firstRefresh = lifecycle.recover();
    const secondRefresh = lifecycle.recover();
    expect(gateway.fetchStatus).toHaveBeenCalledOnce();
    lifecycle.applyStatus(status("processing", {
      id: 88,
      processingProgress: { percent: 80, stage: "encoding", updatedAt: "2026-08-03T07:00:02.000Z" },
    }));
    pendingStatus.resolve(status("processing", {
      id: 88,
      processingProgress: { percent: 20, stage: "queued-worker", updatedAt: "2026-08-03T07:00:01.000Z" },
    }));
    await Promise.all([firstRefresh, secondRefresh]);

    expect(lifecycle.getState()).toMatchObject({ status: "processing", progress: 80 });
  });

  it("rejects invalid scheduling and source permissions before transport", async () => {
    const gateway = createGateway();
    const lifecycle = createStoryUploadLifecycle({ gateway });
    await lifecycle.loadConfig();

    expect(await lifecycle.submit({
      file: file(),
      sourceType: "user",
      startDate: "2026-08-04T00:00:00.000Z",
      endDate: "2026-08-03T00:00:00.000Z",
      links: [],
    })).toBe(false);
    expect(await lifecycle.submit({ file: file(), sourceType: "admin", links: [] })).toBe(false);
    expect(gateway.upload).not.toHaveBeenCalled();
  });

  it("scopes in-flight recovery to the upload generation during replacement", async () => {
    const gateway = createGateway();
    const scheduler = createScheduler();
    const oldStatus = deferred<StoryUploadStatusResponse>();
    vi.mocked(gateway.upload)
      .mockResolvedValueOnce({ id: 77 })
      .mockResolvedValueOnce({ id: 88 });
    vi.mocked(gateway.fetchStatus).mockReset()
      .mockReturnValueOnce(oldStatus.promise)
      .mockResolvedValueOnce(status("processing", { id: 88 }));
    const lifecycle = createStoryUploadLifecycle({ gateway, scheduler: scheduler.scheduler });
    await lifecycle.loadConfig();
    await lifecycle.submit({ file: file(), sourceType: "user", links: [] });

    const staleRecovery = lifecycle.recover();
    await lifecycle.replace({ file: file(), sourceType: "user", links: [] });
    await lifecycle.recover();

    expect(gateway.fetchStatus).toHaveBeenCalledTimes(2);
    expect(lifecycle.getState()).toMatchObject({ activeUploadId: 88, status: "processing" });
    oldStatus.resolve(status("completed", { id: 77 }));
    await staleRecovery;
    expect(lifecycle.getState()).toMatchObject({ activeUploadId: 88, status: "processing" });
  });

  it("rejects an older processing stage even when its numeric progress is lower", async () => {
    const gateway = createGateway();
    const scheduler = createScheduler();
    const lifecycle = createStoryUploadLifecycle({ gateway, scheduler: scheduler.scheduler });
    await lifecycle.loadConfig();
    await lifecycle.submit({ file: file(), sourceType: "user", links: [] });

    lifecycle.applyStatus(status("processing", {
      processingProgress: { percent: 80, stage: "encoding", updatedAt: "2026-08-03T07:00:02.000Z" },
    }));
    lifecycle.applyStatus(status("processing", {
      processingProgress: { percent: 20, stage: "queued-worker", updatedAt: "2026-08-03T07:00:01.000Z" },
    }));

    expect(lifecycle.getState()).toMatchObject({ progress: 80, stage: "encoding" });
  });
});
