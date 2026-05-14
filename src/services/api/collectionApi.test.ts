import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  addBooksToCollection,
  copyCollection,
  createCollection,
  deleteCollection,
  deleteCollectionComment,
  deleteCollectionReply,
  fetchCollectionBooks,
  fetchCollectionComments,
  fetchHiddenBooks,
  fetchUserCollections,
  pinCollections,
  postCollectionComment,
  postCollectionReply,
  removeBookFromCollection,
  reorderBooksInCollection,
  reorderCollections,
  reportCollectionComment,
  reportCollectionReply,
  updateBookVisibility,
  updateCollection,
  updateCollectionDetails,
} from "./collectionApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("collectionApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("read APIs", () => {
    it("fetchUserCollections and fetchCollectionBooks return data or null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
      await expect(fetchUserCollections()).resolves.toEqual([{ id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/collections");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchCollectionBooks(10)).resolves.toBeNull();
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/collections/10");

      mockedApiClient.get.mockRejectedValueOnce(new Error("collections-failed"));
      await expect(fetchUserCollections()).resolves.toBeNull();
    });

    it("fetchCollectionComments passes params and rethrows errors", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { pagination: { page: 1 }, comments: [] } },
      });
      await expect(fetchCollectionComments(5, 2, 30)).resolves.toEqual({
        pagination: { page: 1 },
        comments: [],
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/collections/5/comments", {
        params: { page: 2, limit: 30 },
      });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockedApiClient.get.mockRejectedValueOnce(new Error("comments-failed"));
      await expect(fetchCollectionComments(5)).rejects.toThrow("comments-failed");
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("fetchHiddenBooks returns data or null fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ book_id: 1 }] } });
      await expect(fetchHiddenBooks(7)).resolves.toEqual([{ book_id: 1 }]);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/collections/7/hidden");

      mockedApiClient.get.mockResolvedValueOnce({ data: {} });
      await expect(fetchHiddenBooks(7)).resolves.toBeNull();

      mockedApiClient.get.mockRejectedValueOnce(new Error("hidden-failed"));
      await expect(fetchHiddenBooks(7)).resolves.toBeNull();
    });
  });

  describe("create/update APIs", () => {
    it("createCollection sends multipart form data and rethrows errors", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });
      const cover = new File(["a"], "cover.png", { type: "image/png" });

      await expect(
        createCollection({
          name: "my collection",
          description: "desc",
          is_public: true,
          cover_image: cover,
        })
      ).resolves.toEqual({ code: 200 });

      const [url, body, config] = mockedApiClient.post.mock.calls[0];
      expect(url).toBe("/user/collections");
      expect(body).toBeInstanceOf(FormData);
      expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mockedApiClient.post.mockRejectedValueOnce(new Error("create-failed"));
      await expect(
        createCollection({
          name: "x",
          description: "y",
          is_public: false,
        })
      ).rejects.toThrow("create-failed");
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("updateCollection/updateCollectionDetails hit expected endpoints", async () => {
      mockedApiClient.patch.mockResolvedValueOnce({ data: { ok: true } });
      await expect(updateCollection(11, { is_pinned: true })).resolves.toEqual({ ok: true });
      expect(mockedApiClient.patch).toHaveBeenCalledWith("/user/collections/11", {
        is_pinned: true,
      });

      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });
      const cover = new File(["b"], "cover2.png", { type: "image/png" });
      await expect(
        updateCollectionDetails(12, {
          name: "n",
          description: "d",
          is_public: false,
          cover_image: cover,
        })
      ).resolves.toEqual({ ok: true });

      const [url, body, config] = mockedApiClient.put.mock.calls[0];
      expect(url).toBe("/user/collections/12");
      expect(body).toBeInstanceOf(FormData);
      expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
    });

    it("reorder/pin/visibility APIs send expected payloads", async () => {
      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });
      await expect(reorderCollections([1, 2])).resolves.toEqual({ ok: true });
      expect(mockedApiClient.put).toHaveBeenCalledWith("/user/collections-reorder", {
        items: [1, 2],
      });

      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });
      await expect(pinCollections([3, 4], true)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.put).toHaveBeenCalledWith("/user/collections-pin", {
        ids: [3, 4],
        is_pinned: true,
      });

      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });
      await expect(updateBookVisibility(9, [100, 200], true)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.put).toHaveBeenCalledWith("/user/collections/9/books/visibility", {
        book_ids: [100, 200],
        is_hidden: true,
      });
    });
  });

  describe("book & comment mutation APIs", () => {
    it("add/remove/delete/reorder books call expected endpoints", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(addBooksToCollection(1, ["10", "20"])).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/collections/1/books", {
        book_ids: ["10", "20"],
      });

      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(removeBookFromCollection(2, [10, 20])).resolves.toEqual({ ok: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/user/collections/2/books", {
        data: { book_ids: [10, 20] },
      });

      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(deleteCollection(3)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/user/collections", {
        data: { ids: [3] },
      });

      mockedApiClient.put.mockResolvedValueOnce({ data: { ok: true } });
      await expect(reorderBooksInCollection(4, [5, 6])).resolves.toEqual({ ok: true });
      expect(mockedApiClient.put).toHaveBeenCalledWith("/user/collections/4/books-reorder", {
        items: [5, 6],
      });
    });

    it("comment/reply/report/copy APIs call expected endpoints", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(postCollectionComment(1, "hello")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/collections/1/comments", {
        comment: "hello",
      });

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(postCollectionReply(1, 2, "reply")).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/collections/1/comments/2/reply",
        { comment: "reply" }
      );

      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(deleteCollectionComment(1, 2)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/user/collections/1/comments/2");

      mockedApiClient.delete.mockResolvedValueOnce({ data: { ok: true } });
      await expect(deleteCollectionReply(1, 2, 3)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        "/user/collections/1/comments/2/reply/3"
      );

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(reportCollectionComment(8)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/comments/8/report");

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(reportCollectionReply(9)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/replies/9/report");

      mockedApiClient.post.mockResolvedValueOnce({ data: { ok: true } });
      await expect(copyCollection(99)).resolves.toEqual({ ok: true });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/collections/99/copy");
    });

    it("mutation APIs log and rethrow on errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      mockedApiClient.post.mockRejectedValueOnce(new Error("comment-failed"));
      await expect(postCollectionComment(1, "x")).rejects.toThrow("comment-failed");
      expect(consoleErrorSpy).toHaveBeenCalled();

      mockedApiClient.delete.mockRejectedValueOnce(new Error("delete-comment-failed"));
      await expect(deleteCollectionComment(1, 2)).rejects.toThrow("delete-comment-failed");
      expect(consoleErrorSpy).toHaveBeenCalled();

      mockedApiClient.put.mockRejectedValueOnce(new Error("visibility-failed"));
      await expect(updateBookVisibility(1, [1], false)).rejects.toThrow("visibility-failed");
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
