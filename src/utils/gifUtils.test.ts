import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decompressFrames, parseGIF } from "gifuct-js";

import {
  extractGifFirstFrameAsFile,
  extractGifFrameAsFile,
  getGifFrameCount,
  isGifFile,
  isGifFrameSelectionSupported,
} from "./gifUtils";

vi.mock("gifuct-js", () => ({
  parseGIF: vi.fn(),
  decompressFrames: vi.fn(),
}));

const mockedParseGIF = parseGIF as unknown as ReturnType<typeof vi.fn>;
const mockedDecompressFrames = decompressFrames as unknown as ReturnType<typeof vi.fn>;

const originalWindow = (globalThis as any).window;
const originalDocument = (globalThis as any).document;
const originalURL = (globalThis as any).URL;
const originalImageDecoder = (globalThis as any).ImageDecoder;

const createGifFile = (name = "cover.gif", type = "image/gif") =>
  new File([new Uint8Array([71, 73, 70])], name, { type });

const createNonGifFile = () =>
  new File([new Uint8Array([1, 2, 3])], "cover.jpg", { type: "image/jpeg" });

const makeFrame = (
  width: number,
  height: number,
  disposalType = 0,
  left = 0,
  top = 0,
) => ({
  dims: { width, height, left, top },
  patch: new Uint8ClampedArray(width * height * 4).fill(255),
  disposalType,
});

const setupBrowserEnvForGif = (options?: {
  imageShouldFail?: boolean;
  imageWidth?: number;
  imageHeight?: number;
  nullBlob?: boolean;
}) => {
  const ctx = {
    drawImage: vi.fn(),
    clearRect: vi.fn(),
    putImageData: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    })),
    createImageData: vi.fn((width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    })),
  };

  const makeCanvas = () => ({
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    toBlob: vi.fn((cb: (blob: Blob | null) => void, type?: string) => {
      if (options?.nullBlob) {
        cb(null);
        return;
      }
      cb(new Blob(["gif"], { type: type || "image/jpeg" }));
    }),
  });

  const documentMock = {
    createElement: vi.fn((tag: string) => {
      if (tag !== "canvas") throw new Error(`Unexpected element: ${tag}`);
      return makeCanvas();
    }),
  };

  class MockImage {
    public onload: (() => void) | null = null;
    public onerror: (() => void) | null = null;
    public naturalWidth = options?.imageWidth ?? 10;
    public naturalHeight = options?.imageHeight ?? 10;
    public width = this.naturalWidth;
    public height = this.naturalHeight;

    set src(_value: string) {
      if (options?.imageShouldFail) {
        this.onerror?.();
      } else {
        this.onload?.();
      }
    }
  }

  const urlMock = {
    createObjectURL: vi.fn(() => "blob:gif-mock"),
    revokeObjectURL: vi.fn(),
  };

  (globalThis as any).window = { Image: MockImage };
  (globalThis as any).document = documentMock;
  (globalThis as any).URL = urlMock;

  return { ctx, documentMock, urlMock };
};

