import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSyncReadingProgress = vi.fn();
const mockUpdateReadingProgress = vi.fn();

let showNavState = true;
const setShowNavMock = vi.fn((next: any) => {
  showNavState = typeof next === "function" ? next(showNavState) : next;
});

let contentRefMock: { current: any } = { current: null };
let initialSyncDoneRefMock: { current: boolean } = { current: false };
let refCallCount = 0;
const effectCleanups: Array<() => void> = [];
const pendingEffects: Array<() => void | (() => void)> = [];

vi.mock("react", () => ({
  useState: (initial: any) => {
    showNavState = initial;
    return [showNavState, setShowNavMock];
  },
  useRef: (initial: any) => {
    if (refCallCount === 0) {
      refCallCount += 1;
      contentRefMock = { current: initial };
      return contentRefMock;
    }
    refCallCount += 1;
    initialSyncDoneRefMock = { current: initial };
    return initialSyncDoneRefMock;
  },
  useEffect: (effect: () => void | (() => void)) => {
    pendingEffects.push(effect);
  },
}));

vi.mock("@/services/apiServices", () => ({
  syncReadingProgress: (...args: any[]) => mockSyncReadingProgress(...args),
  updateReadingProgress: (...args: any[]) => mockUpdateReadingProgress(...args),
}));

import { useReadingProgress } from "@/features/read/hooks/useReadingProgress";

describe("useReadingProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    effectCleanups.length = 0;
    pendingEffects.length = 0;
    refCallCount = 0;
    showNavState = true;
    contentRefMock = { current: null };
    initialSyncDoneRefMock = { current: false };

    let scrollHandler: ((ev?: any) => void) | null = null;
    (globalThis as any).window = {
      scrollY: 50,
      innerHeight: 500,
      scrollTo: vi.fn(),
      addEventListener: vi.fn((_event: string, handler: (ev?: any) => void) => {
        scrollHandler = handler;
      }),
      removeEventListener: vi.fn(),
      __getScrollHandler: () => scrollHandler,
    };

    mockSyncReadingProgress.mockResolvedValue({ status: "success", progress: 0.5 });
    mockUpdateReadingProgress.mockResolvedValue({ status: "success" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("syncs initial reading progress and scrolls to computed position", async () => {
    useReadingProgress("4007", "1574150", { user_id: 64689 });
    contentRefMock.current = {
      getBoundingClientRect: () => ({ top: 100 }),
      scrollHeight: 2000,
    };
    pendingEffects.splice(0).forEach((effect) => {
      const cleanup = effect();
      if (typeof cleanup === "function") effectCleanups.push(cleanup);
    });

    await Promise.resolve();
    vi.runAllTimers();
    await Promise.resolve();

    expect(mockSyncReadingProgress).toHaveBeenCalledWith("1574150");
    expect((globalThis as any).window.scrollTo).toHaveBeenCalledWith({
      top: 900,
      behavior: "smooth",
    });
    expect(initialSyncDoneRefMock.current).toBe(true);
  });

  it("tracks scroll and sends full progress when content is shorter than viewport", async () => {
    const hook = useReadingProgress("4007", "1574150", { user_id: 64689 });
    expect(hook.showNav).toBe(true);
    contentRefMock.current = {
      getBoundingClientRect: () => ({ top: 0 }),
      scrollHeight: 400,
    };
    pendingEffects.splice(0).forEach((effect) => {
      const cleanup = effect();
      if (typeof cleanup === "function") effectCleanups.push(cleanup);
    });

    const scrollHandler = (globalThis as any).window.__getScrollHandler();
    expect(scrollHandler).toBeTypeOf("function");

    scrollHandler();
    vi.runAllTimers();
    await Promise.resolve();

    expect(mockUpdateReadingProgress).toHaveBeenCalledWith("4007", "1574150", 1);
    expect(setShowNavMock).toHaveBeenCalledWith(true);
  });

  it("tracks formatted progress and keeps nav visible near the end", async () => {
    (globalThis as any).window.scrollY = 995;
    useReadingProgress("4007", "1574150", { user_id: 64689 });
    contentRefMock.current = {
      getBoundingClientRect: () => ({ top: -995 }),
      scrollHeight: 1500,
    };
    pendingEffects.splice(0).forEach((effect) => {
      const cleanup = effect();
      if (typeof cleanup === "function") effectCleanups.push(cleanup);
    });

    const scrollHandler = (globalThis as any).window.__getScrollHandler();
    scrollHandler();
    vi.runAllTimers();
    await Promise.resolve();

    expect(mockUpdateReadingProgress).toHaveBeenCalledWith("4007", "1574150", 0.995);
    expect(setShowNavMock).toHaveBeenCalledWith(true);
  });

  it("cleans up scroll listener on unmount", () => {
    useReadingProgress("4007", "1574150", { user_id: 64689 });
    pendingEffects.splice(0).forEach((effect) => {
      const cleanup = effect();
      if (typeof cleanup === "function") effectCleanups.push(cleanup);
    });

    effectCleanups.forEach((cleanup) => cleanup());

    expect((globalThis as any).window.removeEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });
});
