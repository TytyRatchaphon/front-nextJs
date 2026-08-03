import { describe, expect, it, vi } from "vitest";

import {
  createLiveChatSession,
  type LiveChatSessionGateway,
  type LiveChatSessionSocket,
} from "./liveChatSession";
import type {
  LiveChatFeedback,
  LiveChatFeedbackTag,
  LiveChatHelpTopic,
  LiveChatIntake,
  LiveChatMessage,
  LiveChatThread,
} from "./types";

const thread = (overrides: Partial<LiveChatThread> = {}): LiveChatThread => ({
  thread_id: 10,
  status: "active",
  assigned_admin_id: null,
  last_message_id: 2,
  last_message_at: "2026-08-03T05:00:00.000Z",
  last_user_message_at: "2026-08-03T04:59:00.000Z",
  last_admin_message_at: "2026-08-03T05:00:00.000Z",
  last_resolved_at: null,
  archived_at: null,
  can_send: true,
  intake_summary: null,
  resolution_summary: null,
  feedback_eligible: false,
  feedback_summary: null,
  created_at: "2026-08-03T04:00:00.000Z",
  updated_at: "2026-08-03T05:00:00.000Z",
  ...overrides,
});

const message = (
  messageId: number,
  sender: LiveChatMessage["sender_type"] = "user",
): LiveChatMessage => ({
  message_id: messageId,
  thread_id: 10,
  sender_type: sender,
  sender_user_id: sender === "user" ? 1 : null,
  sender_admin_id: sender === "admin" ? 2 : null,
  message_type: "text",
  body: `message-${messageId}`,
  created_at: `2026-08-03T05:00:0${messageId}.000Z`,
});

const topic: LiveChatHelpTopic = {
  topic_id: 3,
  topic_code: "payments",
  title: "Payment help",
  description: null,
  revision: 4,
  sort_order: 1,
};

const intake = (
  overrides: Partial<LiveChatIntake> = {},
): LiveChatIntake => ({
  intake_id: 20,
  status: "started",
  outcome: null,
  topic_code: topic.topic_code,
  topic_revision: topic.revision,
  topic_title: topic.title,
  path: [],
  current_node: {
    node_id: 30,
    node_key: "payment-method",
    prompt: "Which payment method?",
    choices: [{ choice_id: 40, label: "Card", sort_order: 1 }],
  },
  terminal: null,
  expires_at: "2026-08-04T05:00:00.000Z",
  ...overrides,
});

const feedback: LiveChatFeedback = {
  rating: 5,
  comment: "Helpful",
  source: "web",
  tags: ["fast"],
  submitted_at: "2026-08-03T06:00:00.000Z",
  updated_at: "2026-08-03T06:00:00.000Z",
};

const feedbackTag: LiveChatFeedbackTag = {
  key: "fast",
  label_th: "รวดเร็ว",
  label_en: "Fast",
  sort_order: 1,
};

const createGateway = (): LiveChatSessionGateway => ({
  fetchActiveThread: vi.fn().mockResolvedValue({ thread: thread() }),
  fetchThreads: vi.fn().mockResolvedValue({
    threads: [thread()],
    next_before_thread_id: null,
    has_more: false,
  }),
  fetchMessages: vi.fn().mockResolvedValue({
    thread: thread(),
    messages: [message(1), message(2, "admin")],
    next_before_message_id: null,
    next_after_message_id: null,
    has_more: false,
  }),
  sendText: vi.fn().mockResolvedValue({ thread: thread(), message: message(3) }),
  sendImage: vi.fn().mockResolvedValue({ thread: thread(), message: message(3) }),
  markRead: vi.fn().mockResolvedValue(undefined),
  fetchHelpTopics: vi.fn().mockResolvedValue({ topics: [topic] }),
  startIntake: vi.fn().mockResolvedValue({ intake: intake(), created: true }),
  fetchIntake: vi.fn().mockResolvedValue({ intake: intake() }),
  answerIntake: vi.fn().mockResolvedValue({ intake: intake() }),
  goBackIntake: vi.fn().mockResolvedValue({ intake: intake() }),
  completeIntake: vi.fn().mockResolvedValue({
    intake: intake({ status: "completed", outcome: "escalated" }),
    thread: thread(),
  }),
  createNewThread: vi.fn().mockResolvedValue({
    previous_thread_id: null,
    thread: thread(),
    created: true,
  }),
  fetchFeedbackTags: vi.fn().mockResolvedValue({ tags: [feedbackTag] }),
  saveFeedback: vi.fn().mockResolvedValue({ feedback }),
});

