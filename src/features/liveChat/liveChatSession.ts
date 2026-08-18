import {
  mergeMessages,
  validateFeedback,
  validateGif,
  validateImage,
  validateMessageBody,
} from "./liveChatModel";
import type {
  LiveChatConfig,
  LiveChatError,
  LiveChatFeedback,
  LiveChatFeedbackTag,
  LiveChatHelpTopic,
  LiveChatIntake,
  LiveChatMessage,
  LiveChatThread,
} from "./types";

interface MessagePage {
  thread: LiveChatThread | null;
  messages: LiveChatMessage[];
  next_before_message_id: number | null;
  next_after_message_id: number | null;
  has_more: boolean;
}

export interface LiveChatSessionGateway {
  fetchActiveThread: () => Promise<{ thread: LiveChatThread | null }>;
  fetchThreads: (beforeThreadId?: number) => Promise<{
    threads: LiveChatThread[];
    next_before_thread_id: number | null;
    has_more: boolean;
  }>;
  fetchMessages: (params: {
    threadId?: number;
    beforeMessageId?: number;
    afterMessageId?: number;
    limit?: number;
  }) => Promise<MessagePage>;
  sendText: (body: string) => Promise<{ thread: LiveChatThread; message: LiveChatMessage }>;
  sendImage: (file: File) => Promise<{ thread: LiveChatThread; message: LiveChatMessage }>;
  sendVideo?: (
    file: File,
    onUploadProgress?: (percent: number) => void,
  ) => Promise<{ thread: LiveChatThread; message: LiveChatMessage }>;
  markRead: (messageId: number) => Promise<unknown>;
  fetchHelpTopics: () => Promise<{ topics: LiveChatHelpTopic[] }>;
  startIntake: (topic?: LiveChatHelpTopic) => Promise<{ intake: LiveChatIntake; created: boolean }>;
  fetchIntake: (intakeId: number) => Promise<{ intake: LiveChatIntake }>;
  answerIntake: (
    intakeId: number,
    nodeId: number,
    choiceId: number,
  ) => Promise<{ intake: LiveChatIntake }>;
  goBackIntake: (intakeId: number, nodeId: number) => Promise<{ intake: LiveChatIntake }>;
  completeIntake: (
    intakeId: number,
    outcome: "skip" | "self_resolved" | "escalated",
  ) => Promise<{ intake: LiveChatIntake; thread: LiveChatThread | null }>;
  createNewThread: () => Promise<{
    previous_thread_id: number | null;
    thread: LiveChatThread;
    created: boolean;
  }>;
  fetchFeedbackTags: () => Promise<{ tags: LiveChatFeedbackTag[] }>;
  saveFeedback: (
    threadId: number,
    payload: { rating: number; comment: string | null; tags: string[] },
  ) => Promise<{ feedback: LiveChatFeedback }>;
  fetchConfig?: () => Promise<LiveChatConfig>;
}

export interface LiveChatSessionSocket {
  on: (event: string, listener: () => void) => void;
  off: (event: string, listener: () => void) => void;
  io: {
    on: (event: "reconnect", listener: () => void) => void;
    off: (event: "reconnect", listener: () => void) => void;
  };
}

export interface LiveChatSessionState {
  status: "closed" | "loading" | "ready" | "error";
  activeThread: LiveChatThread | null;
  selectedThread: LiveChatThread | null;
  messages: LiveChatMessage[];
  beforeMessageId: number | null;
  hasOlderMessages: boolean;
  historyThreads: LiveChatThread[];
  historyCursor: number | null;
  hasMoreHistory: boolean;
  topics: LiveChatHelpTopic[];
  feedbackTags: LiveChatFeedbackTag[];
  config: LiveChatConfig | null;
  error: LiveChatError | null;
  isSending: boolean;
  pendingSend: "text" | "image" | null;
  failedText: string | null;
  failedMedia: File | null;
  failedMediaKind: "image" | "gif" | null;
  intake: LiveChatIntake | null;
  isIntakeBusy: boolean;
  canRetryIntake: boolean;
  isFeedbackBusy: boolean;
}

interface CreateLiveChatSessionOptions {
  gateway: LiveChatSessionGateway;
}

