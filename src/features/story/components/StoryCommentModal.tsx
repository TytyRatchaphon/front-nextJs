"use client";

import { MoreHorizontal, Send, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Drawer, Dropdown, Spin } from "antd";

import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useVideoComments } from "../hooks/useVideoComments";
import type { StoryItemType, VideoComment } from "../types/storyTypes";

interface StoryCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: StoryItemType;
  refId: number;
}

const StoryCommentModal = ({ isOpen, onClose, type, refId }: StoryCommentModalProps) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const { commentsQuery, createCommentMutation, deleteCommentMutation, reportCommentMutation } = useVideoComments(type, refId);
  const [text, setText] = useState("");

  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page?.items ?? []) ?? [],
    [commentsQuery.data?.pages],
  );

  const sendComment = () => {
    const value = text.trim();
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!value) return;
    createCommentMutation.mutate(value, { onSuccess: () => setText("") });
  };

  const menuItems = (comment: VideoComment) => [
    ...(comment.can_delete
      ? [{ key: "delete", label: "ลบความคิดเห็น", danger: true, onClick: () => deleteCommentMutation.mutate(comment.id) }]
      : []),
    ...(comment.can_report
      ? [{ key: "report", label: "รายงานความคิดเห็น", onClick: () => reportCommentMutation.mutate(comment.id) }]
      : []),
  ];

  return (
    <Drawer
      placement="right"
      open={isOpen}
      onClose={onClose}
      width={400}
      zIndex={10000}
      title={<span className="text-white">ความคิดเห็น</span>}
      closeIcon={<X className="h-5 w-5 text-white" />}
      classNames={{ body: "!p-0 !bg-[#121212]", header: "!bg-[#121212] !border-b-zinc-800" }}
    >
      <div className="flex h-full flex-col bg-[#121212]">
        <div className="flex-1 overflow-y-auto p-4">
          {commentsQuery.isLoading ? (
            <div className="flex h-32 items-center justify-center"><Spin /></div>
          ) : comments.length ? (
            <div className="space-y-5">
              {comments.map((comment) => {
                const items = menuItems(comment);
                return (
                  <article key={comment.id} className="flex gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                      <Image src={comment.user?.img || "/images/default-avatar.png"} alt="" fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-400">{comment.user?.fullname || "ผู้ใช้"}</span>
                        {items.length ? (
                          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
                            <button type="button" className="text-white" aria-label="ตัวเลือกความคิดเห็น">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </Dropdown>
                        ) : null}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-white">
                        {comment.display_text || comment.text}
                      </p>
                    </div>
                  </article>
                );
              })}
              {commentsQuery.hasNextPage ? (
                <button
                  type="button"
                  onClick={() => void commentsQuery.fetchNextPage()}
                  disabled={commentsQuery.isFetchingNextPage}
                  className="w-full py-2 text-sm text-gray-400 hover:text-white"
                >
                  {commentsQuery.isFetchingNextPage ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-gray-500">ยังไม่มีความคิดเห็น</p>
          )}
        </div>

        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendComment();
              }}
              placeholder="เพิ่มความคิดเห็น..."
              className="h-10 flex-1 rounded-full bg-zinc-800 px-4 text-sm text-white outline-none focus:ring-1 focus:ring-zinc-500"
            />
            <button
              type="button"
              onClick={sendComment}
              disabled={!text.trim() || createCommentMutation.isPending}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white disabled:bg-zinc-800 disabled:text-gray-500"
              aria-label="ส่งความคิดเห็น"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default StoryCommentModal;
