import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn();
const mockLogActivity = vi.fn();
const mockUseEffect = vi.fn((effect: () => void | (() => void)) => effect());
const mockUseCallback = vi.fn((fn: any) => fn);
const mockUseRef = vi.fn((initial: any) => ({ current: initial }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("react", () => ({
  useEffect: (effect: () => void | (() => void)) => mockUseEffect(effect),
  useCallback: (fn: any) => mockUseCallback(fn),
  useRef: (initial: any) => mockUseRef(initial),
}));

vi.mock("@/services/apiServices", () => ({
  logActivity: (payload: any) => mockLogActivity(payload),
}));

import { useLogger } from "./useLogger";

const originalCrypto = (globalThis as any).crypto;

describe("useLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const storage = (() => {
      const map = new Map<string, string>();
      return {
        getItem: vi.fn((key: string) => map.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          map.set(key, value);
        }),
      };
    })();

    (globalThis as any).localStorage = storage;
    (globalThis as any).window = {
      location: { pathname: "/window-path" },
      localStorage: storage,
    };
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        randomUUID: vi
          .fn()
          .mockReturnValueOnce("app-session-uuid")
          .mockReturnValueOnce("page-session-uuid")
          .mockReturnValueOnce("track-page-session-uuid"),
      },
    });

    mockUsePathname.mockReturnValue("/hook-path");
    mockLogActivity.mockResolvedValue(undefined);
  });

  it("log() creates session ids and sends payload", async () => {
    const { log } = useLogger();

    await log("page_view", "book", "12", { source: "home" }, 2.5);

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "app-session-uuid",
        page_session_id: "page-session-uuid",
        action: "page_view",
        target_type: "book",
        target_id: "12",
        path: "/hook-path",
        metadata: { source: "home" },
        duration: 2.5,
      })
    );
  });

  it("trackTimeSpent() logs time_spent with duration", () => {
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2500);

    const { trackTimeSpent } = useLogger();
    const cleanup = trackTimeSpent("chapter", "99", { from: "reader" });
    cleanup();

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "time_spent",
        target_type: "chapter",
        target_id: "99",
        path: "/window-path",
        duration: 1.5,
        metadata: { from: "reader" },
      })
    );
  });

  it("uses existing app_session_id from localStorage and fallback UUID when crypto.randomUUID is unavailable", async () => {
    const storage = (globalThis as any).localStorage;
    storage.setItem("app_session_id", "existing-session");
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {},
    });

    const { log } = useLogger();
    await log("click");

    expect(storage.getItem).toHaveBeenCalledWith("app_session_id");
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "existing-session",
        action: "click",
      })
    );
  });

  it("keeps logging best-effort when localStorage is unavailable", async () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("storage blocked");
      }),
      setItem: vi.fn(),
    };

    (globalThis as any).localStorage = storage;
    (globalThis as any).window.localStorage = storage;

    const { log } = useLogger();

    await expect(log("search")).resolves.toBeUndefined();
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "search",
        session_id: "app-session-uuid",
        page_session_id: "page-session-uuid",
      })
    );
  });

  it("swallows logActivity failures so analytics cannot break pages", async () => {
    mockLogActivity.mockRejectedValueOnce(new Error("analytics failed"));

    const { log } = useLogger();

    await expect(log("search")).resolves.toBeUndefined();
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: originalCrypto,
  });
});
