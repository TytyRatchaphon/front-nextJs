"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  History,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Send,
  Signal,
  SignalZero,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import { Image as AntImage } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSocket } from "@/providers/SocketProvider";
import {
  answerLiveChatIntake,
  completeLiveChatIntake,
  createNewLiveChatThread,
  fetchActiveLiveChatThread,
  fetchLiveChatFeedbackTags,
  fetchLiveChatHelpTopics,
  fetchLiveChatIntake,
  fetchLiveChatMessages,
  fetchLiveChatThreads,
  goBackLiveChatIntake,
  markLiveChatRead,
  saveLiveChatFeedback,
  sendLiveChatImage,
  sendLiveChatText,
  startLiveChatIntake,
  normalizeLiveChatError,
} from "@/services/api/liveChatApi";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";

import {
  getLiveChatErrorMessage,
  mergeMessages,
  validateFeedback,
  validateImage,
  validateMessageBody,
} from "./liveChatModel";
import type {
  LiveChatError,
  LiveChatHelpTopic,
  LiveChatIntake,
  LiveChatMessage,
  LiveChatThread,
} from "./types";

type WorkspaceView = "topics" | "chat" | "history";

const liveChatQueryKeys = {
  thread: ["live-chat", "thread"] as const,
  threads: ["live-chat", "threads"] as const,
  helpTopics: ["live-chat", "help-topics"] as const,
  feedbackTags: ["live-chat", "feedback-tags"] as const,
};

