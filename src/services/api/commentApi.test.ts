import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  deleteBookComment,
  deleteBookCommentReply,
  deleteBookReview,
  deleteBookReviewReply,
  deleteEpisodeComment,
  deleteEpisodeReply,
  deleteReviewComment,
  deleteUserReview,
  fetchBookComments,
  fetchBookReviews,
  fetchBookReviewsNew,
  fetchEpisodeComments,
  fetchPinnedReviews,
  fetchReviewById,
  fetchReviewComments,
  likeReview,
  postBookReview,
  postCommentReply,
  postEpisodeComment,
  postEpisodeReply,
  postPinnedReview,
  postReply,
  postReviewComment,
  reportBookComment,
  reportBookCommentReply,
  reportBookReview,
  reportBookReviewReply,
  reportEpisodeComment,
  reportEpisodeReply,
  reportReviewOrComment,
  shareReview,
  updateBookReview,
} from "./commentApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("commentApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchPinnedReviews", () => {
    it("uses default query params and returns reviews + pagination", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { reviews: [{ review_id: 1 }], pagination: { page: 1 } } },
      });

      const result = await fetchPinnedReviews();

      expect(mockedApiClient.get).toHaveBeenCalledWith("/review/feed", {
        params: { sort: "liked", limit: 12, page: 1 },
      });
      expect(result).toEqual({
        reviews: [{ review_id: 1 }],
        pagination: { page: 1 },
      });
    });

    it("supports custom params and safe fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: {} });

      const result = await fetchPinnedReviews({
        sort: "latest",
        limit: 5,
        page: 2,
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith("/review/feed", {
        params: { sort: "latest", limit: 5, page: 2 },
      });
      expect(result).toEqual({ reviews: [] });
    });

    it("returns empty list on request error", async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));

      await expect(fetchPinnedReviews()).resolves.toEqual({ reviews: [] });
    });
  });

  describe("fetchBookReviewsNew", () => {
    it("returns new review feed with pagination", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { reviews: [{ review_id: 99 }], pagination: { page: 3 } } },
      });

      const result = await fetchBookReviewsNew(88, "liked", 3);

      expect(mockedApiClient.get).toHaveBeenCalledWith("/review/book/88", {
        params: { sort: "liked", page: 3 },
      });
      expect(result).toEqual({
        reviews: [{ review_id: 99 }],
        pagination: { page: 3 },
      });
    });

    it("returns safe fallback when API fails", async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchBookReviewsNew(88)).resolves.toEqual({ reviews: [] });
    });
  });

  describe("fetchBookReviews", () => {
    it("maps comment_data payload shape", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: { comment_data: [{ commentBook_id: 7 }], pagination: { total: 1 } },
        },
      });

      const result = await fetchBookReviews(777, 2, 20, "newest");

      expect(mockedApiClient.get).toHaveBeenCalledWith("/bookdetail/777/reviews", {
        params: { page: 2, limit: 20, sort: "newest" },
      });
      expect(result).toEqual({
        comments: [{ commentBook_id: 7 }],
        pagination: { total: 1 },
      });
    });

    it("maps array payload shape", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: [{ commentBook_id: 8 }] },
      });

      const result = await fetchBookReviews(777);
      expect(result).toEqual({ comments: [{ commentBook_id: 8 }] });
    });

    it("returns empty comments on invalid payload or error", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { invalid: true } } });
      await expect(fetchBookReviews(777)).resolves.toEqual({ comments: [] });

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchBookReviews(777)).resolves.toEqual({ comments: [] });
    });
  });

  describe("fetchReviewById", () => {
    it("supports all known response shapes", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { review: { review_id: 1 } } } });
      await expect(fetchReviewById(1)).resolves.toEqual({ review_id: 1 });

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: { review_id: 2 } } });
      await expect(fetchReviewById(2)).resolves.toEqual({ review_id: 2 });

      mockedApiClient.get.mockResolvedValueOnce({ data: { review: { review_id: 3 } } });
      await expect(fetchReviewById(3)).resolves.toEqual({ review_id: 3 });

      mockedApiClient.get.mockResolvedValueOnce({ data: null });
      await expect(fetchReviewById(4)).resolves.toBeNull();
    });

    it("logs and returns null on error", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));

      await expect(fetchReviewById(5)).resolves.toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("fetchReviewComments", () => {
    it("supports array payload and wrapped payload", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: [{ comment_id: 1 }] },
      });
      await expect(fetchReviewComments(10)).resolves.toEqual({
        comments: [{ comment_id: 1 }],
      });

      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { comments: [{ comment_id: 2 }] } },
      });
      await expect(fetchReviewComments(10)).resolves.toEqual({
        comments: [{ comment_id: 2 }],
      });
    });

    it("returns empty list on missing data and request failure", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: null } });
      await expect(fetchReviewComments(10)).resolves.toEqual({ comments: [] });

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchReviewComments(10)).resolves.toEqual({ comments: [] });
    });
  });

  describe("book comments + episode comments fetchers", () => {
    it("fetchBookComments maps both response shapes and fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: { comment_data: [{ commentEp_id: 1 }], pagination: { total: 1 } },
        },
      });
      await expect(fetchBookComments(5001, 2, 15, "liked")).resolves.toEqual({
        comments: [{ commentEp_id: 1 }],
        pagination: { total: 1 },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/bookdetail/5001/comments", {
        params: { page: 2, limit: 15, sort: "liked" },
      });

      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: [{ commentEp_id: 2 }] },
      });
      await expect(fetchBookComments(5001)).resolves.toEqual({
        comments: [{ commentEp_id: 2 }],
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchBookComments(5001)).resolves.toEqual({ comments: [] });
    });

    it("fetchEpisodeComments maps both response shapes and fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: { comment_data: [{ commentEp_id: 3 }], pagination: { total: 1 } },
        },
      });
      await expect(fetchEpisodeComments(9001, 3, 25, "newest")).resolves.toEqual({
        comments: [{ commentEp_id: 3 }],
        pagination: { total: 1 },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/readep/9001/comments", {
        params: { page: 3, limit: 25, sort: "newest" },
      });

      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: [{ commentEp_id: 4 }] },
      });
      await expect(fetchEpisodeComments(9001)).resolves.toEqual({
        comments: [{ commentEp_id: 4 }],
      });

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchEpisodeComments(9001)).resolves.toEqual({ comments: [] });
    });
  });

  describe("mutation endpoints", () => {
    const postCases = [
      {
        name: "postBookReview",
        call: () => postBookReview(11, "great", 5),
        path: "/bookdetail/11/reviews",
        expectedArgs: [{ comment: "great", star: 5 }],
      },
      {
        name: "postPinnedReview",
        call: () => postPinnedReview(12, 4, "pinned", true),
        path: "/review/book/12",
        expectedArgs: [{ rating: 4, content: "pinned", is_spoiler: true }],
      },
      {
        name: "likeReview",
        call: () => likeReview(13),
        path: "/review/13/like",
      },
      {
        name: "shareReview",
        call: () => shareReview(14),
        path: "/review/14/share",
      },
      {
        name: "postReviewComment",
        call: () => postReviewComment(15, "hello"),
        path: "/review/15/comment",
        expectedArgs: [{ content: "hello" }],
      },
      {
        name: "reportReviewOrComment",
        call: () => reportReviewOrComment("comment", 16),
        path: "/review/report",
        expectedArgs: [{ target_type: "comment", target_id: 16 }],
      },
      {
        name: "postReply",
        call: () => postReply(17, "reply"),
        path: "/bookdetail/reviews/17/replies",
        expectedArgs: [{ comment: "reply" }],
      },
      {
        name: "reportBookReview",
        call: () => reportBookReview(18),
        path: "/bookdetail/reviews/18/report",
      },
      {
        name: "reportBookReviewReply",
        call: () => reportBookReviewReply(19),
        path: "/bookdetail/reviews/replies/19/report",
      },
      {
        name: "postCommentReply",
        call: () => postCommentReply(20, "book-comment-reply"),
        path: "/bookdetail/comments/20/replies",
        expectedArgs: [{ comment: "book-comment-reply" }],
      },
      {
        name: "reportBookComment",
        call: () => reportBookComment(21),
        path: "/bookdetail/comments/21/report",
      },
      {
        name: "reportBookCommentReply",
        call: () => reportBookCommentReply(22),
        path: "/bookdetail/comments/replies/22/report",
      },
      {
        name: "postEpisodeComment",
        call: () => postEpisodeComment(23, "episode-comment"),
        path: "/readep/23/comments",
        expectedArgs: [{ comment: "episode-comment" }],
      },
      {
        name: "postEpisodeReply",
        call: () => postEpisodeReply(24, "episode-reply"),
        path: "/readep/comments/24/replies",
        expectedArgs: [{ comment: "episode-reply" }],
      },
      {
        name: "reportEpisodeComment",
        call: () => reportEpisodeComment(25),
        path: "/readep/comments/25/report",
      },
      {
        name: "reportEpisodeReply",
        call: () => reportEpisodeReply(26),
        path: "/readep/comments/replies/26/report",
      },
    ] as const;

    const putCases = [
      {
        name: "updateBookReview",
        call: () => updateBookReview(31, 5, "updated", false),
        path: "/review/31",
        expectedArgs: [{ rating: 5, content: "updated", is_spoiler: false }],
      },
    ] as const;

    const deleteCases = [
      {
        name: "deleteUserReview",
        call: () => deleteUserReview(41),
        path: "/review/41",
      },
      {
        name: "deleteReviewComment",
        call: () => deleteReviewComment(42, 420),
        path: "/review/42/comment/420",
      },
      {
        name: "deleteBookReview",
        call: () => deleteBookReview(43),
        path: "/bookdetail/reviews/43",
      },
      {
        name: "deleteBookReviewReply",
        call: () => deleteBookReviewReply(44),
        path: "/bookdetail/reviews/replies/44",
      },
      {
        name: "deleteBookComment",
        call: () => deleteBookComment(45),
        path: "/bookdetail/comments/45",
      },
      {
        name: "deleteBookCommentReply",
        call: () => deleteBookCommentReply(46),
        path: "/bookdetail/comments/replies/46",
      },
      {
        name: "deleteEpisodeComment",
        call: () => deleteEpisodeComment(47),
        path: "/readep/comments/47",
      },
      {
        name: "deleteEpisodeReply",
        call: () => deleteEpisodeReply(48),
        path: "/readep/comments/replies/48",
      },
    ] as const;

    it.each(postCases)(
      "POST $name calls expected endpoint and returns response data",
      async ({ call, path, expectedArgs }) => {
        mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });

        await expect(call()).resolves.toEqual({ ok: true });
        expect(mockedApiClient.post).toHaveBeenCalledWith(path, ...(expectedArgs ?? []));
      }
    );

    it.each(putCases)(
      "PUT $name calls expected endpoint and returns response data",
      async ({ call, path, expectedArgs }) => {
        mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });

        await expect(call()).resolves.toEqual({ ok: true });
        expect(mockedApiClient.put).toHaveBeenCalledWith(path, ...(expectedArgs ?? []));
      }
    );

    it.each(deleteCases)(
      "DELETE $name calls expected endpoint and returns response data",
      async ({ call, path }) => {
        mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });

        await expect(call()).resolves.toEqual({ ok: true });
        expect(mockedApiClient.delete).toHaveBeenCalledWith(path);
      }
    );

    it.each(postCases)(
      "POST $name rethrows request errors",
      async ({ call }) => {
        mockedApiClient.post.mockRejectedValueOnce(new Error("mutation-failed"));
        await expect(call()).rejects.toThrow("mutation-failed");
      }
    );

    it.each(putCases)(
      "PUT $name rethrows request errors",
      async ({ call }) => {
        mockedApiClient.put.mockRejectedValueOnce(new Error("mutation-failed"));
        await expect(call()).rejects.toThrow("mutation-failed");
      }
    );

    it.each(deleteCases)(
      "DELETE $name rethrows request errors",
      async ({ call }) => {
        mockedApiClient.delete.mockRejectedValueOnce(new Error("mutation-failed"));
        await expect(call()).rejects.toThrow("mutation-failed");
      }
    );
  });
});
