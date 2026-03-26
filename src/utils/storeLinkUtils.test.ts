import { describe, expect, it } from "vitest";
import {
  DEFAULT_APP_STORE_URL,
  DEFAULT_PLAY_STORE_URL,
  normalizeAppStoreUrl,
  normalizePlayStoreUrl,
} from "./storeLinkUtils";

describe("storeLinkUtils", () => {
  it("converts itms-appss scheme to https for app store links", () => {
    const result = normalizeAppStoreUrl(
      "itms-appss://apps.apple.com/th/app/enjoybook/id6615066201"
    );

    expect(result).toBe("https://apps.apple.com/th/app/enjoybook/id6615066201");
  });

  it("falls back to default app store when play store link is passed", () => {
    const result = normalizeAppStoreUrl(
      "https://play.google.com/store/apps/details?id=com.enjoybook.enjoyread"
    );

    expect(result).toBe(DEFAULT_APP_STORE_URL);
  });

  it("falls back to default app store for non-http custom schemes", () => {
    const result = normalizeAppStoreUrl("app://open-store");
    expect(result).toBe(DEFAULT_APP_STORE_URL);
  });

  it("converts market:// to web play store url", () => {
    const result = normalizePlayStoreUrl("market://details?id=com.enjoybook.enjoyread");

    expect(result).toBe(
      "https://play.google.com/store/details?id=com.enjoybook.enjoyread"
    );
  });

  it("falls back to default play store when apple url is passed", () => {
    const result = normalizePlayStoreUrl(
      "https://apps.apple.com/th/app/enjoybook/id6615066201"
    );

    expect(result).toBe(DEFAULT_PLAY_STORE_URL);
  });

  it("keeps valid http short links for play store", () => {
    const result = normalizePlayStoreUrl("https://bit.ly/enjoybook-android");
    expect(result).toBe("https://bit.ly/enjoybook-android");
  });
});
