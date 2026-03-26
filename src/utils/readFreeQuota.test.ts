import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  READ_FREE_QUOTA_STORAGE_KEY,
  evaluateAndTrackFreeReadQuota,
  hasShownFirstTopupPrompt,
  markFirstTopupPromptShown,
  mergeGuestQuotaToUser,
  readFreeQuotaStorage,
} from "./readFreeQuota";

type MemoryStorage = Storage & {
  __clearStore: () => void;
};

const createMemoryStorage = (): MemoryStorage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    __clearStore: () => store.clear(),
  } as MemoryStorage;
};

describe("readFreeQuota utils", () => {
  const localStorageMock = createMemoryStorage();

  beforeEach(() => {
    (globalThis as any).window = {
      localStorage: localStorageMock,
    };
    localStorageMock.__clearStore();
  });

  afterEach(() => {
    delete (globalThis as any).window;
    localStorageMock.__clearStore();
  });

  it("blocks guest on 11th unread episode (10 free limit)", () => {
    for (let i = 1; i <= 10; i += 1) {
      const result = evaluateAndTrackFreeReadQuota({
        bookId: 99,
        episodeId: i,
        isLoggedIn: false,
        guestLimit: 10,
        memberLimit: 40,
      });
      expect(result.blocked).toBe(false);
    }

    const blocked = evaluateAndTrackFreeReadQuota({
      bookId: 99,
      episodeId: 11,
      isLoggedIn: false,
      guestLimit: 10,
      memberLimit: 40,
    });

    expect(blocked.blocked).toBe(true);
    expect(blocked.reason).toBe("guest-limit");
    expect(blocked.currentCount).toBe(10);
  });

  it("merges guest reads into user and keeps continuing up to member limit", () => {
    for (let i = 1; i <= 10; i += 1) {
      evaluateAndTrackFreeReadQuota({
        bookId: 1234,
        episodeId: i,
        isLoggedIn: false,
        guestLimit: 10,
        memberLimit: 40,
      });
    }

    mergeGuestQuotaToUser("77");

    const afterMerge = evaluateAndTrackFreeReadQuota({
      bookId: 1234,
      episodeId: 11,
      isLoggedIn: true,
      userId: "77",
      guestLimit: 10,
      memberLimit: 40,
    });

    expect(afterMerge.blocked).toBe(false);
    expect(afterMerge.currentCount).toBe(11);
    expect(afterMerge.limit).toBe(40);
  });

  it("marks first-topup popup shown per user/book", () => {
    expect(hasShownFirstTopupPrompt({ bookId: 55, userId: "abc" })).toBe(false);
    markFirstTopupPromptShown({ bookId: 55, userId: "abc" });
    expect(hasShownFirstTopupPrompt({ bookId: 55, userId: "abc" })).toBe(true);
  });

  it("does not count quota for owned episodes", () => {
    const result = evaluateAndTrackFreeReadQuota({
      bookId: 10,
      episodeId: 1,
      isLoggedIn: true,
      userId: 8,
      guestLimit: 10,
      memberLimit: 40,
      isEpisodeOwned: true,
    });

    expect(result.blocked).toBe(false);
    expect(result.reason).toBeNull();

    const storage = readFreeQuotaStorage();
    expect(storage.users?.["8"]?.["10"]?.episodesRead ?? []).toHaveLength(0);
    expect(localStorageMock.getItem(READ_FREE_QUOTA_STORAGE_KEY)).toBeNull();
  });
});
