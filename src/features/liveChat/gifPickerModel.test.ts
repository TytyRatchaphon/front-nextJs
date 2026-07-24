import { describe, expect, it } from "vitest";

import {
  isAllowedGiphyMediaUrl,
  toGifPickerItem,
} from "./gifPickerModel";

describe("gifPickerModel", () => {
  it("uses a small rendition for preview and a naturally sized rendition for upload", () => {
    expect(toGifPickerItem({
      id: "gif-1",
      title: "Happy dance",
      images: {
        fixed_width_small: {
          url: "https://media2.giphy.com/media/abc/100w.gif",
          width: "100",
          height: "80",
        },
        downsized: {
          url: "https://media2.giphy.com/media/abc/giphy-downsized.gif",
          width: "480",
          height: "384",
        },
      },
    })).toEqual({
      id: "gif-1",
      title: "Happy dance",
      previewUrl: "https://media2.giphy.com/media/abc/100w.gif",
      downloadUrl: "/api/gifs/media?url=https%3A%2F%2Fmedia2.giphy.com%2Fmedia%2Fabc%2Fgiphy-downsized.gif",
      width: 480,
      height: 384,
    });
  });

  it("falls back to the preview rendition when no larger rendition exists", () => {
    const item = toGifPickerItem({
      id: "gif-2",
      images: {
        fixed_width_small: {
          url: "https://media.giphy.com/media/def/100w.gif",
          width: "100",
          height: "56",
        },
      },
    });

    expect(item).toMatchObject({
      previewUrl: "https://media.giphy.com/media/def/100w.gif",
      downloadUrl: "/api/gifs/media?url=https%3A%2F%2Fmedia.giphy.com%2Fmedia%2Fdef%2F100w.gif",
      width: 100,
      height: 56,
    });
  });

  it("rejects missing renditions and non-GIPHY media", () => {
    expect(toGifPickerItem({ id: "broken", images: {} })).toBeNull();
    expect(toGifPickerItem({
      id: "external",
      images: { fixed_width_small: { url: "https://example.com/a.gif" } },
    })).toBeNull();
  });

  it("allows only HTTPS media URLs from GIPHY media hosts", () => {
    expect(isAllowedGiphyMediaUrl("https://media.giphy.com/media/a/a.gif")).toBe(true);
    expect(isAllowedGiphyMediaUrl("https://media3.giphy.com/media/a/a.gif")).toBe(true);
    expect(isAllowedGiphyMediaUrl("https://i.giphy.com/a.gif")).toBe(true);
    expect(isAllowedGiphyMediaUrl("http://media.giphy.com/a.gif")).toBe(false);
    expect(isAllowedGiphyMediaUrl("https://media.giphy.com.evil.test/a.gif")).toBe(false);
  });
});
