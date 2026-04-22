import { beforeEach, describe, expect, it, vi } from "vitest";

let stateSetter = vi.fn();
const mockUseState = vi.fn((initial: string) => [initial, stateSetter]);
const mockUseEffect = vi.fn((effect: () => void | (() => void)) => effect());
const mockTrimWhiteEdgesFromImageSrc = vi.fn();

vi.mock("react", () => ({
  useState: (initial: string) => mockUseState(initial),
  useEffect: (effect: () => void | (() => void)) => mockUseEffect(effect),
}));

vi.mock("@/utils/frameImageUtils", () => ({
  trimWhiteEdgesFromImageSrc: (src: string) => mockTrimWhiteEdgesFromImageSrc(src),
}));

import { useTrimmedFrameSrc } from "./useTrimmedFrameSrc";

describe("useTrimmedFrameSrc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stateSetter = vi.fn();
    mockUseState.mockImplementation((initial: string) => [initial, stateSetter]);
  });

  it("returns normalized empty source and skips trimming for empty input", async () => {
    const result = useTrimmedFrameSrc("   ");
    expect(result).toBe("");
    expect(stateSetter).toHaveBeenCalledWith("");
    expect(mockTrimWhiteEdgesFromImageSrc).not.toHaveBeenCalled();
  });

  it("skips trimming for gif sources", async () => {
    const result = useTrimmedFrameSrc("cover.gif");
    expect(result).toBe("cover.gif");
    expect(stateSetter).toHaveBeenCalledWith("cover.gif");
    expect(mockTrimWhiteEdgesFromImageSrc).not.toHaveBeenCalled();
  });

  it("trims non-gif source and updates state with trimmed result", async () => {
    mockTrimWhiteEdgesFromImageSrc.mockResolvedValueOnce("data:image/png;base64,trimmed");
    const result = useTrimmedFrameSrc(" https://img.example.com/frame.png ");

    expect(result).toBe("https://img.example.com/frame.png");
    expect(stateSetter).toHaveBeenCalledWith("https://img.example.com/frame.png");

    await Promise.resolve();
    expect(mockTrimWhiteEdgesFromImageSrc).toHaveBeenCalledWith(
      "https://img.example.com/frame.png"
    );
    expect(stateSetter).toHaveBeenCalledWith("data:image/png;base64,trimmed");
  });

  it("falls back to normalized source when trimming rejects", async () => {
    mockTrimWhiteEdgesFromImageSrc.mockRejectedValueOnce(new Error("trim-failed"));
    useTrimmedFrameSrc("https://img.example.com/error.png");

    await Promise.resolve();
    expect(stateSetter).toHaveBeenCalledWith("https://img.example.com/error.png");
  });
});
