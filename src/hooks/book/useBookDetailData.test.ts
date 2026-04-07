import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  keepPreviousDataMock,
  mockUseQuery,
  mockFetchBookDetail,
  mockFetchBookEpisodes,
  mockFetchUserShelve,
  mockFetchBookPurchaseDetails,
  mockFetchNovelPackCheck,
  mockResolveBookCoverImageSrc,
} = vi.hoisted(() => ({
  keepPreviousDataMock: Symbol("keepPreviousData"),
  mockUseQuery: vi.fn(),
  mockFetchBookDetail: vi.fn(),
  mockFetchBookEpisodes: vi.fn(),
  mockFetchUserShelve: vi.fn(),
  mockFetchBookPurchaseDetails: vi.fn(),
  mockFetchNovelPackCheck: vi.fn(),
  mockResolveBookCoverImageSrc: vi.fn(),
}));

vi.mock("react", () => ({
  useMemo: (factory: () => any) => factory(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (config: any) => mockUseQuery(config),
  keepPreviousData: keepPreviousDataMock,
}));

vi.mock("@/services/apiServices", () => ({
  fetchBookDetail: (...args: any[]) => mockFetchBookDetail(...args),
  fetchBookEpisodes: (...args: any[]) => mockFetchBookEpisodes(...args),
  fetchUserShelve: (...args: any[]) => mockFetchUserShelve(...args),
  fetchBookPurchaseDetails: (...args: any[]) => mockFetchBookPurchaseDetails(...args),
  fetchNovelPackCheck: (...args: any[]) => mockFetchNovelPackCheck(...args),
}));

vi.mock("@/utils/imageUtils", () => ({
  resolveBookCoverImageSrc: (...args: any[]) => mockResolveBookCoverImageSrc(...args),
}));

import { useBookDetailData } from "@/hooks/book/useBookDetailData";

describe("useBookDetailData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps book detail response and computes derived values correctly", async () => {
    const bookDetail = {
      book_id: 4007,
      isFollowing: false,
      img: "book-thumb.webp",
      img_full: "book-full.jpg",
      img_gif: "book.gif",
      img_gif_full: "book-full.gif",
      name: "วสันต์รัญจวน",
      title: "เรื่องย่อ",
      category1: { name: "แฟนตาซี" },
      category2: { name: "โรแมนติก" },
      writer: {
        user_id: 99,
        writer_name: "OneYY",
        img: "writer.jpg",
        isFollowing: true,
      },
      view: 1234,
      chapter: 12,
      comment: 8,
      heart: 40,
      flower: 5,
      remaining_paid: { total: 10, count: 3 },
      total_remaining: { total: 30, count: 12 },
      price: 299,
      discount_full_book: {
        dfb_id: 2,
        subject: "ลดราคา",
        start_date: "2026-03-01",
        end_date: "2026-03-31",
        discount_percent: 50,
        rewards: [
          { order_by: 2, reward: "B" },
          { order_by: 1, reward: "A" },
        ],
      },
      tag: "boylove,โรแมนติก",
      date_at: "2026-03-01",
      end: "not_end",
      rate: 4,
      star: 5,
      update_at: "2026-03-01T00:00:00.000Z",
      des: "<p>desc</p>",
      cat1: 1,
      cat2: 2,
      status: "publish",
      writer_name: "OneYY",
    };

    const episodesData = {
      groups: [
        {
          group_id: 1,
          list: [
            { ep_id: 111, publish_datetime: "2026-03-02T00:00:00.000Z" },
            { ep_id: 112, publish_datetime: "2026-03-03T00:00:00.000Z" },
          ],
        },
      ],
    };

    const purchaseDetails = {
      fast_ticket: 7,
      remaining_paid_total: 88,
      remaining_paid_count: 4,
      total_remaining_count: 12,
      total_remaining_total: 255,
      remaining_promo_total_discount: 149,
      discount_full_book: {
        dfb_id: 99,
        subject: "โปรโมชั่นใหม่",
        start_date: "2026-03-10",
        end_date: "2026-03-20",
        discount_percent: 40,
        rewards: [
          { order_by: 10, reward: "x" },
          { order_by: 1, reward: "y" },
        ],
      },
    };

    const userShelf = [{ book_id: "4007" }];
    const novelPackCheck = { btn_novel: 3676, btn_novel_pack: 4821, content_type: "novel_pack" };

    mockUseQuery.mockImplementation((config: any) => {
      const key = config.queryKey[0];
      if (key === "bookDetail") {
        return { data: bookDetail, isLoading: false, isError: false, error: null };
      }
      if (key === "userShelf") {
        return { data: userShelf };
      }
      if (key === "bookEpisodes") {
        return { data: episodesData, isLoading: false, isError: false };
      }
      if (key === "bookPurchaseDetails") {
        return { data: purchaseDetails };
      }
      if (key === "novelPackCheck") {
        return { data: novelPackCheck };
      }
      return {};
    });

    mockResolveBookCoverImageSrc.mockReturnValue("/resolved-cover.jpg");

    const result = useBookDetailData("4007", "token-abc", true);

    const configs = mockUseQuery.mock.calls.map((call) => call[0]);
    expect(configs).toHaveLength(5);
    await Promise.all(configs.map((cfg) => cfg.queryFn()));
    expect(mockFetchBookDetail).toHaveBeenCalledWith("4007");
    expect(mockFetchBookEpisodes).toHaveBeenCalledWith("4007");
    expect(mockFetchBookPurchaseDetails).toHaveBeenCalledWith("4007");
    expect(mockFetchUserShelve).toHaveBeenCalled();
    expect(mockFetchNovelPackCheck).toHaveBeenCalledWith("4007");

    expect(mockResolveBookCoverImageSrc).toHaveBeenCalledWith(
      {
        img: "book-thumb.webp",
        img_full: "book-full.jpg",
        img_gif: "book.gif",
        img_gif_full: "book-full.gif",
      },
      "/images/book.png",
      "book",
    );

    expect(result.book).toEqual(
      expect.objectContaining({
        id: 4007,
        isAddedToShelf: true,
        cover: "/resolved-cover.jpg",
        title: "วสันต์รัญจวน",
        tag: "แฟนตาซี",
        category2: "โรแมนติก",
        firstEpisodeId: 111,
        fastTicket: 7,
        remaining_paid_total: 88,
        remaining_paid_count: 4,
        total_remaining_count: 12,
        total_remaining_total: 255,
        tags: ["boylove", "โรแมนติก"],
        update_at: "2026-03-03T00:00:00.000Z",
      }),
    );
    expect(result.book?.promotion?.id).toBe(99);
    expect(result.book?.promotion?.rewards).toEqual([
      { order_by: 1, reward: "y" },
      { order_by: 10, reward: "x" },
    ]);
    expect(result.book?.writer).toEqual({
      user_id: 99,
      writer_name: "OneYY",
      img: "writer.jpg",
      isFollowing: true,
    });
    expect(result.novelPackCheck).toEqual(novelPackCheck);
    expect(result.isLoading).toBe(false);
    expect(result.isError).toBe(false);
  });

  it("returns null transformed book and combines error/loading flags", () => {
    mockUseQuery.mockImplementation((config: any) => {
      const key = config.queryKey[0];
      if (key === "bookDetail") {
        return { data: null, isLoading: true, isError: true, error: new Error("detail error") };
      }
      if (key === "bookEpisodes") {
        return { data: undefined, isLoading: false, isError: true };
      }
      return { data: null };
    });

    const result = useBookDetailData("4007", null, true);

    expect(result.book).toBeNull();
    expect(result.bookDetail).toBeNull();
    expect(result.isLoading).toBe(true);
    expect(result.isError).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
  });

  it("sets query enabled flags correctly when missing readiness/token", () => {
    mockUseQuery.mockImplementation(() => ({ data: null, isLoading: false, isError: false, error: null }));

    useBookDetailData("", null, false);

    const configs = mockUseQuery.mock.calls.map((call) => call[0]);
    expect(configs).toHaveLength(5);
    expect(configs[0]).toEqual(
      expect.objectContaining({
        queryKey: ["bookDetail", ""],
        enabled: false,
        placeholderData: keepPreviousDataMock,
      }),
    );
    expect(configs[1]).toEqual(expect.objectContaining({ queryKey: ["userShelf", null], enabled: false }));
    expect(configs[2]).toEqual(
      expect.objectContaining({
        queryKey: ["bookEpisodes", ""],
        enabled: false,
        placeholderData: keepPreviousDataMock,
      }),
    );
    expect(configs[3]).toEqual(expect.objectContaining({ queryKey: ["bookPurchaseDetails", "", null], enabled: false }));
    expect(configs[4]).toEqual(expect.objectContaining({ queryKey: ["novelPackCheck", ""], enabled: false }));
  });

  it("uses user fallback writer, default price, and empty tags when data is sparse", () => {
    const sparseBookDetail: any = {
      book_id: 5020,
      name: "book sparse",
      title: "desc",
      user: {
        user_id: 700,
        fullname: "Fallback Writer",
        img: "user.jpg",
      },
      view: 1,
      chapter: 1,
      comment: 0,
      heart: 0,
      flower: 0,
      tag: null,
      cat1: 23,
      cat2: 24,
      end: "not_end",
      rate: 3,
      star: 0,
      update_at: "2026-03-01T00:00:00.000Z",
      "category1.name": "หมวดหลัก",
      "category2.name": "หมวดย่อย",
      status: "wait",
    };

    const episodesData = {
      groups: [
        {
          group_id: 1,
          list: [
            { ep_id: 10, created_at: "2026-03-02T00:00:00.000Z" },
            { ep_id: 11, created_at: "invalid-date" },
          ],
        },
        { group_id: 2, list: null },
      ],
    };

    mockUseQuery.mockImplementation((config: any) => {
      const key = config.queryKey[0];
      if (key === "bookDetail") {
        return { data: sparseBookDetail, isLoading: false, isError: false, error: null };
      }
      if (key === "userShelf") {
        return { data: "not-array" };
      }
      if (key === "bookEpisodes") {
        return { data: episodesData, isLoading: false, isError: false };
      }
      if (key === "bookPurchaseDetails") {
        return { data: undefined };
      }
      if (key === "novelPackCheck") {
        return { data: undefined };
      }
      return {};
    });

    mockResolveBookCoverImageSrc.mockReturnValue("/fallback-cover.jpg");

    const result = useBookDetailData("5020", "token", true);

    expect(result.book).toEqual(
      expect.objectContaining({
        id: 5020,
        isAddedToShelf: false,
        writer: {
          user_id: 700,
          writer_name: "Fallback Writer",
          img: "user.jpg",
          isFollowing: false,
        },
        price: 2299,
        tag: "หมวดหลัก",
        category2: "หมวดย่อย",
        tags: [],
        promotion: undefined,
        update_at: "2026-03-02T00:00:00.000Z",
      }),
    );
  });
});
