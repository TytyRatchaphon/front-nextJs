import { beforeEach, describe, expect, it, vi } from "vitest";

import secureProxyClient from "../secureProxyClient";
import {
  MyBookValidationError,
  buildMyBookFormData,
  createMyBook,
  updateMyBook,
} from "./myBookWriteApi";

vi.mock("../secureProxyClient", () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedSecureProxyClient = secureProxyClient as unknown as {
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

describe("myBookWriteApi", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("buildMyBookFormData maps keys and appends new fast settings fields", () => {
    const coverFile = new File(["cover"], "cover.jpg", { type: "image/jpeg" });
    const bannerFile = new File(["banner"], "banner.jpg", { type: "image/jpeg" });
    const gifFile = new File(["gif"], "cover.gif", { type: "image/gif" });

    const formData = buildMyBookFormData(
      {
        name: "Book Name",
        tag: ["action", "fantasy"],
        imgBook: coverFile,
        bgimg: bannerFile,
        img_gif: gifFile,
        fast_ticket_daily_increase: 1,
        fast_coin_daily_increase: "5",
        fast_ep_days: 7,
      },
      { bannerFieldKey: "bgimg" }
    );

    expect(formData.get("accept_conditions")).toBe("true");
    expect(formData.get("name")).toBe("Book Name");
    expect(formData.get("tag")).toBe("action,fantasy");
    expect(formData.get("img")).toBeInstanceOf(File);
    expect(formData.get("bgimg")).toBeInstanceOf(File);
    expect(formData.get("img_gif")).toBeInstanceOf(File);
    expect(formData.get("fast_ticket_daily_increase")).toBe("1");
    expect(formData.get("fast_coin_daily_increase")).toBe("5");
    expect(formData.get("fast_ep_days")).toBe("7");
  });

  it("buildMyBookFormData skips empty and non-file values for image fields", () => {
    const formData = buildMyBookFormData(
      {
        imgBook: "https://example.com/cover.jpg",
        bgimg: "https://example.com/banner.jpg",
        fast_ep_days: "",
        fast_ticket_daily_increase: undefined,
        fast_coin_daily_increase: null,
      },
      { bannerFieldKey: "bgimg" }
    );

    expect(formData.get("accept_conditions")).toBe("true");
    expect(formData.has("img")).toBe(false);
    expect(formData.has("bgimg")).toBe(false);
    expect(formData.has("fast_ep_days")).toBe(false);
    expect(formData.has("fast_ticket_daily_increase")).toBe(false);
    expect(formData.has("fast_coin_daily_increase")).toBe(false);
  });

  it("buildMyBookFormData validates file size for image and gif fields", () => {
    const bigImage = new File([new Uint8Array(2_000_001)], "big.jpg", { type: "image/jpeg" });
    expect(() =>
      buildMyBookFormData({ imgBook: bigImage }, { bannerFieldKey: "bgimg" })
    ).toThrowError(new MyBookValidationError("รูปภาพต้องมีขนาดไม่เกิน 2 MB"));

    const bigGif = new File([new Uint8Array(10_000_001)], "big.gif", { type: "image/gif" });
    expect(() =>
      buildMyBookFormData({ img_gif: bigGif }, { bannerFieldKey: "bgimg" })
    ).toThrowError(new MyBookValidationError("ไฟล์ GIF ต้องมีขนาดไม่เกิน 10 MB"));
  });

  it("createMyBook and updateMyBook call endpoints with multipart form-data", async () => {
    mockedSecureProxyClient.post.mockResolvedValueOnce({ data: { status: "ok" }, status: 200 });
    await expect(
      createMyBook({
        name: "New Book",
        fast_ep_days: 7,
      })
    ).resolves.toEqual({ data: { status: "ok" }, status: 200 });

    expect(mockedSecureProxyClient.post).toHaveBeenCalledTimes(1);
    const [createUrl, createFormData, createConfig] = mockedSecureProxyClient.post.mock.calls[0];
    expect(createUrl).toBe("/user/mybook");
    expect(createConfig).toEqual({
      headers: { "Content-Type": "multipart/form-data" },
    });
    expect((createFormData as FormData).get("fast_ep_days")).toBe("7");

    mockedSecureProxyClient.put.mockResolvedValueOnce({ data: { status: "ok" }, status: 200 });
    const newBanner = new File(["banner"], "new-banner.jpg", { type: "image/jpeg" });
    await expect(
      updateMyBook("123", {
        name: "Edited Book",
        bgimg: newBanner,
        fast_ticket_daily_increase: 2,
      })
    ).resolves.toEqual({ data: { status: "ok" }, status: 200 });

    expect(mockedSecureProxyClient.put).toHaveBeenCalledTimes(1);
    const [updateUrl, updateFormData, updateConfig] = mockedSecureProxyClient.put.mock.calls[0];
    expect(updateUrl).toBe("/user/mybook/123");
    expect(updateConfig).toEqual({
      headers: { "Content-Type": "multipart/form-data" },
    });
    expect((updateFormData as FormData).has("bgImg")).toBe(true);
    expect((updateFormData as FormData).has("bgimg")).toBe(false);
    expect((updateFormData as FormData).get("fast_ticket_daily_increase")).toBe("2");
  });
});
