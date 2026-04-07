import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../apiClient";
import {
  createThread,
  deleteThread,
  deleteThreadComment,
  deleteThreadReply,
  fetchThreadComments,
  fetchThreadDetail,
  fetchThreads,
  postThreadComment,
  postThreadReply,
  reportThreadComment,
  reportThreadReply,
} from "./threadApi";

vi.mock("../apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("threadApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchThreads", () => {
    it("uses default page/limit when no params are provided", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [] } });

      const result = await fetchThreads();

      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/threads", {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual({ data: [] });
    });

    it("merges custom params into request", async () => {
      mockedApiClient.get.mockResolvedValueOnce({ data: { data: [{ topic_id: 1 }] } });

      const result = await fetchThreads({
        page: 3,
        limit: 5,
        type: 2,
        key: "line",
        sort: "newest",
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/threads", {
        params: {
          page: 3,
          limit: 5,
          type: 2,
          key: "line",
          sort: "newest",
        },
      });
      expect(result).toEqual({ data: [{ topic_id: 1 }] });
    });

    it("returns null when request fails", async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchThreads()).resolves.toBeNull();
    });
  });

  describe("create + detail", () => {
    it("createThread posts payload and returns response data", async () => {
      const payload = {
        title: "Topic title",
        rate: "5",
        author: "me",
        type: "1",
        tag: "tag",
        detail: "detail",
      };
      mockedApiClient.post.mockResolvedValueOnce({ data: { code: 200 } });

      const result = await createThread(payload);

      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/threads", payload);
      expect(result).toEqual({ code: 200 });
    });

    it("createThread rethrows request errors", async () => {
      mockedApiClient.post.mockRejectedValueOnce(new Error("create-failed"));
      await expect(
        createThread({
          title: "Topic title",
          rate: "5",
          author: "me",
          type: "1",
          tag: "tag",
          detail: "detail",
        })
      ).rejects.toThrow("create-failed");
    });

    it("fetchThreadDetail returns nested data and rethrows failures", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: { topic_id: 10, title: "hello" } },
      });
      await expect(fetchThreadDetail(10)).resolves.toEqual({
        topic_id: 10,
        title: "hello",
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/threads/10");

      mockedApiClient.get.mockRejectedValueOnce(new Error("detail-failed"));
      await expect(fetchThreadDetail(11)).rejects.toThrow("detail-failed");
    });
  });

  describe("comments", () => {
    it("fetchThreadComments maps payload and fallback", async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            comment_data: [{ commentTopic_id: 1 }],
            paginate: { page: 1, total: 1 },
          },
        },
      });

      await expect(fetchThreadComments(99, 4)).resolves.toEqual({
        comments: [{ commentTopic_id: 1 }],
        pagination: { page: 1, total: 1 },
      });
      expect(mockedApiClient.get).toHaveBeenCalledWith("/user/threads/99/comments", {
        params: { page: 4 },
      });

      mockedApiClient.get.mockResolvedValueOnce({ data: { data: {} } });
      await expect(fetchThreadComments(99)).resolves.toEqual({ comments: [] });

      mockedApiClient.get.mockRejectedValueOnce(new Error("network"));
      await expect(fetchThreadComments(99)).resolves.toEqual({ comments: [] });
    });

    it("postThreadComment and postThreadReply return response data and rethrow", async () => {
      mockedApiClient.post.mockResolvedValueOnce({ data: { id: 1 } });
      await expect(postThreadComment(100, "first!")).resolves.toEqual({ id: 1 });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/user/threads/100/comments", {
        comment: "first!",
      });

      mockedApiClient.post.mockResolvedValueOnce({ data: { id: 2 } });
      await expect(postThreadReply(100, 500, "reply!")).resolves.toEqual({ id: 2 });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/threads/100/comments/500/replies",
        { comment: "reply!" }
      );

      mockedApiClient.post.mockRejectedValueOnce(new Error("comment-failed"));
      await expect(postThreadComment(100, "x")).rejects.toThrow("comment-failed");

      mockedApiClient.post.mockRejectedValueOnce(new Error("reply-failed"));
      await expect(postThreadReply(100, 500, "x")).rejects.toThrow("reply-failed");
    });
  });

  describe("moderation and deletion", () => {
    it("returns raw axios response for report and delete endpoints", async () => {
      const postResponse = { data: { code: 200 } };
      mockedApiClient.post.mockResolvedValueOnce(postResponse);
      await expect(reportThreadComment(123)).resolves.toBe(postResponse);
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/threads/comments/123/report"
      );

      mockedApiClient.post.mockResolvedValueOnce(postResponse);
      await expect(reportThreadReply(124)).resolves.toBe(postResponse);
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/user/threads/comments/124/report"
      );

      const deleteResponse = { data: { code: 200 } };
      mockedApiClient.delete.mockResolvedValueOnce(deleteResponse);
      await expect(deleteThreadReply(220)).resolves.toBe(deleteResponse);
      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        "/user/threads/comments/220/replies"
      );

      mockedApiClient.delete.mockResolvedValueOnce(deleteResponse);
      await expect(deleteThreadComment(221)).resolves.toBe(deleteResponse);
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/user/threads/comments/221");

      mockedApiClient.delete.mockResolvedValueOnce(deleteResponse);
      await expect(deleteThread(222)).resolves.toBe(deleteResponse);
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/user/threads/222");
    });
  });
});
