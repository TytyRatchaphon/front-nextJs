import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEvaluateAndTrackFreeReadQuota = vi.fn();
const mockHasShownFirstTopupPrompt = vi.fn();
const mockMarkFirstTopupPromptShown = vi.fn();
const mockMergeGuestQuotaToUser = vi.fn();

let latestState: any;
const mockSetState = vi.fn((next: any) => {
  latestState = typeof next === "function" ? next(latestState) : next;
});

vi.mock("react", () => ({
  useState: (initial: any) => {
    latestState = initial;
    return [latestState, mockSetState];
  },
  useMemo: (factory: () => any) => factory(),
  useEffect: (effect: () => void | (() => void)) => effect(),
  useCallback: (fn: any) => fn,
}));

vi.mock("@/utils/readFreeQuota", () => ({
  evaluateAndTrackFreeReadQuota: (...args: any[]) => mockEvaluateAndTrackFreeReadQuota(...args),
  hasShownFirstTopupPrompt: (...args: any[]) => mockHasShownFirstTopupPrompt(...args),
  markFirstTopupPromptShown: (...args: any[]) => mockMarkFirstTopupPromptShown(...args),
  mergeGuestQuotaToUser: (...args: any[]) => mockMergeGuestQuotaToUser(...args),
}));

import { useReadFreeQuota } from "@/features/read/hooks/useReadFreeQuota";

describe("useReadFreeQuota", () => {
  beforeEach(() => {
    latestState = undefined;
    vi.clearAllMocks();
    mockEvaluateAndTrackFreeReadQuota.mockReturnValue({
      blocked: true,
      reason: "need_login",
      currentCount: 10,
      limit: 10,
      alreadyRead: false,
    });
    mockHasShownFirstTopupPrompt.mockReturnValue(true);
  });

  it("merges guest quota and tracks quota when user is logged in", () => {
    useReadFreeQuota({
      bookId: "4007",
      episodeId: "1574150",
      isLoggedIn: true,
      userId: 65162,
      canTrack: true,
      isEpisodeOwned: false,
      guestLimit: 10,
      memberLimit: 40,
    });

    expect(mockMergeGuestQuotaToUser).toHaveBeenCalledWith("65162");
    expect(mockEvaluateAndTrackFreeReadQuota).toHaveBeenCalledWith({
      bookId: "4007",
      episodeId: "1574150",
      isLoggedIn: true,
      userId: "65162",
      guestLimit: 10,
      memberLimit: 40,
      isEpisodeOwned: false,
    });
    expect(mockHasShownFirstTopupPrompt).toHaveBeenCalledWith({
      bookId: "4007",
      userId: "65162",
    });
    expect(latestState).toEqual({
      isBlocked: true,
      reason: "need_login",
      currentCount: 10,
      limit: 10,
      alreadyRead: false,
      hasShownTopupPrompt: true,
    });
  });

  it("resets blocked state and skips tracking when tracking is disabled", () => {
    useReadFreeQuota({
      bookId: "4007",
      episodeId: "1574150",
      isLoggedIn: false,
      userId: null,
      canTrack: false,
      isEpisodeOwned: false,
      guestLimit: 10,
      memberLimit: 40,
    });

    expect(mockMergeGuestQuotaToUser).not.toHaveBeenCalled();
    expect(mockEvaluateAndTrackFreeReadQuota).not.toHaveBeenCalled();
    expect(mockHasShownFirstTopupPrompt).not.toHaveBeenCalled();
    expect(latestState).toEqual({
      isBlocked: false,
      reason: null,
      currentCount: 0,
      limit: 10,
      alreadyRead: false,
      hasShownTopupPrompt: false,
    });
  });

  it("markTopupPromptShown is no-op for guest users", () => {
    const hook = useReadFreeQuota({
      bookId: "4007",
      episodeId: "1574150",
      isLoggedIn: false,
      userId: null,
      canTrack: true,
      isEpisodeOwned: false,
    });

    hook.markTopupPromptShown();

    expect(mockMarkFirstTopupPromptShown).not.toHaveBeenCalled();
  });

  it("markTopupPromptShown persists topup prompt flag for logged-in user", () => {
    const hook = useReadFreeQuota({
      bookId: "4007",
      episodeId: "1574150",
      isLoggedIn: true,
      userId: "64689",
      canTrack: true,
      isEpisodeOwned: false,
    });

    hook.markTopupPromptShown();

    expect(mockMarkFirstTopupPromptShown).toHaveBeenCalledWith({
      bookId: "4007",
      userId: "64689",
    });
    expect(latestState.hasShownTopupPrompt).toBe(true);
  });
});
