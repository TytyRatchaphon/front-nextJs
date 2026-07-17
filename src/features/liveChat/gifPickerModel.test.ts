import { describe, expect, it } from "vitest";

import {
  buildTenorApiUrl,
  isAllowedTenorMediaUrl,
  normalizeTenorResults,
} from "./gifPickerModel";

describe("gifPickerModel", () => {
  it("builds featured and search requests with safe defaults", () => {
    const featured = buildTenorApiUrl({ apiKey: "secret", query: "" });
    const search = buildTenorApiUrl({ apiKey: "secret", query: "ขอบคุณ" });

    expect(featured.pathname).toBe("/v2/featured");
    expect(search.pathname).toBe("/v2/search");
    expect(search.searchParams.get("q")).toBe("ขอบคุณ");
    expect(search.searchParams.get("contentfilter")).toBe("high");
    expect(search.searchParams.get("media_filter")).toBe("tinygif");
  });

  it("normalizes usable tiny GIF results and drops malformed entries", () => {
    expect(normalizeTenorResults({
      results: [
        {
          id: "gif-1",
          content_description: "Happy dance",
          media_formats: {
            tinygif: { url: "https://media.tenor.com/abc/tiny.gif", dims: [220, 124] },
          },
        },
        { id: "broken", media_formats: {} },
      ],
    })).toEqual([
      {
        id: "gif-1",
        title: "Happy dance",
        previewUrl: "https://media.tenor.com/abc/tiny.gif",
        downloadUrl: "/api/gifs/media?url=https%3A%2F%2Fmedia.tenor.com%2Fabc%2Ftiny.gif",
        width: 220,
        height: 124,
      },
    ]);
  });

  it("allows only HTTPS media URLs from Tenor's media host", () => {
    expect(isAllowedTenorMediaUrl("https://media.tenor.com/abc/tiny.gif")).toBe(true);
    expect(isAllowedTenorMediaUrl("http://media.tenor.com/abc/tiny.gif")).toBe(false);
    expect(isAllowedTenorMediaUrl("https://media.tenor.com.evil.test/abc.gif")).toBe(false);
    expect(isAllowedTenorMediaUrl("https://example.com/abc.gif")).toBe(false);
  });
});
