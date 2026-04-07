import { beforeEach, describe, expect, it, vi } from "vitest";

const persistCapture = vi.hoisted(() => ({
  options: null as
    | {
        partialize?: (state: unknown) => { settings: Record<string, unknown> | null; lastFetched: number };
      }
    | null,
}));

vi.mock("@/services/api/userApi", () => ({
  fetchWebsiteSettings: vi.fn(),
}));

vi.mock("@/types/errors", () => ({
  getErrorMessage: () => "Unknown error",
}));

vi.mock("zustand/middleware", async () => {
  const actual = await vi.importActual<typeof import("zustand/middleware")>("zustand/middleware");

  return {
    ...actual,
    persist: ((config: unknown, options: unknown) => {
      persistCapture.options = options as typeof persistCapture.options;
      return config;
    }) as typeof actual.persist,
  };
});

describe("websiteStore persist options", () => {
  beforeEach(async () => {
    persistCapture.options = null;
    vi.resetModules();
    await import("./websiteStore");
  });

  it("partialize returns null settings when source settings are null", () => {
    const partialize = persistCapture.options?.partialize;
    expect(partialize).toBeTypeOf("function");

    const partialized = partialize?.({
      settings: null,
      lastFetched: 11,
    }) as { settings: Record<string, unknown> | null; lastFetched: number };

    expect(partialized).toEqual({
      settings: null,
      lastFetched: 11,
    });
  });

  it("partialize keeps only allowed non-empty setting keys", () => {
    const partialize = persistCapture.options?.partialize;
    expect(partialize).toBeTypeOf("function");

    const partialized = partialize?.({
      settings: {
        logo: "logo.png",
        redeembg: "",
        img_error: "error.png",
        img_footer: "footer.png",
        coin: "1",
        freecoin: "2",
        line_link: "",
        fb_link: "https://facebook.com/enjoybook",
        ig_link: "",
        tiktok_link: "",
        yt_link: "",
        twitter_link: "",
        phone: "0812345678",
        email: "mail@test.com",
        address: "Bangkok",
        work_time: "9-18",
        seo_title: "Title",
        seo_keyword: "kw",
        seo_description: "desc",
        app_store: "",
        play_store: "",
        book_conditions: "",
        "7D_Checkin": "enabled",
        percent: "30",
      },
      lastFetched: 22,
    }) as { settings: Record<string, unknown> | null; lastFetched: number };

    expect(partialized.lastFetched).toBe(22);
    expect(partialized.settings).toEqual({
      logo: "logo.png",
      img_error: "error.png",
      img_footer: "footer.png",
      coin: "1",
      freecoin: "2",
      fb_link: "https://facebook.com/enjoybook",
      phone: "0812345678",
      email: "mail@test.com",
      address: "Bangkok",
      work_time: "9-18",
      seo_title: "Title",
      seo_keyword: "kw",
      seo_description: "desc",
      "7D_Checkin": "enabled",
    });
    expect(partialized.settings).not.toHaveProperty("percent");
    expect(partialized.settings).not.toHaveProperty("redeembg");
    expect(partialized.settings).not.toHaveProperty("app_store");
    expect(partialized.settings).not.toHaveProperty("play_store");
    expect(partialized.settings).not.toHaveProperty("book_conditions");
  });

  it("partialize returns null when all allowed keys are empty", () => {
    const partialize = persistCapture.options?.partialize;
    expect(partialize).toBeTypeOf("function");

    const partialized = partialize?.({
      settings: {
        logo: "",
        redeembg: "",
        img_error: "",
        img_footer: "",
        coin: "",
        freecoin: "",
        line_link: "",
        fb_link: "",
        ig_link: "",
        tiktok_link: "",
        yt_link: "",
        twitter_link: "",
        phone: "",
        email: "",
        address: "",
        work_time: "",
        seo_title: "",
        seo_keyword: "",
        seo_description: "",
        app_store: "",
        play_store: "",
        book_conditions: "",
        "7D_Checkin": "",
      },
      lastFetched: 33,
    }) as { settings: Record<string, unknown> | null; lastFetched: number };

    expect(partialized).toEqual({
      settings: null,
      lastFetched: 33,
    });
  });
});

