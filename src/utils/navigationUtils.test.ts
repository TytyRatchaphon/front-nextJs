import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCoinEnjoyTopupUrl,
  navigateSafely,
  openSafeExternalInNewTab,
  resolveSafeNavigationUrl,
} from "./navigationUtils";

describe("navigationUtils", () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    (globalThis as any).window = {
      location: {
        origin: "https://enjoybook.co",
        assign: vi.fn(),
        replace: vi.fn(),
      },
      open: vi.fn(),
    };
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
  });

  it("rejects unsafe schemes and control characters", () => {
    expect(resolveSafeNavigationUrl("javascript:alert(1)")).toBeNull();
    expect(resolveSafeNavigationUrl("data:text/html,abc")).toBeNull();
    expect(resolveSafeNavigationUrl("https://ok.test/\u0000bad")).toBeNull();
  });

  it("allows relative urls directly", () => {
    expect(resolveSafeNavigationUrl("/book/1")).toBe("/book/1");
    expect(resolveSafeNavigationUrl("?tab=all")).toBe("?tab=all");
    expect(resolveSafeNavigationUrl("#section")).toBe("#section");
  });

  it("normalizes same-app absolute urls to path when external is not allowed", () => {
    expect(resolveSafeNavigationUrl("https://enjoybook.co/book/1?x=1#y")).toBe("/book/1?x=1#y");
    expect(resolveSafeNavigationUrl("https://www.enjoybook.co/profile/2")).toBe("/profile/2");
  });

  it("blocks external urls by default but allows when allowExternal=true", () => {
    expect(resolveSafeNavigationUrl("https://google.com/path")).toBeNull();
    expect(resolveSafeNavigationUrl("https://google.com/path", { allowExternal: true })).toBe("https://google.com/path");
  });

  it("navigateSafely uses assign/replace correctly", () => {
    expect(navigateSafely("/book/1")).toBe(true);
    expect((globalThis as any).window.location.assign).toHaveBeenCalledWith("/book/1");

    expect(navigateSafely("/book/2", { replace: true })).toBe(true);
    expect((globalThis as any).window.location.replace).toHaveBeenCalledWith("/book/2");
  });

  it("openSafeExternalInNewTab uses safe target features", () => {
    expect(openSafeExternalInNewTab("https://google.com")).toBe(true);
    expect((globalThis as any).window.open).toHaveBeenCalledWith(
      "https://google.com/",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("buildCoinEnjoyTopupUrl includes sanitized token only when valid", () => {
    const withToken = buildCoinEnjoyTopupUrl(`Bearer "abc_123-XYZ"`);
    expect(withToken).toContain("https://coinenjoy.enjoybook.co/");
    expect(withToken).toContain("tk=abc_123-XYZ");

    const withoutToken = buildCoinEnjoyTopupUrl("abc=123");
    expect(withoutToken).toBe("https://coinenjoy.enjoybook.co/");
  });
});