const createSocket = () => {
  const listeners = new Map<string, Set<() => void>>();
  const on = (event: string, listener: () => void) => {
    const eventListeners = listeners.get(event) ?? new Set();
    eventListeners.add(listener);
    listeners.set(event, eventListeners);
  };
  const off = (event: string, listener: () => void) => listeners.get(event)?.delete(listener);
  return {
    adapter: {
      on,
      off,
      io: { on, off },
    } satisfies LiveChatSessionSocket,
    emit: (event: string) => listeners.get(event)?.forEach((listener) => listener()),
  };
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

describe("LiveChatSession", () => {
  it("restores the active conversation and reconciles a send with catch-up once", async () => {
    const gateway = createGateway();
    const session = createLiveChatSession({ gateway });

    await session.open();
    expect(session.getState()).toMatchObject({
      status: "ready",
      selectedThread: { thread_id: 10 },
      messages: [{ message_id: 1 }, { message_id: 2 }],
    });

    await session.sendText("hello");
    await session.recover();

    expect(session.getState().messages.map((item) => item.message_id)).toEqual([1, 2, 3]);
  });

  it("owns intake transitions and selects the authoritative escalated thread", async () => {
    const gateway = createGateway();
    const terminalIntake = intake({
      current_node: null,
      terminal: {
        node_id: 31,
        node_key: "payment-result",
        title: "Try again",
        body: "Retry the payment",
        images: [],
      },
    });
    vi.mocked(gateway.answerIntake).mockResolvedValue({ intake: terminalIntake });
    const session = createLiveChatSession({ gateway });

    await session.open();
    await session.startIntake(topic);
    await session.answerIntake(30, 40);

    expect(session.getState().intake).toEqual(terminalIntake);

    await session.completeIntake("escalated");

    expect(session.getState()).toMatchObject({
      intake: { status: "completed", outcome: "escalated" },
      selectedThread: { thread_id: 10, status: "active" },
      messages: [{ message_id: 1 }, { message_id: 2 }],
    });
  });

  it("keeps historical messages and feedback isolated from the active conversation", async () => {
    const gateway = createGateway();
    const historicalThread = thread({
      thread_id: 7,
      status: "resolved",
      can_send: false,
      feedback_eligible: true,
      last_message_id: 12,
    });
    vi.mocked(gateway.fetchThreads).mockResolvedValue({
      threads: [historicalThread],
      next_before_thread_id: null,
      has_more: false,
    });
    vi.mocked(gateway.fetchMessages)
      .mockResolvedValueOnce({
        thread: thread(),
        messages: [message(1), message(2, "admin")],
        next_before_message_id: null,
        next_after_message_id: null,
        has_more: false,
      })
      .mockResolvedValueOnce({
        thread: historicalThread,
        messages: [
          { ...message(11, "admin"), thread_id: 7 },
          { ...message(12), thread_id: 7 },
        ],
        next_before_message_id: 11,
        next_after_message_id: null,
        has_more: true,
      })
      .mockResolvedValueOnce({
        thread: historicalThread,
        messages: [
          { ...message(10, "admin"), thread_id: 7 },
          { ...message(11, "admin"), thread_id: 7 },
        ],
        next_before_message_id: null,
        next_after_message_id: null,
        has_more: false,
      });
    const session = createLiveChatSession({ gateway });

    await session.open();
    await session.selectHistoryThread(historicalThread);
    await session.loadOlderMessages();

    expect(session.getState()).toMatchObject({
      activeThread: { thread_id: 10 },
      selectedThread: { thread_id: 7 },
      messages: [{ message_id: 10 }, { message_id: 11 }, { message_id: 12 }],
      hasOlderMessages: false,
      feedbackTags: [{ key: "fast" }],
    });

    await session.saveFeedback({ rating: 5, comment: "Helpful", tags: ["fast"] });

    expect(session.getState().selectedThread?.feedback_summary).toEqual(feedback);
    expect(session.getState().activeThread?.thread_id).toBe(10);
  });

  it("converges Socket resolution through REST and removes subscriptions on close", async () => {
    const gateway = createGateway();
    const socket = createSocket();
    const resolvedThread = thread({ status: "resolved", can_send: false });
    vi.mocked(gateway.fetchActiveThread)
      .mockResolvedValueOnce({ thread: thread() })
      .mockResolvedValueOnce({ thread: resolvedThread });
    const session = createLiveChatSession({ gateway });

    await session.open();
    session.setSocket(socket.adapter);
    socket.emit("thread_resolved");

    await vi.waitFor(() => expect(session.getState().selectedThread).toMatchObject({
      status: "resolved",
      can_send: false,
    }));

    const callsBeforeClose = vi.mocked(gateway.fetchMessages).mock.calls.length;
    session.close();
    socket.emit("live_chat:message");
    await Promise.resolve();

    expect(vi.mocked(gateway.fetchMessages)).toHaveBeenCalledTimes(callsBeforeClose);
  });

  it("keeps the latest historical thread authoritative during rapid selection", async () => {
    const gateway = createGateway();
    const firstHistory = thread({ thread_id: 7, status: "resolved", can_send: false });
    const secondHistory = thread({ thread_id: 8, status: "resolved", can_send: false });
    const firstPage = deferred<Awaited<ReturnType<LiveChatSessionGateway["fetchMessages"]>>>();
    const secondPage = deferred<Awaited<ReturnType<LiveChatSessionGateway["fetchMessages"]>>>();
    vi.mocked(gateway.fetchMessages)
      .mockResolvedValueOnce({
        thread: thread(),
        messages: [message(1)],
        next_before_message_id: null,
        next_after_message_id: null,
        has_more: false,
      })
      .mockReturnValueOnce(firstPage.promise)
      .mockReturnValueOnce(secondPage.promise);
    const session = createLiveChatSession({ gateway });
    await session.open();

    const openingFirst = session.selectHistoryThread(firstHistory);
    const openingSecond = session.selectHistoryThread(secondHistory);
    secondPage.resolve({
      thread: secondHistory,
      messages: [{ ...message(20), thread_id: 8 }],
      next_before_message_id: null,
      next_after_message_id: null,
      has_more: false,
    });
    await openingSecond;
    firstPage.resolve({
      thread: firstHistory,
      messages: [{ ...message(19), thread_id: 7 }],
      next_before_message_id: null,
      next_after_message_id: null,
      has_more: false,
    });
    await openingFirst;

    expect(session.getState()).toMatchObject({
      selectedThread: { thread_id: 8 },
      messages: [{ message_id: 20 }],
    });
  });

  it("retains failed text and intake intents for retry", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.sendText)
      .mockRejectedValueOnce(new Error("temporary send failure"))
      .mockResolvedValueOnce({ thread: thread(), message: message(3) });
    vi.mocked(gateway.answerIntake)
      .mockRejectedValueOnce(new Error("temporary intake failure"))
      .mockResolvedValueOnce({ intake: intake({ current_node: null }) });
    const session = createLiveChatSession({ gateway });
    await session.open();

    expect(await session.sendText("keep this text")).toBe(false);
    expect(session.getState().failedText).toBe("keep this text");
    expect(await session.retryFailedText()).toBe(true);

    await session.startIntake(topic);
    expect(await session.answerIntake(30, 40)).toBe(false);
    expect(await session.retryIntake()).toBe(true);
    expect(session.getState()).toMatchObject({
      failedText: null,
      intake: { current_node: null },
    });
  });

  it("ignores a stale recovery result after the active thread resolves", async () => {
    const gateway = createGateway();
    const pendingRecovery = deferred<Awaited<ReturnType<LiveChatSessionGateway["fetchMessages"]>>>();
    vi.mocked(gateway.fetchMessages)
      .mockResolvedValueOnce({
        thread: thread(),
        messages: [message(1)],
        next_before_message_id: null,
        next_after_message_id: null,
        has_more: false,
      })
      .mockReturnValueOnce(pendingRecovery.promise);
    vi.mocked(gateway.fetchActiveThread)
      .mockResolvedValueOnce({ thread: thread() })
      .mockResolvedValueOnce({ thread: thread({ status: "resolved", can_send: false }) });
    const session = createLiveChatSession({ gateway });
    await session.open();

    const recovering = session.recover();
    await session.refreshActiveThread();
    pendingRecovery.resolve({
      thread: thread({ status: "active", can_send: true }),
      messages: [message(2)],
      next_before_message_id: null,
      next_after_message_id: null,
      has_more: false,
    });
    await recovering;

    expect(session.getState().activeThread).toMatchObject({ status: "resolved", can_send: false });
  });

  it("restarts an expired intake with the original topic revision", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.answerIntake).mockRejectedValueOnce({ error_code: "intake_expired" });
    const session = createLiveChatSession({ gateway });
    await session.open();
    await session.startIntake(topic);
    await session.answerIntake(30, 40);

    await session.restartIntake();

    expect(gateway.startIntake).toHaveBeenLastCalledWith(topic);
  });

  it("restores the restart topic from an active thread intake summary", async () => {
    const gateway = createGateway();
    vi.mocked(gateway.fetchActiveThread).mockResolvedValue({
      thread: thread({ intake_summary: intake() }),
    });
    vi.mocked(gateway.answerIntake).mockRejectedValueOnce({ error_code: "intake_expired" });
    const session = createLiveChatSession({ gateway });
    await session.open();
    await session.answerIntake(30, 40);

    await session.restartIntake();

    expect(gateway.startIntake).toHaveBeenLastCalledWith(topic);
  });
});
