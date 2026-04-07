import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { trimWhiteEdgesFromImageSrc } from "./frameImageUtils";

const originalWindow = (globalThis as any).window;
const originalDocument = (globalThis as any).document;

type CanvasContextMock = {
  drawImage: ReturnType<typeof vi.fn>;
  getImageData: ReturnType<typeof vi.fn>;
  putImageData: ReturnType<typeof vi.fn>;
};

const createSourceContext = (pixels: Uint8ClampedArray, width: number, height: number): CanvasContextMock => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(pixels),
    width,
    height,
  })),
  putImageData: vi.fn(),
});

const createResultContext = () => ({
  drawImage: vi.fn(),
});

const setupBrowserCanvasEnv = (options: {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  imageShouldFail?: boolean;
  sourceCtxAvailable?: boolean;
  resultCtxAvailable?: boolean;
  toDataUrlThrows?: boolean;
  dataUrl?: string;
}) => {
  const sourceCtx =
    options.sourceCtxAvailable === false
      ? null
      : createSourceContext(options.pixels, options.width, options.height);
  const resultCtx = options.resultCtxAvailable === false ? null : createResultContext();
  const outputDataUrl = options.dataUrl ?? "data:image/png;base64,trimmed";

  const sourceCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => sourceCtx),
    toDataURL: vi.fn(() => outputDataUrl),
  };

  const resultCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => resultCtx),
    toDataURL: vi.fn(() => {
      if (options.toDataUrlThrows) {
        throw new Error("toDataURL failed");
      }
      return outputDataUrl;
    }),
  };

  let createdCount = 0;
  const documentMock = {
    createElement: vi.fn((tag: string) => {
      if (tag !== "canvas") throw new Error(`Unexpected element: ${tag}`);
      createdCount += 1;
      return createdCount === 1 ? sourceCanvas : resultCanvas;
    }),
  };

  let imageLoadCount = 0;
  class MockImage {
    public onload: (() => void) | null = null;
    public onerror: (() => void) | null = null;
    public crossOrigin = "";
    public decoding = "";
    public naturalWidth = options.width;
    public naturalHeight = options.height;
    public width = options.width;
    public height = options.height;

    set src(_value: string) {
      imageLoadCount += 1;
      if (options.imageShouldFail) {
        this.onerror?.();
        return;
      }
      this.onload?.();
    }
  }

  (globalThis as any).window = { Image: MockImage };
  (globalThis as any).document = documentMock;

  return {
    sourceCtx,
    resultCtx,
    sourceCanvas,
    resultCanvas,
    documentMock,
    getImageLoadCount: () => imageLoadCount,
  };
};

