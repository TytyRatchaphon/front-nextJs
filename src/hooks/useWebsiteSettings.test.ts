import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/constants/queryKeys";
import { fetchWebsiteSettings } from "@/services/api/userApi";
import type { WebsiteSettingsData, WebsiteSettingsResponse } from "@/types/api";

import {
  WEBSITE_SETTINGS_QUERY_KEY,
  fetchWebsiteSettingsQuery,
  prefetchWebsiteSettings,
} from "./useWebsiteSettings";

vi.mock("@/services/api/userApi", () => ({
  fetchWebsiteSettings: vi.fn(),
}));

const mockedFetchWebsiteSettings = vi.mocked(fetchWebsiteSettings);

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createSettings = (overrides: Partial<WebsiteSettingsData> = {}): WebsiteSettingsData =>
  ({
    percent: "30",
    address: "Bangkok",
    work_time: "09:00-18:00",
    phone: "0812345678",
    email: "support@enjoybook.test",
    app_store: "",
    play_store: "",
    fb_link: "https://facebook.com/enjoybook",
    line_link: "",
    ig_link: "",
    tiktok_link: "",
    twitter_link: "",
    yt_link: "",
    logo: "logo.png",
    img_error: "error.png",
    img_footer: "footer.png",
    coin: "1",
    freecoin: "2",
    seo_title: "EnjoyBook",
    seo_keyword: "novel",
    seo_description: "Read novels online",
    "7D_Checkin": "enabled",
    ...overrides,
  }) satisfies WebsiteSettingsData;

const createSuccessResponse = (settings = createSettings()): WebsiteSettingsResponse => ({
  code: 200,
  status: "success",
  message: "ok",
  data: settings,
});

describe("useWebsiteSettings query helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the centralized website settings query key", () => {
    expect(WEBSITE_SETTINGS_QUERY_KEY).toEqual(queryKeys.website.settings());
  });

  it("normalizes a successful response to settings data", async () => {
    const settings = createSettings({ logo: "custom-logo.png" });
    mockedFetchWebsiteSettings.mockResolvedValueOnce(createSuccessResponse(settings));

    await expect(fetchWebsiteSettingsQuery()).resolves.toBe(settings);
  });

  it("returns null for missing or non-success responses", async () => {
    mockedFetchWebsiteSettings.mockResolvedValueOnce(null);
    await expect(fetchWebsiteSettingsQuery()).resolves.toBeNull();

    mockedFetchWebsiteSettings.mockResolvedValueOnce({
      ...createSuccessResponse(),
      status: "error",
    });
    await expect(fetchWebsiteSettingsQuery()).resolves.toBeNull();
  });

  it("prefetches website settings into the query cache", async () => {
    const queryClient = createQueryClient();
    const settings = createSettings();
    mockedFetchWebsiteSettings.mockResolvedValueOnce(createSuccessResponse(settings));

    await prefetchWebsiteSettings(queryClient);

    expect(queryClient.getQueryData(WEBSITE_SETTINGS_QUERY_KEY)).toBe(settings);
  });

  it("reuses fresh cache unless forced", async () => {
    const queryClient = createQueryClient();
    mockedFetchWebsiteSettings
      .mockResolvedValueOnce(createSuccessResponse(createSettings({ logo: "first.png" })))
      .mockResolvedValueOnce(createSuccessResponse(createSettings({ logo: "forced.png" })));

    await prefetchWebsiteSettings(queryClient);
    await prefetchWebsiteSettings(queryClient);
    expect(mockedFetchWebsiteSettings).toHaveBeenCalledTimes(1);

    await prefetchWebsiteSettings(queryClient, true);
    expect(mockedFetchWebsiteSettings).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData<WebsiteSettingsData>(WEBSITE_SETTINGS_QUERY_KEY)?.logo).toBe(
      "forced.png",
    );
  });
});