const normalizeError = (error: unknown): LiveChatError => {
  if (error && typeof error === "object") return error as LiveChatError;
  return { message: error instanceof Error ? error.message : String(error) };
};

export const createLiveChatSession = ({ gateway }: CreateLiveChatSessionOptions) => {
  let state: LiveChatSessionState = {
    status: "closed",
    activeThread: null,
    selectedThread: null,
    messages: [],
    beforeMessageId: null,
    hasOlderMessages: false,
    historyThreads: [],
    historyCursor: null,
    hasMoreHistory: false,
    topics: [],
    feedbackTags: [],
    config: null,
    error: null,
    isSending: false,
    pendingSend: null,
    failedText: null,
    failedMedia: null,
    failedMediaKind: null,
    intake: null,
    isIntakeBusy: false,
    canRetryIntake: false,
    isFeedbackBusy: false,
  };
  let generation = 0;
  let createThreadBeforeEscalation = false;
  let socket: LiveChatSessionSocket | null = null;
  let lastReadMessageId = 0;
  let pendingReadMessageId = 0;
  let historySelectionVersion = 0;
  let reconciliationVersion = 0;
  let activeRefreshVersion = 0;
  let lastIntakeRetry: (() => Promise<boolean>) | null = null;
  let lastIntakeTopic: LiveChatHelpTopic | undefined;
  const listeners = new Set<(state: LiveChatSessionState) => void>();

  const publish = (patch: Partial<LiveChatSessionState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  };

  const markLatestAdminMessageRead = (messages: LiveChatMessage[]) => {
    const latestAdminMessage = [...messages]
      .reverse()
      .find((item) => item.sender_type === "admin"
        && item.message_id > Math.max(lastReadMessageId, pendingReadMessageId));
    if (!latestAdminMessage) return;
    const messageId = latestAdminMessage.message_id;
    pendingReadMessageId = messageId;
    void gateway.markRead(messageId).then(() => {
      lastReadMessageId = Math.max(lastReadMessageId, messageId);
    }).catch(() => undefined).finally(() => {
      if (pendingReadMessageId === messageId) pendingReadMessageId = 0;
    });
  };

  let activeMessages: LiveChatMessage[] = [];
  let activeBeforeMessageId: number | null = null;
  let activeHasOlderMessages = false;

  const loadConversation = async (
    selectedThread: LiveChatThread,
    kind: "active" | "history" = selectedThread.status === "active" ? "active" : "history",
  ) => {
    const currentGeneration = generation;
    const requestedHistoryVersion = historySelectionVersion;
    const page = await gateway.fetchMessages({
      threadId: selectedThread.status === "active" ? undefined : selectedThread.thread_id,
    });
    if (
      currentGeneration !== generation
      || (kind === "history" && requestedHistoryVersion !== historySelectionVersion)
    ) return;
    const authoritativeThread = page.thread ?? selectedThread;
    if (kind === "active") {
      activeMessages = page.messages;
      activeBeforeMessageId = page.next_before_message_id;
      activeHasOlderMessages = page.has_more;
      publish({
        activeThread: authoritativeThread,
        selectedThread: authoritativeThread,
        messages: page.messages,
        beforeMessageId: page.next_before_message_id,
        hasOlderMessages: page.has_more,
      });
      markLatestAdminMessageRead(activeMessages);
      return;
    }
    publish({
      selectedThread: authoritativeThread,
      messages: page.messages,
      beforeMessageId: page.next_before_message_id,
      hasOlderMessages: page.has_more,
    });
  };

  const open = async () => {
    const currentGeneration = ++generation;
    activeMessages = [];
    activeBeforeMessageId = null;
    activeHasOlderMessages = false;
    lastIntakeTopic = undefined;
    publish({
      status: "loading",
      activeThread: null,
      selectedThread: null,
      messages: [],
      beforeMessageId: null,
      hasOlderMessages: false,
      error: null,
    });
    try {
      const activeResult = await gateway.fetchActiveThread();
      const auxiliaryResults = await Promise.allSettled([
        gateway.fetchThreads(),
        gateway.fetchHelpTopics(),
        gateway.fetchFeedbackTags(),
        gateway.fetchConfig ? gateway.fetchConfig() : Promise.reject("no_config"),
      ]);
      const { thread } = activeResult;
      if (currentGeneration !== generation) return;
      if (thread) await loadConversation(thread);
      if (currentGeneration === generation) {
        const [historyResult, topicsResult, feedbackTagsResult, configResult] = auxiliaryResults;
        const rejectedAuxiliary = auxiliaryResults.find(
          (result, index): result is PromiseRejectedResult => result.status === "rejected" && index !== 3,
        );
        const loadedTopics = topicsResult.status === "fulfilled"
          ? [...topicsResult.value.topics].sort((left, right) => left.sort_order - right.sort_order)
          : [];
        const restoredIntake = thread?.intake_summary;
        lastIntakeTopic = restoredIntake
          ? loadedTopics.find((candidate) =>
            candidate.topic_code === restoredIntake.topic_code
            && candidate.revision === restoredIntake.topic_revision)
          : undefined;
        publish({
          intake: thread?.intake_summary ?? null,
          ...(historyResult.status === "fulfilled" ? {
            historyThreads: [...historyResult.value.threads]
              .sort((left, right) => right.thread_id - left.thread_id),
            historyCursor: historyResult.value.next_before_thread_id,
            hasMoreHistory: historyResult.value.has_more,
          } : {}),
          ...(topicsResult.status === "fulfilled" ? {
            topics: loadedTopics,
          } : {}),
          ...(feedbackTagsResult.status === "fulfilled" ? {
            feedbackTags: [...feedbackTagsResult.value.tags]
              .sort((left, right) => left.sort_order - right.sort_order),
          } : {}),
          ...(configResult.status === "fulfilled" && configResult.value ? {
            config: configResult.value,
          } : {}),
          error: rejectedAuxiliary
            ? normalizeError(rejectedAuxiliary.reason)
            : null,
        });
      }
      if (currentGeneration === generation) publish({ status: "ready" });
    } catch (error) {
      if (currentGeneration === generation) {
        publish({ status: "error", error: normalizeError(error) });
      }
    }
  };

  const sendText = async (body: string) => {
    if (state.isSending || state.selectedThread?.can_send === false) return false;
    const validationMessage = validateMessageBody(body);
    if (validationMessage) {
      publish({ error: { message: validationMessage } });
      return false;
    }
    const currentGeneration = generation;
    publish({ isSending: true, pendingSend: "text", error: null });
    try {
      const result = await gateway.sendText(body);
      if (currentGeneration !== generation) return false;
      activeMessages = mergeMessages(activeMessages, [result.message]);
      publish({
        activeThread: result.thread,
        selectedThread: result.thread,
        messages: activeMessages,
        isSending: false,
        pendingSend: null,
        failedText: null,
      });
      return true;
    } catch (error) {
      if (currentGeneration === generation) {
        publish({
          isSending: false,
          pendingSend: null,
          failedText: body,
          error: normalizeError(error),
        });
      }
      return false;
    }
  };

  const recover = async () => {
    const activeThread = state.activeThread;
    if (!activeThread || activeThread.status !== "active") return;
    const currentGeneration = generation;
    const currentReconciliationVersion = reconciliationVersion;
    const currentActiveRefreshVersion = activeRefreshVersion;
    try {
      const result = await gateway.fetchMessages({
        afterMessageId: activeMessages.at(-1)?.message_id,
        limit: 100,
      });
      if (
        currentGeneration !== generation
        || currentReconciliationVersion !== reconciliationVersion
        || currentActiveRefreshVersion !== activeRefreshVersion
      ) return;
      const authoritativeThread = result.thread ?? activeThread;
      activeMessages = mergeMessages(activeMessages, result.messages);
      const viewingActive = state.selectedThread?.thread_id === activeThread.thread_id;
      publish({
        activeThread: authoritativeThread,
        ...(viewingActive ? {
          selectedThread: authoritativeThread,
          messages: activeMessages,
        } : {}),
      });
      markLatestAdminMessageRead(activeMessages);
    } catch {
      // Recovery is best effort. A later signal can retry.
    }
  };

  const runIntakeTransition = async (
    operation: () => Promise<{ intake: LiveChatIntake }>,
    retryOperation: () => Promise<boolean>,
  ) => {
    if (state.isIntakeBusy) return false;
    const currentGeneration = generation;
    publish({ isIntakeBusy: true, canRetryIntake: false, error: null });
    try {
      const result = await operation();
      if (currentGeneration !== generation) return false;
      lastIntakeRetry = null;
      publish({ intake: result.intake, isIntakeBusy: false, canRetryIntake: false });
      return true;
    } catch (error) {
      if (currentGeneration === generation) {
        lastIntakeRetry = retryOperation;
        const normalized = normalizeError(error);
        if (normalized.error_code === "intake_expired") {
          publish({ intake: null, isIntakeBusy: false, canRetryIntake: true, error: normalized });
          return false;
        }
        if (normalized.error_code === "intake_state_conflict" && state.intake) {
          try {
            const latest = await gateway.fetchIntake(state.intake.intake_id);
            if (currentGeneration === generation) {
              publish({ intake: latest.intake, isIntakeBusy: false, canRetryIntake: true, error: normalized });
            }
            return false;
          } catch (refreshError) {
            if (currentGeneration === generation) {
              publish({ isIntakeBusy: false, canRetryIntake: true, error: normalizeError(refreshError) });
            }
            return false;
          }
        }
        publish({ isIntakeBusy: false, canRetryIntake: true, error: normalized });
      }
      return false;
    }
  };

  const runRetryableIntakeTransition = (
    operation: () => Promise<{ intake: LiveChatIntake }>,
  ) => {
    const execute = () => runIntakeTransition(operation, execute);
    return execute();
  };

  const startIntake = (topic?: LiveChatHelpTopic) => {
    lastIntakeTopic = topic;
    return runRetryableIntakeTransition(() => gateway.startIntake(topic));
  };

  const restartIntake = () =>
    runRetryableIntakeTransition(() => gateway.startIntake(lastIntakeTopic));

  const answerIntake = (nodeId: number, choiceId: number) => {
    if (!state.intake) return Promise.resolve(false);
    const intakeId = state.intake.intake_id;
    return runRetryableIntakeTransition(() => gateway.answerIntake(
      intakeId,
      nodeId,
      choiceId,
    ));
  };

  const goBackIntake = (nodeId: number) => {
    if (!state.intake) return Promise.resolve(false);
    const intakeId = state.intake.intake_id;
    return runRetryableIntakeTransition(() => gateway.goBackIntake(intakeId, nodeId));
  };

  const completeIntake = async (outcome: "skip" | "self_resolved" | "escalated") => {
    if (!state.intake || state.isIntakeBusy) return false;
    const currentGeneration = generation;
    const intakeId = state.intake.intake_id;
    publish({ isIntakeBusy: true, canRetryIntake: false, error: null });
    try {
      if (outcome === "escalated" && createThreadBeforeEscalation) {
        await gateway.createNewThread();
        createThreadBeforeEscalation = false;
      }
      const result = await gateway.completeIntake(intakeId, outcome);
      if (currentGeneration !== generation) return false;
      lastIntakeRetry = null;
      publish({ intake: result.intake, isIntakeBusy: false, canRetryIntake: false });
      if (result.thread) await loadConversation(result.thread);
      return currentGeneration === generation;
    } catch (error) {
      if (currentGeneration === generation) {
        lastIntakeRetry = () => completeIntake(outcome);
        publish({ isIntakeBusy: false, canRetryIntake: true, error: normalizeError(error) });
      }
      return false;
    }
  };

  const prepareNewCase = () => {
    createThreadBeforeEscalation = true;
    publish({ intake: null, error: null });
  };

  const clearIntake = () => publish({ intake: null });

  const sendImage = async (file: File, kind: "image" | "gif" = "image") => {
    if (state.isSending || state.selectedThread?.can_send === false) return false;
    const validationMessage = kind === "gif" ? validateGif(file) : validateImage(file);
    if (validationMessage) {
      publish({ error: { message: validationMessage } });
      return false;
    }
    const currentGeneration = generation;
    publish({
      isSending: true,
      pendingSend: "image",
      failedMedia: file,
      failedMediaKind: kind,
      error: null,
    });
    try {
      const result = await gateway.sendImage(file);
      if (currentGeneration !== generation) return false;
      activeMessages = mergeMessages(activeMessages, [result.message]);
      publish({
        activeThread: result.thread,
        selectedThread: result.thread,
        messages: activeMessages,
        isSending: false,
        pendingSend: null,
        failedMedia: null,
        failedMediaKind: null,
      });
      return true;
    } catch (error) {
      if (currentGeneration === generation) {
        publish({ isSending: false, pendingSend: null, error: normalizeError(error) });
      }
      return false;
    }
  };

  const retryFailedMedia = () => {
    if (!state.failedMedia || !state.failedMediaKind) return Promise.resolve(false);
    return sendImage(state.failedMedia, state.failedMediaKind);
  };

  const selectHistoryThread = async (thread: LiveChatThread) => {
    historySelectionVersion += 1;
    const currentGeneration = generation;
    try {
      await loadConversation(thread, "history");
      return currentGeneration === generation;
    } catch (error) {
      if (currentGeneration === generation) publish({ error: normalizeError(error) });
      return false;
    }
  };

  const selectActiveThread = () => {
    if (!state.activeThread) return false;
    publish({
      selectedThread: state.activeThread,
      messages: activeMessages,
      beforeMessageId: activeBeforeMessageId,
      hasOlderMessages: activeHasOlderMessages,
      intake: state.activeThread.intake_summary,
    });
    return true;
  };

  const loadOlderMessages = async () => {
    if (!state.selectedThread || !state.beforeMessageId || !state.hasOlderMessages) return 0;
    const selectedThreadId = state.selectedThread.thread_id;
    const selectedIsActive = state.activeThread?.thread_id === selectedThreadId;
    const currentGeneration = generation;
    try {
      const result = await gateway.fetchMessages({
        threadId: selectedIsActive ? undefined : selectedThreadId,
        beforeMessageId: state.beforeMessageId,
      });
      if (
        currentGeneration !== generation
        || state.selectedThread?.thread_id !== selectedThreadId
      ) return 0;
      const previousMessageCount = state.messages.length;
      const merged = mergeMessages(result.messages, state.messages);
      if (selectedIsActive) {
        activeMessages = merged;
        activeBeforeMessageId = result.next_before_message_id;
        activeHasOlderMessages = result.has_more;
      }
      publish({
        selectedThread: result.thread ?? state.selectedThread,
        messages: merged,
        beforeMessageId: result.next_before_message_id,
        hasOlderMessages: result.has_more,
      });
      return merged.length - previousMessageCount;
    } catch (error) {
      if (currentGeneration === generation) publish({ error: normalizeError(error) });
      return 0;
    }
  };

  const loadMoreHistory = async () => {
    if (!state.historyCursor || !state.hasMoreHistory) return false;
    const currentGeneration = generation;
    try {
      const result = await gateway.fetchThreads(state.historyCursor);
      if (currentGeneration !== generation) return false;
      const byId = new Map(state.historyThreads.map((item) => [item.thread_id, item]));
      result.threads.forEach((item) => byId.set(item.thread_id, item));
      publish({
        historyThreads: [...byId.values()]
          .sort((left, right) => right.thread_id - left.thread_id),
        historyCursor: result.next_before_thread_id,
        hasMoreHistory: result.has_more,
      });
      return true;
    } catch (error) {
      if (currentGeneration === generation) publish({ error: normalizeError(error) });
      return false;
    }
  };

  const saveFeedback = async (payload: {
    rating: number;
    comment: string;
    tags: string[];
  }) => {
    const selectedThread = state.selectedThread;
    if (!selectedThread?.feedback_eligible || state.isFeedbackBusy) return false;
    const validationMessage = validateFeedback(payload);
    if (validationMessage) {
      publish({ error: { message: validationMessage } });
      return false;
    }
    const currentGeneration = generation;
    const selectedThreadId = selectedThread.thread_id;
    publish({ isFeedbackBusy: true, error: null });
    try {
      const result = await gateway.saveFeedback(selectedThreadId, {
        rating: payload.rating,
        comment: payload.comment.trim() || null,
        tags: payload.tags,
      });
      if (
        currentGeneration !== generation
        || state.selectedThread?.thread_id !== selectedThreadId
      ) return false;
      const updatedThread = { ...state.selectedThread, feedback_summary: result.feedback };
      publish({
        selectedThread: updatedThread,
        historyThreads: state.historyThreads.map((item) =>
          item.thread_id === selectedThreadId ? updatedThread : item),
        isFeedbackBusy: false,
      });
      return true;
    } catch (error) {
      if (currentGeneration === generation) {
        publish({ isFeedbackBusy: false, error: normalizeError(error) });
      }
      return false;
    }
  };

  const refreshActiveThread = async () => {
    const currentGeneration = generation;
    const currentRefreshVersion = ++activeRefreshVersion;
    reconciliationVersion += 1;
    try {
      const { thread } = await gateway.fetchActiveThread();
      if (
        currentGeneration !== generation
        || currentRefreshVersion !== activeRefreshVersion
      ) return;
      reconciliationVersion += 1;
      const previousActiveThreadId = state.activeThread?.thread_id;
      if (!thread) {
        activeMessages = [];
        publish({
          activeThread: null,
          ...(state.selectedThread?.thread_id === previousActiveThreadId ? {
            selectedThread: null,
            messages: [],
          } : {}),
        });
        return;
      }
      if (thread.thread_id !== previousActiveThreadId) {
        await loadConversation(thread, "active");
        return;
      }
      const viewingActive = state.selectedThread?.thread_id === previousActiveThreadId;
      publish({
        activeThread: thread,
        historyThreads: state.historyThreads.map((item) =>
          item.thread_id === thread.thread_id ? thread : item),
        ...(viewingActive ? { selectedThread: thread } : {}),
      });
      await recover();
    } catch {
      // Recovery is best effort.
    }
  };

  const handleSocketMessage = () => void recover();
  const handleSocketResolved = () => void refreshActiveThread();
  const handleSocketReconnect = () => void recover();

  const setSocket = (nextSocket: LiveChatSessionSocket | null) => {
    if (socket === nextSocket) return;
    if (socket) {
      socket.off("live_chat:message", handleSocketMessage);
      socket.off("thread_resolved", handleSocketResolved);
      socket.io.off("reconnect", handleSocketReconnect);
    }
    socket = nextSocket;
    if (socket) {
      socket.on("live_chat:message", handleSocketMessage);
      socket.on("thread_resolved", handleSocketResolved);
      socket.io.on("reconnect", handleSocketReconnect);
    }
  };

  const retryFailedText = () => {
    if (!state.failedText) return Promise.resolve(false);
    return sendText(state.failedText);
  };

  const retryIntake = () => lastIntakeRetry?.() ?? Promise.resolve(false);

  return {
    getState: () => state,
    subscribe: (listener: (state: LiveChatSessionState) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    open,
    sendText,
    retryFailedText,
    recover,
    refreshActiveThread,
    startIntake,
    answerIntake,
    goBackIntake,
    completeIntake,
    prepareNewCase,
    clearIntake,
    sendImage,
    retryFailedMedia,
    retryIntake,
    restartIntake,
    selectHistoryThread,
    selectActiveThread,
    loadOlderMessages,
    loadMoreHistory,
    saveFeedback,
    setSocket,
    clearError: () => publish({ error: null }),
    reportError: (error: LiveChatError) => publish({ error }),
    close: () => {
      setSocket(null);
      generation += 1;
      activeMessages = [];
      activeBeforeMessageId = null;
      activeHasOlderMessages = false;
      lastReadMessageId = 0;
      pendingReadMessageId = 0;
      historySelectionVersion += 1;
      reconciliationVersion += 1;
      activeRefreshVersion += 1;
      lastIntakeRetry = null;
      lastIntakeTopic = undefined;
      publish({
        status: "closed",
        activeThread: null,
        selectedThread: null,
        messages: [],
        beforeMessageId: null,
        hasOlderMessages: false,
        historyThreads: [],
        historyCursor: null,
        hasMoreHistory: false,
        topics: [],
        feedbackTags: [],
        intake: null,
        canRetryIntake: false,
        failedText: null,
        error: null,
      });
    },
  };
};