describe("frameImageUtils", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }

    if (originalDocument === undefined) {
      delete (globalThis as any).document;
    } else {
      (globalThis as any).document = originalDocument;
    }
  });

  it("returns normalized empty value for blank source", async () => {
    await expect(trimWhiteEdgesFromImageSrc("   ")).resolves.toBe("");
  });

  it("returns original source when window is not available", async () => {
    delete (globalThis as any).window;
    await expect(trimWhiteEdgesFromImageSrc("https://img.example.com/frame.png")).resolves.toBe(
      "https://img.example.com/frame.png"
    );
  });

  it("returns original source for GIF or unsupported extensions", async () => {
    await expect(trimWhiteEdgesFromImageSrc("https://img.example.com/frame.gif")).resolves.toBe(
      "https://img.example.com/frame.gif"
    );
    await expect(trimWhiteEdgesFromImageSrc("https://img.example.com/frame.jpg")).resolves.toBe(
      "https://img.example.com/frame.jpg"
    );
  });

  it("returns original source when image loading fails", async () => {
    setupBrowserCanvasEnv({
      width: 3,
      height: 3,
      pixels: new Uint8ClampedArray(3 * 3 * 4),
      imageShouldFail: true,
    });

    const src = "https://img.example.com/fail-load.png";
    await expect(trimWhiteEdgesFromImageSrc(src)).resolves.toBe(src);
  });

  it("returns original source when dimensions/context are invalid", async () => {
    const srcInvalidSize = "https://img.example.com/invalid-size.png";
    setupBrowserCanvasEnv({
      width: 0,
      height: 0,
      pixels: new Uint8ClampedArray(0),
    });
    await expect(trimWhiteEdgesFromImageSrc(srcInvalidSize)).resolves.toBe(srcInvalidSize);

    const srcNoCtx = "https://img.example.com/no-source-context.png";
    setupBrowserCanvasEnv({
      width: 3,
      height: 3,
      pixels: new Uint8ClampedArray(3 * 3 * 4),
      sourceCtxAvailable: false,
    });
    await expect(trimWhiteEdgesFromImageSrc(srcNoCtx)).resolves.toBe(srcNoCtx);
  });

  it("returns original source when no visible pixels remain after trimming", async () => {
    const whitePixels = new Uint8ClampedArray([
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
      255, 255, 255, 255,
    ]);

    setupBrowserCanvasEnv({
      width: 2,
      height: 2,
      pixels: whitePixels,
    });

    const src = "https://img.example.com/all-white.png";
    await expect(trimWhiteEdgesFromImageSrc(src)).resolves.toBe(src);
  });

  it("returns original source when nothing changes and bounds are same", async () => {
    const solidContent = new Uint8ClampedArray([
      10, 10, 10, 255,
      20, 20, 20, 255,
      30, 30, 30, 255,
      40, 40, 40, 255,
    ]);

    setupBrowserCanvasEnv({
      width: 2,
      height: 2,
      pixels: solidContent,
    });

    const src = "https://img.example.com/no-change.png";
    await expect(trimWhiteEdgesFromImageSrc(src)).resolves.toBe(src);
  });

  it("returns cropped data URL when white borders are trimmed", async () => {
    const whiteEdgeCenterContent = new Uint8ClampedArray([
      // row 0
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
      // row 1
      255, 255, 255, 255, 10, 10, 10, 255, 255, 255, 255, 255,
      // row 2
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    ]);

    const env = setupBrowserCanvasEnv({
      width: 3,
      height: 3,
      pixels: whiteEdgeCenterContent,
      dataUrl: "data:image/png;base64,cropped",
    });

    const src = "https://img.example.com/trim-success.png";
    await expect(trimWhiteEdgesFromImageSrc(src)).resolves.toBe("data:image/png;base64,cropped");

    expect(env.sourceCtx?.putImageData).toHaveBeenCalled();
    expect(env.resultCtx?.drawImage).toHaveBeenCalled();
  });

  it("returns original source when result context is unavailable or toDataURL fails", async () => {
    const whiteEdgeCenterContent = new Uint8ClampedArray([
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
      255, 255, 255, 255, 10, 10, 10, 255, 255, 255, 255, 255,
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    ]);

    const srcNoResultCtx = "https://img.example.com/no-result-context.png";
    setupBrowserCanvasEnv({
      width: 3,
      height: 3,
      pixels: whiteEdgeCenterContent,
      resultCtxAvailable: false,
    });
    await expect(trimWhiteEdgesFromImageSrc(srcNoResultCtx)).resolves.toBe(srcNoResultCtx);

    const srcToDataUrlFail = "https://img.example.com/to-data-url-fail.png";
    setupBrowserCanvasEnv({
      width: 3,
      height: 3,
      pixels: whiteEdgeCenterContent,
      toDataUrlThrows: true,
    });
    await expect(trimWhiteEdgesFromImageSrc(srcToDataUrlFail)).resolves.toBe(srcToDataUrlFail);
  });

  it("uses cache for same source + options key", async () => {
    const whiteEdgeCenterContent = new Uint8ClampedArray([
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
      255, 255, 255, 255, 10, 10, 10, 255, 255, 255, 255, 255,
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    ]);

    const env = setupBrowserCanvasEnv({
      width: 3,
      height: 3,
      pixels: whiteEdgeCenterContent,
      dataUrl: "data:image/png;base64,cached",
    });

    const src = "https://img.example.com/cache-test.png";
    const first = await trimWhiteEdgesFromImageSrc(src, { padding: 0 });
    const second = await trimWhiteEdgesFromImageSrc(src, { padding: 0 });

    expect(first).toBe("data:image/png;base64,cached");
    expect(second).toBe("data:image/png;base64,cached");
    expect(env.getImageLoadCount()).toBe(1);
  });
});