const formatDateTime = (value: string | null) => {
  if (!value) return "ยังไม่มีข้อความ";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
};

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold ${
        connected ? "text-emerald-700" : "text-amber-700"
      }`}
      aria-live="polite"
    >
      {connected ? <Signal className="size-3.5" /> : <SignalZero className="size-3.5" />}
      {connected ? "ออนไลน์" : "กำลังเชื่อมต่อใหม่"}
    </span>
  );
}

function MessageBubble({
  message,
  onMediaLoad,
}: {
  message: LiveChatMessage;
  onMediaLoad?: () => void;
}) {
  if (message.sender_type === "system") {
    return (
      <div className="my-3 flex justify-center">
        <p className="max-w-lg rounded-full bg-stone-100 px-4 py-2 text-center text-xs text-stone-500">
          {message.body}
        </p>
      </div>
    );
  }

  const isUser = message.sender_type === "user";
  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[86%] sm:max-w-[72%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div
          className={`overflow-hidden rounded-2xl ${
            isUser
              ? "rounded-br-md bg-[#dc2626] text-white"
              : "rounded-bl-md bg-white text-stone-900 shadow-[0_8px_30px_rgba(28,25,23,0.06)]"
          }`}
        >
          {message.message_type === "image" ? (
            <AntImage
              src={message.image_url || message.body}
              alt="รูปภาพในบทสนทนา"
              onLoad={onMediaLoad}
              className="max-h-80 w-auto max-w-full object-contain"
              rootClassName="block"
              preview={{
                maskClassName: "rounded-2xl",
              }}
            />
          ) : (
            <p className="whitespace-pre-wrap break-words px-4 py-3 text-sm leading-6 sm:text-base">
              {message.body}
            </p>
          )}
        </div>
        <time className="px-1 text-[11px] text-stone-400">
          {formatDateTime(message.created_at)}
        </time>
      </div>
    </article>
  );
}

export default function LiveChatContactPage() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const hasMounted = useAuthStore((state) => state.hasMounted);
  const openLoginModal = useUIStore((state) => state.openLoginModal);

  const [view, setView] = useState<WorkspaceView>("topics");
  const [selectedThread, setSelectedThread] = useState<LiveChatThread | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [intake, setIntake] = useState<LiveChatIntake | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [error, setError] = useState<LiveChatError | null>(null);
  const [beforeMessageId, setBeforeMessageId] = useState<number | null>(null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [failedImage, setFailedImage] = useState<File | null>(null);
  const [historyThreads, setHistoryThreads] = useState<LiveChatThread[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldJumpToLatestRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const jumpToLatestMessage = useCallback(() => {
    const container = messageListRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  const activeThreadQuery = useQuery({
    queryKey: liveChatQueryKeys.thread,
    queryFn: fetchActiveLiveChatThread,
    enabled: hasMounted && isLoggedIn,
    retry: 1,
  });
  const topicsQuery = useQuery({
    queryKey: liveChatQueryKeys.helpTopics,
    queryFn: fetchLiveChatHelpTopics,
    enabled: hasMounted && isLoggedIn,
    staleTime: 60_000,
  });
  const historyQuery = useQuery({
    queryKey: liveChatQueryKeys.threads,
    queryFn: () => fetchLiveChatThreads(),
    enabled: hasMounted && isLoggedIn,
  });
  const feedbackTagsQuery = useQuery({
    queryKey: liveChatQueryKeys.feedbackTags,
    queryFn: fetchLiveChatFeedbackTags,
    enabled: hasMounted && isLoggedIn,
    staleTime: 300_000,
  });

  const handleError = useCallback((caught: unknown) => {
    const normalized = (
      caught
      && typeof caught === "object"
      && ("error_code" in caught || "httpStatus" in caught || "request_id" in caught)
    )
      ? caught as LiveChatError
      : normalizeLiveChatError(caught);
    setError(normalized);
  }, []);

  const recoverIntakeError = useCallback(async (caught: unknown) => {
    const normalized = (
      caught
      && typeof caught === "object"
      && ("error_code" in caught || "httpStatus" in caught)
    )
      ? caught as LiveChatError
      : normalizeLiveChatError(caught);
    setError(normalized);
    if (normalized.error_code === "intake_expired") {
      setIntake(null);
      return;
    }
    if (normalized.error_code === "intake_state_conflict" && intake) {
      try {
        const result = await fetchLiveChatIntake(intake.intake_id);
        setIntake(result.intake);
      } catch (reloadError) {
        handleError(reloadError);
      }
    }
  }, [handleError, intake]);

  const loadMessages = useCallback(async (thread?: LiveChatThread | null) => {
    try {
      const result = await fetchLiveChatMessages({
        threadId: thread && thread.status !== "active" ? thread.thread_id : undefined,
      });
      setMessages(result.messages);
      setBeforeMessageId(result.next_before_message_id);
      setHasOlderMessages(result.has_more);
      if (result.thread) setSelectedThread(result.thread);
      setError(null);
      shouldJumpToLatestRef.current = true;
    } catch (caught) {
      handleError(caught);
    }
  }, [handleError]);

  useEffect(() => {
    if (view !== "chat" || !shouldJumpToLatestRef.current) return;
    const frame = window.requestAnimationFrame(jumpToLatestMessage);
    const timeout = window.setTimeout(() => {
      jumpToLatestMessage();
      shouldJumpToLatestRef.current = false;
    }, 2_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [jumpToLatestMessage, messages, view]);

  useEffect(() => {
    const thread = activeThreadQuery.data?.thread;
    if (!thread) return;
    setSelectedThread(thread);
    setView("chat");
    setIntake(thread.intake_summary);
    setRating(thread.feedback_summary?.rating ?? 0);
    setFeedbackComment(thread.feedback_summary?.comment ?? "");
    setFeedbackTags(thread.feedback_summary?.tags ?? []);
    void loadMessages(thread);
  }, [activeThreadQuery.data?.thread, loadMessages]);

  useEffect(() => {
    const result = historyQuery.data;
    if (!result) return;
    setHistoryThreads(result.threads);
    setHistoryCursor(result.next_before_thread_id);
    setHasMoreHistory(result.has_more);
  }, [historyQuery.data]);

  useEffect(() => {
    if (!selectedThread || selectedThread.status === "active") return;
    const latest = historyThreads.find((thread) => thread.thread_id === selectedThread.thread_id);
    if (latest) setSelectedThread(latest);
  }, [historyThreads, selectedThread]);

  const syncNewMessages = useCallback(async () => {
    const thread = selectedThread;
    if (!thread || thread.status !== "active") return;
    const maxId = messages.at(-1)?.message_id;
    try {
      const result = await fetchLiveChatMessages({
        afterMessageId: maxId,
        limit: 100,
      });
      setMessages((current) => mergeMessages(current, result.messages));
      if (result.thread) setSelectedThread(result.thread);
    } catch {
      // Realtime catch-up is best effort; the next reconnect or manual retry can recover.
    }
  }, [messages, selectedThread]);

  useEffect(() => {
    if (!socket || !isLoggedIn) return;
    const handleMessage = () => void syncNewMessages();
    const handleResolved = () => {
      setSelectedThread((thread) => thread ? {
        ...thread,
        status: "resolved",
        can_send: false,
      } : thread);
      void queryClient.invalidateQueries({ queryKey: liveChatQueryKeys.thread });
      void queryClient.invalidateQueries({ queryKey: liveChatQueryKeys.threads });
    };
    socket.on("live_chat:message", handleMessage);
    socket.on("thread_resolved", handleResolved);
    socket.io.on("reconnect", handleMessage);
    return () => {
      socket.off("live_chat:message", handleMessage);
      socket.off("thread_resolved", handleResolved);
      socket.io.off("reconnect", handleMessage);
    };
  }, [isLoggedIn, queryClient, socket, syncNewMessages]);

  useEffect(() => {
    const handleRecovery = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void syncNewMessages();
    };
    window.addEventListener("online", handleRecovery);
    document.addEventListener("visibilitychange", handleRecovery);
    return () => {
      window.removeEventListener("online", handleRecovery);
      document.removeEventListener("visibilitychange", handleRecovery);
    };
  }, [syncNewMessages]);

  useEffect(() => {
    const latestAdminMessage = [...messages].reverse().find((item) => item.sender_type === "admin");
    if (latestAdminMessage) void markLiveChatRead(latestAdminMessage.message_id).catch(() => undefined);
  }, [messages]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container || view !== "chat") return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 240) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, view]);

  const sendTextMutation = useMutation({
    mutationFn: sendLiveChatText,
    onSuccess: (result) => {
      setSelectedThread(result.thread);
      setMessages((current) => mergeMessages(current, [result.message]));
      setMessageBody("");
      setError(null);
    },
    onError: handleError,
  });
  const sendImageMutation = useMutation({
    mutationFn: sendLiveChatImage,
    onSuccess: (result) => {
      setSelectedThread(result.thread);
      setMessages((current) => mergeMessages(current, [result.message]));
      setError(null);
      setFailedImage(null);
    },
    onError: handleError,
  });
  const intakeMutation = useMutation({
    mutationFn: (topic?: LiveChatHelpTopic) => startLiveChatIntake(topic),
    onSuccess: ({ intake: nextIntake }) => {
      setIntake(nextIntake);
      setView("topics");
      setError(null);
    },
    onError: recoverIntakeError,
  });
  const answerMutation = useMutation({
    mutationFn: ({ nodeId, choiceId }: { nodeId: number; choiceId: number }) =>
      answerLiveChatIntake(intake!.intake_id, nodeId, choiceId),
    onSuccess: ({ intake: nextIntake }) => setIntake(nextIntake),
    onError: recoverIntakeError,
  });
  const completeMutation = useMutation({
    mutationFn: (outcome: "skip" | "self_resolved" | "escalated") =>
      completeLiveChatIntake(intake!.intake_id, outcome),
    onSuccess: ({ intake: nextIntake, thread }) => {
      setIntake(nextIntake);
      if (thread) {
        setSelectedThread(thread);
        setView("chat");
        void loadMessages(thread);
      } else {
        setIntake(null);
        setView("topics");
      }
      void queryClient.invalidateQueries({ queryKey: liveChatQueryKeys.thread });
    },
    onError: recoverIntakeError,
  });
  const newThreadMutation = useMutation({
    mutationFn: createNewLiveChatThread,
    onSuccess: ({ thread }) => {
      setSelectedThread(thread);
      setIntake(null);
      setMessages([]);
      setView("chat");
      void queryClient.invalidateQueries({ queryKey: liveChatQueryKeys.threads });
    },
    onError: handleError,
  });
  const feedbackMutation = useMutation({
    mutationFn: () => saveLiveChatFeedback(selectedThread!.thread_id, {
      rating,
      comment: feedbackComment.trim() || null,
      tags: feedbackTags,
    }),
    onSuccess: ({ feedback }) => {
      setSelectedThread((thread) => thread ? { ...thread, feedback_summary: feedback } : thread);
      setError(null);
    },
    onError: handleError,
  });

  const isBusy = intakeMutation.isPending || answerMutation.isPending || completeMutation.isPending;
  const topics = useMemo(
    () => [...(topicsQuery.data?.topics ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [topicsQuery.data?.topics],
  );

  const handleSendText = () => {
    if (sendTextMutation.isPending) return;
    const validationMessage = validateMessageBody(messageBody);
    if (validationMessage) {
      setError({ message: validationMessage });
      return;
    }
    sendTextMutation.mutate(messageBody);
  };

  const handleImageSelection = (file?: File) => {
    if (!file) return;
    const validationMessage = validateImage(file);
    if (validationMessage) {
      setError({ message: validationMessage });
      return;
    }
    setFailedImage(file);
    sendImageMutation.mutate(file);
  };

  const handleLoadOlder = async () => {
    if (!beforeMessageId || !selectedThread) return;
    shouldJumpToLatestRef.current = false;
    const container = messageListRef.current;
    const previousHeight = container?.scrollHeight ?? 0;
    try {
      const result = await fetchLiveChatMessages({
        threadId: selectedThread.status !== "active" ? selectedThread.thread_id : undefined,
        beforeMessageId,
      });
      setMessages((current) => mergeMessages(result.messages, current));
      setBeforeMessageId(result.next_before_message_id);
      setHasOlderMessages(result.has_more);
      window.requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - previousHeight;
      });
    } catch (caught) {
      handleError(caught);
    }
  };

  const handleLoadMoreHistory = async () => {
    if (!historyCursor) return;
    try {
      const result = await fetchLiveChatThreads(historyCursor);
      setHistoryThreads((current) => {
        const byId = new Map(current.map((thread) => [thread.thread_id, thread]));
        result.threads.forEach((thread) => byId.set(thread.thread_id, thread));
        return [...byId.values()].sort((left, right) => right.thread_id - left.thread_id);
      });
      setHistoryCursor(result.next_before_thread_id);
      setHasMoreHistory(result.has_more);
    } catch (caught) {
      handleError(caught);
    }
  };

  const handleOpenHistoryThread = (thread: LiveChatThread) => {
    setSelectedThread(thread);
    setIntake(thread.intake_summary);
    setRating(thread.feedback_summary?.rating ?? 0);
    setFeedbackComment(thread.feedback_summary?.comment ?? "");
    setFeedbackTags(thread.feedback_summary?.tags ?? []);
    setView("chat");
    void loadMessages(thread);
  };

  if (!hasMounted || activeThreadQuery.isLoading) {
    return (
      <main className="grid min-h-[calc(100svh-60px)] place-items-center bg-white lg:min-h-[calc(100svh-80px)]">
        <LoaderCircle className="size-8 animate-spin text-[#dc2626]" aria-label="กำลังโหลด Live Chat" />
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="grid min-h-[calc(100svh-60px)] place-items-center bg-white px-6 lg:min-h-[calc(100svh-80px)]">
        <section className="max-w-xl text-center">
          <div className="mx-auto mb-7 grid size-20 place-items-center rounded-full bg-[#dc2626] text-white">
            <MessageCircle className="size-9" />
          </div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-[#dc2626]">Enjoybook Support</p>
          <h1 className="text-4xl font-bold tracking-tight text-stone-950 sm:text-5xl">คุยกับทีมงานได้ในที่เดียว</h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-stone-600">
            เข้าสู่ระบบเพื่อเริ่มแชต ติดตามเคส และย้อนดูบทสนทนาเดิมของคุณ
          </p>
          <button
            type="button"
            onClick={openLoginModal}
            className="mt-8 min-h-12 rounded-full bg-[#dc2626] px-8 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:ring-offset-4"
          >
            เข้าสู่ระบบเพื่อใช้งาน
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="h-[calc(100svh-60px)] overflow-hidden bg-white text-stone-950 lg:h-[calc(100svh-80px)]">
      <div className="mx-auto flex h-full min-h-0 max-w-[1440px] flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-stone-200 bg-stone-50 text-stone-950 lg:w-[340px] lg:border-b-0 lg:border-r lg:border-stone-200">
          <header className="px-6 pb-5 pt-7 sm:px-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#dc2626]">Enjoybook</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">ศูนย์ช่วยเหลือ</h1>
              </div>
              <StatusPill connected={isConnected} />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-stone-400">
              ค้นหาคำตอบก่อนเริ่มเคส หรือพูดคุยกับทีมงานแบบเรียลไทม์
            </p>
          </header>

          <nav className="grid grid-cols-3 border-y border-stone-200 lg:grid-cols-1 lg:border-b-0" aria-label="Live Chat">
            {([
              ["topics", Sparkles, "ขอความช่วยเหลือ"],
              ["chat", MessageCircle, "บทสนทนา"],
              ["history", History, "ประวัติเคส"],
            ] as const).map(([nextView, Icon, label]) => (
              <button
                key={nextView}
                type="button"
                onClick={() => setView(nextView)}
                className={`flex min-h-14 items-center justify-center gap-2 border-stone-200 px-3 text-sm font-semibold transition lg:justify-start lg:border-b lg:px-8 ${
                  view === nextView
                    ? "bg-red-50 text-[#dc2626]"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-950"
                }`}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="hidden flex-1 flex-col justify-end p-8 lg:flex">
            <div className="border-t border-stone-200 pt-6">
              <p className="text-xs font-semibold text-stone-500">สถานะเคสปัจจุบัน</p>
              <p className="mt-2 text-sm font-bold">
                {selectedThread
                  ? selectedThread.status === "active" ? "กำลังสนทนา" : "ปิดเคสแล้ว"
                  : "ยังไม่มีเคส"}
              </p>
              {selectedThread?.last_message_at && (
                <p className="mt-1 text-xs text-stone-500">{formatDateTime(selectedThread.last_message_at)}</p>
              )}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {error && (
            <div className="flex items-start justify-between gap-4 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800" role="alert">
              <span className="flex gap-2">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                {error.message && !error.error_code && !error.request_id
                  ? error.message
                  : getLiveChatErrorMessage(error)}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                {failedImage && error.error_code === "image_upload_failed" && (
                  <button
                    type="button"
                    onClick={() => sendImageMutation.mutate(failedImage)}
                    disabled={sendImageMutation.isPending}
                    className="font-bold underline underline-offset-2"
                  >
                    ลองอัปโหลดอีกครั้ง
                  </button>
                )}
                <button type="button" onClick={() => setError(null)} aria-label="ปิดข้อความแจ้งเตือน">
                  <X className="size-4" />
                </button>
              </span>
            </div>
          )}

          {view === "topics" && (
            <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-10 sm:py-12 xl:px-16">
              <div className="mx-auto max-w-4xl">
                <p className="text-sm font-bold text-[#dc2626]">เริ่มจากตรงนี้</p>
                <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
                  บอกเราว่าคุณกำลังเจอปัญหาอะไร
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
                  ลองทำตามคำแนะนำทีละขั้น หรือข้ามไปคุยกับทีมงานได้ทันที
                </p>

                {intake ? (
                  <div className="mt-10 border-t border-stone-300 pt-8">
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                          {intake.topic_title || "ติดต่อทีมงานโดยตรง"}
                        </p>
                        <p className="mt-2 text-sm text-stone-500">
                          หมดอายุ {formatDateTime(intake.expires_at)}
                        </p>
                      </div>
                      <button type="button" onClick={() => setIntake(null)} className="text-sm font-semibold text-stone-500 hover:text-stone-950">
                        เลือกหัวข้อใหม่
                      </button>
                    </div>

                    {intake.current_node && (
                      <>
                        <h3 className="text-2xl font-bold">{intake.current_node.prompt}</h3>
                        <div className="mt-6 divide-y divide-stone-300 border-y border-stone-300">
                          {[...intake.current_node.choices]
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((choice) => (
                              <button
                                key={choice.choice_id}
                                type="button"
                                disabled={isBusy}
                                onClick={() => answerMutation.mutate({
                                  nodeId: intake.current_node!.node_id,
                                  choiceId: choice.choice_id,
                                })}
                                className="group flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left font-semibold transition hover:pl-2 hover:text-[#dc2626] disabled:opacity-50"
                              >
                                {choice.label}
                                <ChevronRight className="size-5 transition group-hover:translate-x-1" />
                              </button>
                            ))}
                        </div>
                        {intake.path.length > 0 && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => goBackLiveChatIntake(
                              intake.intake_id,
                              intake.path.at(-1)!.node_id,
                          ).then(({ intake: previous }) => setIntake(previous)).catch(recoverIntakeError)}
                            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-950"
                          >
                            <ChevronLeft className="size-4" /> ย้อนกลับ
                          </button>
                        )}
                      </>
                    )}

                    {intake.terminal && (
                      <div>
                        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="size-6" />
                        </div>
                        <h3 className="mt-5 text-3xl font-bold">{intake.terminal.title}</h3>
                        <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-stone-600">{intake.terminal.body}</p>
                        {intake.terminal.images.length > 0 && (
                          <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {[...intake.terminal.images]
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((item) => (
                                <Image
                                  key={item.image_url}
                                  src={item.image_url}
                                  alt=""
                                  width={720}
                                  height={480}
                                  unoptimized
                                  className="rounded-2xl object-cover"
                                />
                              ))}
                          </div>
                        )}
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => completeMutation.mutate("self_resolved")}
                            className="min-h-12 rounded-full bg-white border border-[#dc2626] px-6 text-sm font-bold text-[#dc2626] hover:bg-red-50 disabled:opacity-50"
                          >
                            แก้ปัญหาได้แล้ว
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => completeMutation.mutate("escalated")}
                            className="min-h-12 rounded-full border border-[#dc2626] bg-[#dc2626] px-6 text-sm font-bold !text-white hover:bg-[#b91c1c] disabled:opacity-50"
                          >
                            ยังต้องการคุยกับทีมงาน
                          </button>
                        </div>
                      </div>
                    )}

                    {!intake.current_node && !intake.terminal && intake.status === "started" && (
                      <div>
                        <h3 className="text-2xl font-bold">พร้อมส่งเรื่องให้ทีมงานหรือยัง?</h3>
                        <p className="mt-3 text-stone-600">เริ่มห้องสนทนาใหม่และอธิบายปัญหาให้ทีมงานได้เลย</p>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => completeMutation.mutate("escalated")}
                          className="mt-6 min-h-12 rounded-full bg-[#dc2626] px-7 text-sm font-bold text-white hover:bg-[#b91c1c]"
                        >
                          เริ่มแชตกับทีมงาน
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mt-10 divide-y divide-stone-300 border-y border-stone-300">
                      {topicsQuery.isLoading ? (
                        <div className="flex min-h-40 items-center justify-center">
                          <LoaderCircle className="size-6 animate-spin text-[#dc2626]" />
                        </div>
                      ) : topics.length > 0 ? topics.map((topic, index) => (
                        <button
                          key={`${topic.topic_id}-${topic.revision}`}
                          type="button"
                          onClick={() => intakeMutation.mutate(topic)}
                          className="group flex min-h-20 w-full items-center gap-5 py-5 text-left transition hover:pl-2"
                        >
                          <span className="text-sm font-bold tabular-nums text-stone-400">{String(index + 1).padStart(2, "0")}</span>
                          <span className="flex-1">
                            <span className="block text-lg font-bold group-hover:text-[#dc2626]">{topic.title}</span>
                            {topic.description && <span className="mt-1 block text-sm text-stone-500">{topic.description}</span>}
                          </span>
                          <ChevronRight className="size-5 transition group-hover:translate-x-1 group-hover:text-[#dc2626]" />
                        </button>
                      )) : (
                        <p className="py-8 text-stone-500">ยังไม่มีหัวข้อช่วยเหลือในขณะนี้</p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={intakeMutation.isPending}
                      onClick={() => intakeMutation.mutate(undefined)}
                      className="mt-12 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#dc2626] px-7 text-sm font-bold !text-white transition hover:-translate-y-0.5 hover:bg-[#b91c1c] disabled:opacity-50"
                    >
                      <MessageCircle className="size-4" />
                      คุยกับทีมงานโดยตรง
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {view === "history" && (
            <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-10 sm:py-12 xl:px-16">
              <div className="mx-auto max-w-4xl">
                <p className="text-sm font-bold text-[#dc2626]">ประวัติการช่วยเหลือ</p>
                <div className="mt-6 flex items-end justify-between gap-6">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">เคสทั้งหมดของคุณ</h2>
                  <button
                    type="button"
                    onClick={() => newThreadMutation.mutate()}
                    className="hidden min-h-11 rounded-full border border-[#dc2626] bg-white px-5 text-sm font-bold text-[#dc2626] hover:bg-red-50 sm:block"
                  >
                    เริ่มเคสใหม่
                  </button>
                </div>
                <div className="mt-10 divide-y divide-stone-300 border-y border-stone-300">
                  {historyThreads.map((thread) => (
                    <button
                      key={thread.thread_id}
                      type="button"
                      onClick={() => handleOpenHistoryThread(thread)}
                      className="group flex w-full items-center gap-5 py-5 text-left"
                    >
                      <span className={`size-2.5 rounded-full ${thread.status === "active" ? "bg-emerald-500" : "bg-stone-300"}`} />
                      <span className="flex-1">
                        <span className="block text-base font-bold group-hover:text-[#dc2626]">
                          {thread.intake_summary?.topic_title || `เคส #${thread.thread_id}`}
                        </span>
                        <span className="mt-1 block text-sm text-stone-500">
                          {thread.status === "active" ? "กำลังสนทนา" : thread.status === "resolved" ? "แก้ไขแล้ว" : "เก็บถาวร"}
                          {" · "}
                          {formatDateTime(thread.last_message_at || thread.created_at)}
                        </span>
                      </span>
                      <ChevronRight className="size-5 text-stone-400 transition group-hover:translate-x-1" />
                    </button>
                  ))}
                  {!historyQuery.isLoading && !(historyQuery.data?.threads.length) && (
                    <div className="py-16 text-center">
                      <Clock3 className="mx-auto size-8 text-stone-300" />
                      <p className="mt-4 font-semibold">ยังไม่มีประวัติเคส</p>
                    </div>
                  )}
                </div>
                {hasMoreHistory && (
                  <button
                    type="button"
                    onClick={() => void handleLoadMoreHistory()}
                    className="mx-auto mt-7 flex min-h-11 items-center gap-2 rounded-full border border-stone-300 px-5 text-sm font-bold hover:border-[#dc2626] hover:text-[#dc2626]"
                  >
                    โหลดเคสก่อนหน้า
                  </button>
                )}
              </div>
            </div>
          )}

          {view === "chat" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <header className="flex min-h-20 shrink-0 items-center justify-between gap-4 border-b border-stone-200 bg-white px-5 sm:px-8">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">
                    {selectedThread?.intake_summary?.topic_title || "พูดคุยกับทีมงาน"}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {selectedThread
                      ? `เคส #${selectedThread.thread_id} · ${selectedThread.status === "active" ? "กำลังดำเนินการ" : "ปิดเคสแล้ว"}`
                      : "เริ่มพิมพ์ข้อความเพื่อสร้างเคส"}
                  </p>
                </div>
                {selectedThread && (
                  <button
                    type="button"
                    onClick={() => newThreadMutation.mutate()}
                    disabled={newThreadMutation.isPending}
                    className="shrink-0 rounded-full border border-stone-300 px-4 py-2 text-xs font-bold hover:border-[#dc2626] hover:text-[#dc2626]"
                  >
                    เริ่มเคสใหม่
                  </button>
                )}
              </header>

              <div ref={messageListRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8">
                <div className="mx-auto flex max-w-4xl flex-col gap-4">
                  {hasOlderMessages && (
                    <button
                      type="button"
                      onClick={() => void handleLoadOlder()}
                      className="mx-auto mb-4 inline-flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-[#dc2626]"
                    >
                      <RefreshCw className="size-3.5" /> โหลดข้อความก่อนหน้า
                    </button>
                  )}
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.message_id}
                      message={message}
                      onMediaLoad={() => {
                        if (shouldJumpToLatestRef.current) jumpToLatestMessage();
                      }}
                    />
                  ))}
                  {messages.length === 0 && (
                    <div className="mx-auto max-w-md py-16 text-center">
                      <div className="mx-auto grid size-16 place-items-center rounded-full bg-white text-[#dc2626] shadow-sm">
                        <MessageCircle className="size-7" />
                      </div>
                      <h3 className="mt-5 text-xl font-bold">เริ่มบทสนทนาได้เลย</h3>
                      <p className="mt-2 text-sm leading-6 text-stone-500">
                        อธิบายปัญหาและแนบรูปประกอบได้ ทีมงานจะตอบกลับผ่านห้องนี้
                      </p>
                    </div>
                  )}

                  {selectedThread?.feedback_eligible && (
                    <section className="mt-8 border-t border-stone-300 py-8">
                      <div className="flex items-center gap-3">
                        <Star className="size-5 text-[#dc2626]" />
                        <h3 className="text-xl font-bold">ประเมินการช่วยเหลือ</h3>
                      </div>
                      <div className="mt-5 flex gap-2" aria-label="คะแนน">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            aria-label={`${value} ดาว`}
                            className="p-1"
                          >
                            <Star className={`size-7 ${value <= rating ? "fill-[#dc2626] text-[#dc2626]" : "text-stone-300"}`} />
                          </button>
                        ))}
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {(feedbackTagsQuery.data?.tags ?? []).map((tag) => {
                          const selected = feedbackTags.includes(tag.key);
                          return (
                            <button
                              key={tag.key}
                              type="button"
                              onClick={() => setFeedbackTags((current) =>
                                selected ? current.filter((key) => key !== tag.key) : [...current, tag.key],
                              )}
                              className={`rounded-full px-4 py-2 text-xs font-bold ${
                                selected ? "bg-[#dc2626] text-white" : "bg-white text-stone-600"
                              }`}
                            >
                              {tag.label_th}
                            </button>
                          );
                        })}
                      </div>
                      <textarea
                        value={feedbackComment}
                        onChange={(event) => setFeedbackComment(event.target.value)}
                        placeholder="ความคิดเห็นเพิ่มเติม (ไม่บังคับ)"
                        className="mt-5 min-h-24 w-full resize-y rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-red-100"
                      />
                      <button
                        type="button"
                        disabled={feedbackMutation.isPending}
                        onClick={() => {
                          const validationMessage = validateFeedback({ rating, comment: feedbackComment, tags: feedbackTags });
                          if (validationMessage) setError({ message: validationMessage });
                          else feedbackMutation.mutate();
                        }}
                        className="mt-4 min-h-11 rounded-full bg-[#dc2626] px-6 text-sm font-bold text-white hover:bg-[#b91c1c] disabled:opacity-50"
                      >
                        {selectedThread.feedback_summary ? "อัปเดตแบบประเมิน" : "ส่งแบบประเมิน"}
                      </button>
                    </section>
                  )}
                </div>
              </div>

              <footer className="shrink-0 border-t border-stone-200 bg-white p-3 sm:p-5">
                <div className="mx-auto flex max-w-4xl items-end gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(event) => {
                      handleImageSelection(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={selectedThread?.can_send === false || sendImageMutation.isPending}
                    className="grid size-11 shrink-0 place-items-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-[#dc2626] disabled:opacity-40"
                    aria-label="แนบรูปภาพ"
                  >
                    {sendImageMutation.isPending ? <LoaderCircle className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
                  </button>
                  <textarea
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        if (!sendTextMutation.isPending) handleSendText();
                      }
                    }}
                    disabled={selectedThread?.can_send === false}
                    placeholder={selectedThread?.can_send === false ? "เคสนี้ปิดแล้ว" : "พิมพ์ข้อความ..."}
                    rows={1}
                    className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-stone-100 px-4 py-3 text-sm leading-5 outline-none focus:bg-white focus:ring-2 focus:ring-[#dc2626]/20 disabled:cursor-not-allowed disabled:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={handleSendText}
                    disabled={selectedThread?.can_send === false || sendTextMutation.isPending || !messageBody.trim()}
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-[#dc2626] text-white transition hover:bg-[#b91c1c] disabled:bg-stone-300"
                    aria-label="ส่งข้อความ"
                  >
                    {sendTextMutation.isPending ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5" />}
                  </button>
                </div>
                <p className="mx-auto mt-2 max-w-4xl px-14 text-[11px] text-stone-400">
                  Enter เพื่อส่ง · Shift + Enter เพื่อขึ้นบรรทัดใหม่ · รูปไม่เกิน 5 MB
                </p>
              </footer>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
