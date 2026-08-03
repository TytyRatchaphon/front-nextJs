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
import { App, Image as AntImage } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";

import { getLiveChatErrorMessage } from "./liveChatModel";
import LiveChatGifPicker from "./LiveChatGifPicker";
import { downloadGif } from "./gifPickerApi";
import type { GifPickerItem } from "./gifPickerModel";
import type { LiveChatMessage, LiveChatThread } from "./types";
import { useLiveChatSession } from "./hooks/useLiveChatSession";

type WorkspaceView = "topics" | "chat" | "history";
type MediaUploadKind = "image" | "gif";

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
              className="block object-contain"
              rootClassName="block w-fit max-w-full"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: "20rem",
              }}
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
  const { notification } = App.useApp();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const hasMounted = useAuthStore((state) => state.hasMounted);
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const { session, state, isConnected } = useLiveChatSession(hasMounted && isLoggedIn);
  const {
    selectedThread,
    messages,
    intake,
    error,
    beforeMessageId,
    hasOlderMessages,
    historyThreads,
    hasMoreHistory,
    topics,
  } = state;

  const [view, setView] = useState<WorkspaceView>("topics");
  const [messageBody, setMessageBody] = useState("");
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [mediaUploadKind, setMediaUploadKind] = useState<MediaUploadKind>("image");
  const [isPreparingGif, setIsPreparingGif] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldJumpToLatestRef = useRef(false);
  const openedActiveThreadRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const jumpToLatestMessage = useCallback(() => {
    const container = messageListRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

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
    const activeThreadId = state.activeThread?.thread_id ?? null;
    if (!activeThreadId || openedActiveThreadRef.current === activeThreadId) return;
    openedActiveThreadRef.current = activeThreadId;
    setView("chat");
    shouldJumpToLatestRef.current = true;
  }, [state.activeThread?.thread_id]);

  useEffect(() => {
    setRating(selectedThread?.feedback_summary?.rating ?? 0);
    setFeedbackComment(selectedThread?.feedback_summary?.comment ?? "");
    setFeedbackTags(selectedThread?.feedback_summary?.tags ?? []);
  }, [selectedThread?.feedback_summary, selectedThread?.thread_id]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container || view !== "chat") return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 240) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, view]);

  const sendTextMutation = {
    isPending: state.pendingSend === "text",
    mutate: (body: string) => void session.sendText(body).then((sent) => {
      if (sent) setMessageBody("");
    }),
  };
  const sendImageMutation = {
    isPending: state.pendingSend === "image",
    mutate: (file: File) => void session.sendImage(file, mediaUploadKind),
  };
  const intakeMutation = {
    isPending: state.isIntakeBusy,
    mutate: (topic?: (typeof topics)[number]) => void session.startIntake(topic),
  };
  const answerMutation = {
    isPending: state.isIntakeBusy,
    mutate: ({ nodeId, choiceId }: { nodeId: number; choiceId: number }) =>
      void session.answerIntake(nodeId, choiceId),
  };
  const completeMutation = {
    isPending: state.isIntakeBusy,
    mutate: (outcome: "skip" | "self_resolved" | "escalated") => {
      void session.completeIntake(outcome).then((completed) => {
        if (completed) setView(outcome === "escalated" ? "chat" : "topics");
      });
    },
  };
  const handleStartNewCase = () => {
    session.prepareNewCase();
    setView("topics");
  };
  const feedbackMutation = useMutation({
    mutationFn: () => session.saveFeedback({
      rating,
      comment: feedbackComment,
      tags: feedbackTags,
    }),
    onSuccess: (saved) => {
      if (!saved) return;
      notification.success({
        message: "ส่งแบบประเมินเรียบร้อยแล้ว",
        description: "ขอบคุณสำหรับความคิดเห็นของคุณ",
        placement: "topRight",
      });
    },
  });

  const isBusy = state.isIntakeBusy;

  const handleSendText = () => {
    if (sendTextMutation.isPending) return;
    sendTextMutation.mutate(messageBody);
  };

  const handleMediaSelection = (file: File | undefined, kind: MediaUploadKind) => {
    if (!file) return;
    setMediaUploadKind(kind);
    void session.sendImage(file, kind);
  };

  const handleGifSelection = async (item: GifPickerItem) => {
    setMediaUploadKind("gif");
    setIsPreparingGif(true);
    session.clearError();
    try {
      handleMediaSelection(await downloadGif(item), "gif");
    } catch (caught) {
      session.reportError({
        message: caught instanceof Error ? caught.message : "ดาวน์โหลด GIF ไม่สำเร็จ",
      });
    } finally {
      setIsPreparingGif(false);
    }
  };

  const handleLoadOlder = async () => {
    if (!beforeMessageId || !selectedThread) return;
    shouldJumpToLatestRef.current = false;
    const container = messageListRef.current;
    const previousHeight = container?.scrollHeight ?? 0;
    await session.loadOlderMessages();
    window.requestAnimationFrame(() => {
      if (container) container.scrollTop = container.scrollHeight - previousHeight;
    });
  };

  const handleLoadMoreHistory = async () => {
    await session.loadMoreHistory();
  };

  const handleOpenHistoryThread = async (thread: LiveChatThread) => {
    await session.selectHistoryThread(thread);
    setView("chat");
    shouldJumpToLatestRef.current = true;
  };

  if (!hasMounted || (isLoggedIn && state.status === "loading")) {
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
                onClick={() => {
                  if (nextView === "chat") session.selectActiveThread();
                  setView(nextView);
                }}
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
                {state.failedMedia && error.error_code === "image_upload_failed" && (
                  <button
                    type="button"
                    onClick={() => void session.retryFailedMedia()}
                    disabled={sendImageMutation.isPending}
                    className="font-bold underline underline-offset-2"
                  >
                    ลองอัปโหลดอีกครั้ง
                  </button>
                )}
                {state.failedText && (
                  <button
                    type="button"
                    onClick={() => void session.retryFailedText()}
                    disabled={state.pendingSend === "text"}
                    className="font-bold underline underline-offset-2"
                  >
                    ลองส่งข้อความอีกครั้ง
                  </button>
                )}
                {state.canRetryIntake && (
                  <button
                    type="button"
                    onClick={() => void (error.error_code === "intake_expired"
                      ? session.restartIntake()
                      : session.retryIntake())}
                    disabled={state.isIntakeBusy}
                    className="font-bold underline underline-offset-2"
                  >
                    ลองขั้นตอนช่วยเหลืออีกครั้ง
                  </button>
                )}
                <button type="button" onClick={session.clearError} aria-label="ปิดข้อความแจ้งเตือน">
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
                      <button type="button" onClick={session.clearIntake} className="text-sm font-semibold text-stone-500 hover:text-stone-950">
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
                            onClick={() => void session.goBackIntake(intake.path.at(-1)!.node_id)}
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
                        <div className="mt-4 whitespace-pre-wrap text-base leading-7 text-stone-600 [&>p]:mb-2" dangerouslySetInnerHTML={{ __html: intake.terminal.body }} />
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
                      {state.status === "loading" ? (
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
                    onClick={handleStartNewCase}
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
                  {state.status !== "loading" && historyThreads.length === 0 && (
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
                    onClick={handleStartNewCase}
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
                        {state.feedbackTags.map((tag) => {
                          const selected = feedbackTags.includes(tag.key);
                          return (
                            <button
                              key={tag.key}
                              type="button"
                              onClick={() => setFeedbackTags((current) =>
                                selected ? current.filter((key) => key !== tag.key) : [...current, tag.key],
                              )}
                              className={`rounded-full px-4 py-2 text-xs font-bold ${
                                selected ? "bg-[#dc2626] !text-white" : "bg-white text-stone-600"
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
                        onClick={() => feedbackMutation.mutate()}
                        className="mt-4 min-h-11 rounded-full bg-[#dc2626] px-6 text-sm font-bold !text-white hover:bg-[#b91c1c] disabled:opacity-50"
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
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      handleMediaSelection(event.target.files?.[0], "image");
                      event.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={selectedThread?.can_send === false || sendImageMutation.isPending || isPreparingGif}
                    className="grid size-11 shrink-0 place-items-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-[#dc2626] disabled:opacity-40"
                    aria-label="แนบรูปภาพ"
                  >
                    {sendImageMutation.isPending && mediaUploadKind === "image"
                      ? <LoaderCircle className="size-5 animate-spin" />
                      : <ImagePlus className="size-5" />}
                  </button>
                  <LiveChatGifPicker
                    disabled={selectedThread?.can_send === false || sendImageMutation.isPending || isPreparingGif}
                    isSending={isPreparingGif || (sendImageMutation.isPending && mediaUploadKind === "gif")}
                    onSelect={handleGifSelection}
                  />
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
                  Enter เพื่อส่ง · Shift + Enter เพื่อขึ้นบรรทัดใหม่ · รูปและ GIF ไม่เกิน 5 MB
                </p>
              </footer>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