describe("gifUtils", () => {
  beforeEach(() => {
    vi.resetAllMocks();
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

    if (originalURL === undefined) {
      delete (globalThis as any).URL;
    } else {
      (globalThis as any).URL = originalURL;
    }

    if (originalImageDecoder === undefined) {
      delete (globalThis as any).ImageDecoder;
    } else {
      (globalThis as any).ImageDecoder = originalImageDecoder;
    }
  });

  it("detects GIF files by mime type or extension", () => {
    expect(isGifFile(createGifFile("a.bin", "image/gif"))).toBe(true);
    expect(isGifFile(createGifFile("a.GIF", "application/octet-stream"))).toBe(true);
    expect(isGifFile(createNonGifFile())).toBe(false);
    expect(isGifFile(null)).toBe(false);
  });

  it("detects frame selection support based on environment", () => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).ImageDecoder;
    expect(isGifFrameSelectionSupported()).toBe(false);

    (globalThis as any).window = {};
    (globalThis as any).document = {};
    delete (globalThis as any).ImageDecoder;
    expect(isGifFrameSelectionSupported()).toBe(true);

    (globalThis as any).ImageDecoder = class {};
    expect(isGifFrameSelectionSupported()).toBe(true);
  });

  it("returns frame count 1 for non-gif input", async () => {
    await expect(getGifFrameCount(createNonGifFile())).resolves.toBe(1);
  });

  it("reads frame count from ImageDecoder when available", async () => {
    const closeSpy = vi.fn();
    class MockDecoder {
      public tracks = {
        ready: Promise.resolve(),
        selectedTrack: { frameCount: 7 },
      };
      public close = closeSpy;
    }
    (globalThis as any).ImageDecoder = MockDecoder;

    await expect(getGifFrameCount(createGifFile())).resolves.toBe(7);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("falls back to gif library frame count when decoder is invalid or unavailable", async () => {
    class InvalidDecoder {
      public tracks = {
        ready: Promise.resolve(),
        selectedTrack: { frameCount: 0 },
      };
      public close = vi.fn();
    }
    (globalThis as any).ImageDecoder = InvalidDecoder;

    mockedParseGIF.mockReturnValueOnce({ lsd: { width: 2, height: 2 } });
    mockedDecompressFrames.mockReturnValueOnce([makeFrame(1, 1), makeFrame(1, 1), makeFrame(1, 1)]);
    await expect(getGifFrameCount(createGifFile("invalid-decoder.gif"))).resolves.toBe(3);

    delete (globalThis as any).ImageDecoder;
    mockedParseGIF.mockImplementationOnce(() => {
      throw new Error("parse-failed");
    });
    await expect(getGifFrameCount(createGifFile("parse-fail.gif"))).resolves.toBe(1);
  });

  it("throws when extracting frame from non-gif input", async () => {
    await expect(extractGifFrameAsFile(createNonGifFile(), 0)).rejects.toThrow(
      "Input file is not GIF"
    );
  });

  it("extracts frame with gifuct-js path when ImageDecoder is unavailable", async () => {
    setupBrowserEnvForGif();
    delete (globalThis as any).ImageDecoder;

    mockedParseGIF.mockReturnValueOnce({ lsd: { width: 2, height: 2 } });
    mockedDecompressFrames.mockReturnValueOnce([
      makeFrame(1, 1, 3),
      makeFrame(1, 1, 2),
      makeFrame(1, 1, 0),
    ]);

    const output = await extractGifFrameAsFile(createGifFile("animated.gif"), 50, {
      outputType: "image/png",
    });

    expect(output.name).toBe("animated-cover.png");
    expect(output.type).toBe("image/png");
  });

  it("falls back to image rendering when gifuct-js extraction fails", async () => {
    const env = setupBrowserEnvForGif();
    delete (globalThis as any).ImageDecoder;

    mockedParseGIF.mockImplementationOnce(() => {
      throw new Error("gif-lib-failed");
    });

    const output = await extractGifFrameAsFile(createGifFile("fallback.gif"), 0);
    expect(output.name).toBe("fallback-cover.jpg");
    expect(env.urlMock.createObjectURL).toHaveBeenCalled();
    expect(env.urlMock.revokeObjectURL).toHaveBeenCalled();
  });

  it("uses ImageDecoder path and clamps frame index", async () => {
    setupBrowserEnvForGif();
    const closeSpy = vi.fn();
    const decodeSpy = vi.fn(async ({ frameIndex }: { frameIndex: number }) => ({
      image: {
        displayWidth: 4,
        displayHeight: 3,
        width: 4,
        height: 3,
        close: vi.fn(),
        frameIndexEcho: frameIndex,
      },
    }));

    class MockDecoder {
      public tracks = {
        ready: Promise.resolve(),
        selectedTrack: { frameCount: 2 },
      };
      public decode = decodeSpy;
      public close = closeSpy;
    }
    (globalThis as any).ImageDecoder = MockDecoder;

    const output = await extractGifFrameAsFile(createGifFile("decoder.gif"), 99, {
      outputType: "image/webp",
    });
    expect(output.name).toBe("decoder-cover.webp");
    expect(decodeSpy).toHaveBeenCalledWith({ frameIndex: 1 });
    expect(closeSpy).toHaveBeenCalled();
  });

  it("falls back from ImageDecoder to gif library and then to image render", async () => {
    const env = setupBrowserEnvForGif();

    class BrokenDecoder {
      public tracks = {
        ready: Promise.resolve(),
        selectedTrack: { frameCount: 3 },
      };
      public close = vi.fn();
      public decode = vi.fn(async () => {
        throw new Error("decode-failed");
      });
    }
    (globalThis as any).ImageDecoder = BrokenDecoder;

    mockedParseGIF.mockReturnValueOnce({ lsd: { width: 2, height: 2 } });
    mockedDecompressFrames.mockReturnValueOnce([makeFrame(2, 2)]);
    const fromLibrary = await extractGifFrameAsFile(createGifFile("decoder-fallback-lib.gif"), 1);
    expect(fromLibrary.name).toBe("decoder-fallback-lib-cover.jpg");

    mockedParseGIF.mockImplementationOnce(() => {
      throw new Error("gif-lib-failed");
    });
    const fromImage = await extractGifFrameAsFile(createGifFile("decoder-fallback-image.gif"), 1);
    expect(fromImage.name).toBe("decoder-fallback-image-cover.jpg");
    expect(env.urlMock.createObjectURL).toHaveBeenCalled();
    expect(env.urlMock.revokeObjectURL).toHaveBeenCalled();
  });

  it("extractGifFirstFrameAsFile delegates to frame 0 extraction", async () => {
    setupBrowserEnvForGif();
    class DecoderForFirstFrame {
      public tracks = {
        ready: Promise.resolve(),
        selectedTrack: { frameCount: 5 },
      };
      public close = vi.fn();
      public decode = vi.fn(async ({ frameIndex }: { frameIndex: number }) => ({
        image: {
          displayWidth: 2,
          displayHeight: 2,
          width: 2,
          height: 2,
          close: vi.fn(),
          frameIndexEcho: frameIndex,
        },
      }));
    }
    (globalThis as any).ImageDecoder = DecoderForFirstFrame;

    const output = await extractGifFirstFrameAsFile(createGifFile("first-frame.gif"));
    expect(output.name).toBe("first-frame-cover.jpg");
  });
});
