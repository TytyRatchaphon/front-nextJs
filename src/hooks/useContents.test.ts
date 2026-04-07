import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseQuery = vi.fn((config) => config);
const mockFetchBookTrans = vi.fn();
const mockFetchBookTransById = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (config: any) => mockUseQuery(config),
}));

vi.mock("@/services/apiServices", () => ({
  fetchBookTrans: () => mockFetchBookTrans(),
  fetchBookTransById: (id: string) => mockFetchBookTransById(id),
}));

import { useGetBookTrans, useGetBookTransById } from "./useContents";

describe("useContents hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useGetBookTrans builds query config correctly", async () => {
    mockFetchBookTrans.mockResolvedValueOnce([{ book_id: 1 }]);
    const config = useGetBookTrans() as any;

    expect(mockUseQuery).toHaveBeenCalledWith({
      queryKey: ["getAllBookHome"],
      queryFn: expect.any(Function),
    });

    await expect(config.queryFn()).resolves.toEqual([{ book_id: 1 }]);
    expect(mockFetchBookTrans).toHaveBeenCalled();
  });

  it("useGetBookTransById builds query config with enabled flag", async () => {
    mockFetchBookTransById.mockResolvedValueOnce({ book_id: 12 });
    const config = useGetBookTransById("12") as any;

    expect(mockUseQuery).toHaveBeenCalledWith({
      queryKey: ["book", "12"],
      queryFn: expect.any(Function),
      enabled: true,
    });

    await expect(config.queryFn()).resolves.toEqual({ book_id: 12 });
    expect(mockFetchBookTransById).toHaveBeenCalledWith("12");

    useGetBookTransById("");
    expect(mockUseQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });
});
