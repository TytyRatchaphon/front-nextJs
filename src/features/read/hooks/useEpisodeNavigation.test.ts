import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/constants/query";

const mockUseQuery = vi.fn();
const mockFetchBookEpisodes = vi.fn();

vi.mock("react", () => ({
  useMemo: (factory: () => any) => factory(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (config: any) => mockUseQuery(config),
}));

vi.mock("@/services/apiServices", () => ({
  fetchBookEpisodes: (...args: any[]) => mockFetchBookEpisodes(...args),
}));

import { useEpisodeNavigation } from "@/features/read/hooks/useEpisodeNavigation";

describe("useEpisodeNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds query config and computes sorted episode navigation", () => {
    mockUseQuery.mockReturnValue({
      data: {
        groups: [
          {
            group_id: 2,
            name: "Group B",
            list: [
              { ep_id: 30, order_by: 2, name: " EP 30 " },
              { ep_id: 20, order_by: 1, name: " EP 20 " },
            ],
          },
          {
            group_id: 1,
            name: "Group A",
            list: [{ ep_id: 10, order_by: 1, name: " EP 10 " }],
          },
        ],
      },
      error: null,
      isLoading: false,
    });

    const result = useEpisodeNavigation("4007", "20", null);

    expect(mockUseQuery).toHaveBeenCalledWith({
      queryKey: queryKeys.book.episodes("4007"),
      queryFn: expect.any(Function),
      enabled: true,
      staleTime: 5 * 60 * 1000,
    });
    const config = mockUseQuery.mock.calls[0][0];
    config.queryFn();
    expect(mockFetchBookEpisodes).toHaveBeenCalledWith("4007");

    expect(result.allEpisodes.map((ep: any) => ep.ep_id)).toEqual([10, 20, 30]);
    expect(result.displayTitle).toBe("EP 20");
    expect(result.prevEpId).toBe("10");
    expect(result.nextEpId).toBe("30");
    expect(result.episodesError).toBeNull();
    expect(result.isListLoading).toBe(false);
  });

  it("returns loading title when query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: true,
    });

    const result = useEpisodeNavigation("4007", "20", null);

    expect(result.displayTitle).toContain("...");
    expect(result.prevEpId).toBeNull();
    expect(result.nextEpId).toBeNull();
  });

  it("falls back to current episode title when id is not found in list", () => {
    mockUseQuery.mockReturnValue({
      data: {
        groups: [
          {
            group_id: 1,
            name: "Group A",
            list: [{ ep_id: 10, order_by: 1, name: "EP 10" }],
          },
        ],
      },
      error: null,
      isLoading: false,
    });

    const result = useEpisodeNavigation("4007", "999", {
      name: "ตอนพิเศษ",
      epID: "999",
    });

    expect(result.displayTitle).toBe("ตอนพิเศษ");
    expect(result.prevEpId).toBeNull();
    expect(result.nextEpId).toBeNull();
  });

  it("falls back to episode id when names are missing or invalid", () => {
    mockUseQuery.mockReturnValue({
      data: {
        groups: [
          {
            group_id: 1,
            name: "Group A",
            list: [{ ep_id: 10, order_by: 1, name: "EP 10" }],
          },
        ],
      },
      error: null,
      isLoading: false,
    });

    const result = useEpisodeNavigation("4007", "999", {
      name: "EP20-preview",
      title: "",
      ep_id: 456,
    });

    expect(result.displayTitle).toBe("456");
  });

  it("returns disabled query when bookId is empty", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
    });

    useEpisodeNavigation("", "10", null);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });
});
