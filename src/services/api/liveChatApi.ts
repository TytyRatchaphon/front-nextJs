import type { AxiosError } from "axios";

import apiClient from "../apiClient";
import type {
  LiveChatError,
  LiveChatFeedback,
  LiveChatFeedbackTag,
  LiveChatHelpTopic,
  LiveChatIntake,
  LiveChatMessage,
  LiveChatThread,
} from "@/features/liveChat/types";

interface ApiEnvelope<T> {
  code: number;
  status: "success" | "error";
  message: string;
  data: T | null;
  error_code?: string;
  request_id?: string | null;
}

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (
    payload
    && typeof payload === "object"
    && "status" in payload
    && "data" in payload
  ) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.status !== "success" || envelope.data === null) {
      throw normalizeLiveChatError({ response: { data: envelope, status: envelope.code, headers: {} } });
    }
    return envelope.data;
  }
  return payload as T;
}

export function normalizeLiveChatError(error: unknown): LiveChatError {
  const axiosError = error as AxiosError<ApiEnvelope<{
    issues?: Array<{ path: string; message: string }>;
  }>>;
  const retryHeader = axiosError.response?.headers?.["retry-after"];
  const retryAfter = typeof retryHeader === "string" ? Number.parseInt(retryHeader, 10) : undefined;
  const data = axiosError.response?.data;

  return {
    httpStatus: axiosError.response?.status,
    error_code: data?.error_code,
    message: data?.message || axiosError.message,
    request_id: data?.request_id,
    retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
    issues: data?.data?.issues,
  };
}

async function request<T>(operation: () => Promise<{ data: ApiEnvelope<T> | T }>): Promise<T> {
  try {
    const response = await operation();
    return unwrap(response.data);
  } catch (error) {
    throw normalizeLiveChatError(error);
  }
}

export const fetchActiveLiveChatThread = () =>
  request<{ thread: LiveChatThread | null }>(() => apiClient.get("/live-chat/thread"));

export const createLiveChatThread = () =>
  request<{ thread: LiveChatThread; created: boolean }>(() => apiClient.post("/live-chat/thread"));

export const createNewLiveChatThread = () =>
  request<{ previous_thread_id: number | null; thread: LiveChatThread; created: boolean }>(
    () => apiClient.post("/live-chat/thread/new"),
  );

export const fetchLiveChatThreads = (beforeThreadId?: number) =>
  request<{ threads: LiveChatThread[]; next_before_thread_id: number | null; has_more: boolean }>(
    () => apiClient.get("/live-chat/threads", {
      params: { limit: 30, ...(beforeThreadId ? { before_thread_id: beforeThreadId } : {}) },
    }),
  );

export const fetchLiveChatMessages = (params: {
  threadId?: number;
  beforeMessageId?: number;
  afterMessageId?: number;
  limit?: number;
}) => {
  const path = params.threadId
    ? `/live-chat/threads/${params.threadId}/messages`
    : "/live-chat/messages";
  return request<{
    thread: LiveChatThread | null;
    messages: LiveChatMessage[];
    next_before_message_id: number | null;
    next_after_message_id: number | null;
    has_more: boolean;
  }>(() => apiClient.get(path, {
    params: {
      limit: params.limit ?? 30,
      ...(params.beforeMessageId ? { before_message_id: params.beforeMessageId } : {}),
      ...(params.afterMessageId ? { after_message_id: params.afterMessageId } : {}),
    },
  }));
};

export const sendLiveChatText = (body: string) =>
  request<{ thread: LiveChatThread; message: LiveChatMessage }>(
    () => apiClient.post("/live-chat/messages", { body }),
  );

export const sendLiveChatImage = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return request<{ thread: LiveChatThread; message: LiveChatMessage }>(
    () => apiClient.post("/live-chat/messages/image", formData, {
      headers: { "Content-Type": undefined },
    }),
  );
};

export const markLiveChatRead = (messageId: number) =>
  request<unknown>(() => apiClient.put("/live-chat/read", { message_id: messageId }));

export const fetchLiveChatHelpTopics = () =>
  request<{ topics: LiveChatHelpTopic[] }>(() => apiClient.get("/live-chat/help-topics"));

export const startLiveChatIntake = (topic?: LiveChatHelpTopic) =>
  request<{ intake: LiveChatIntake; created: boolean }>(
    () => apiClient.post("/live-chat/intake/start", topic
      ? { topic_id: topic.topic_id, revision: topic.revision }
      : {}),
  );

export const fetchLiveChatIntake = (intakeId: number) =>
  request<{ intake: LiveChatIntake }>(
    () => apiClient.get(`/live-chat/intake/${intakeId}`),
  );

export const answerLiveChatIntake = (intakeId: number, nodeId: number, choiceId: number) =>
  request<{ intake: LiveChatIntake }>(
    () => apiClient.post(`/live-chat/intake/${intakeId}/answer`, {
      node_id: nodeId,
      choice_id: choiceId,
    }),
  );

export const goBackLiveChatIntake = (intakeId: number, nodeId: number) =>
  request<{ intake: LiveChatIntake }>(
    () => apiClient.post(`/live-chat/intake/${intakeId}/back`, { node_id: nodeId }),
  );

export const completeLiveChatIntake = (
  intakeId: number,
  outcome: "skip" | "self_resolved" | "escalated",
) =>
  request<{ intake: LiveChatIntake; thread: LiveChatThread | null }>(
    () => apiClient.post(`/live-chat/intake/${intakeId}/complete`, { outcome }),
  );

export const fetchLiveChatFeedbackTags = () =>
  request<{ tags: LiveChatFeedbackTag[] }>(() => apiClient.get("/live-chat/feedback/tags"));

export const saveLiveChatFeedback = (
  threadId: number,
  payload: { rating: number; comment: string | null; tags: string[] },
) =>
  request<{ feedback: LiveChatFeedback }>(
    () => apiClient.put(`/live-chat/threads/${threadId}/feedback`, payload),
  );
