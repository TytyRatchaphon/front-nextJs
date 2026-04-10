"use client"

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CollectionCommentData, postCollectionReply, deleteCollectionComment, deleteCollectionReply, reportCollectionComment, reportCollectionReply } from "@/services/api/collectionApi";
import { Button, Input, Modal, App, Popover } from "antd";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { sanitizeUserGeneratedHtml } from "@/utils/sanitizeHtml";
import FrameOverlayImage from "@/components/ui/FrameOverlayImage";

interface CollectionCommentItemProps {
    comment: CollectionCommentData;
    onReplySuccess?: () => void;
    currentUserId?: number | null;
    onDeleteSuccess?: () => void;
}

// Helper Component for safe avatar loading
const SafeAvatar = ({ src, alt, className, isReply = false }: { src?: string | null, alt: string, className?: string, isReply?: boolean }) => {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <Image
                src="/images/default-avatar.png"
                alt={alt || "Default User"}
                fill={!isReply}
                width={isReply ? 20 : undefined}
                height={isReply ? 20 : undefined}
                className={className}
                unoptimized
            />
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill={!isReply}
            width={isReply ? 20 : undefined}
            height={isReply ? 20 : undefined}
            className={className}
            unoptimized
            onError={() => setHasError(true)}
        />
    );
};

export default function CollectionCommentItem({
    comment,
    onReplySuccess,
    currentUserId,
    onDeleteSuccess,
}: CollectionCommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const { notification: api } = App.useApp();
    const [modal, contextHolderModal] = Modal.useModal();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    
    const { token } = useAuthStore() as any;
    const { openLoginModal } = useUIStore();

    const userAvatar = comment.user?.img || null;
    const userFrame = comment.user?.frame_img || null;

    // Format Date
    const formattedDate = new Date(comment.created_at).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const safeCommentHtml = React.useMemo(
        () => sanitizeUserGeneratedHtml(comment.comment),
        [comment.comment]
    );

    const handleReplySubmit = async () => {
        if (!token) {
            openLoginModal();
            return;
        }
        if (!replyText.trim()) return;

        try {
            await postCollectionReply(comment.collection_id, comment.id, replyText);
            
            api.success({
                message: 'สำเร็จ',
                description: 'ตอบกลับเรียบร้อยแล้ว',
                placement: 'topRight',
                icon: (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )
            });
            setReplyText("");
            setIsReplying(false);
            if (onReplySuccess) {
                onReplySuccess();
            }
        } catch (error: any) {
            api.error({
                message: 'เกิดข้อผิดพลาด',
                description: error?.response?.data?.message || "เกิดข้อผิดพลาดในการตอบกลับ",
                placement: 'topRight'
            });
        }
    };

    const handleDelete = () => {
        setIsPopoverOpen(false);
        modal.confirm({
            title: 'ยืนยันการลบ',
            content: 'คุณต้องการลบความคิดเห็นนี้ใช่หรือไม่?',
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    await deleteCollectionComment(comment.collection_id, comment.id);

                    if (onDeleteSuccess) {
                        onDeleteSuccess();
                    } else {
                        api.success({
                            message: 'สำเร็จ',
                            description: 'ลบความคิดเห็นเรียบร้อยแล้ว',
                            placement: 'topRight',
                        });
                        if (onReplySuccess) {
                            onReplySuccess();
                        }
                    }
                } catch (error: any) {
                    api.error({
                        message: 'เกิดข้อผิดพลาด',
                        description: error?.response?.data?.message || "ไม่สามารถลบความคิดเห็นได้",
                        placement: 'topRight'
                    });
                }
            }
        });
    };

    const handleReport = async () => {
        if (!token) {
            openLoginModal();
            return;
        }
        setIsPopoverOpen(false);
        try {
            await reportCollectionComment(comment.id);
            api.success({
                message: 'สำเร็จ',
                description: 'รายงานความคิดเห็นเรียบร้อยแล้ว',
                placement: 'topRight',
            });
        } catch (error: any) {
            api.error({
                message: 'เกิดข้อผิดพลาด',
                description: error?.response?.data?.message || "ไม่สามารถรายงานความคิดเห็นได้",
                placement: 'topRight'
            });
        }
    };

    const actionContent = (
        <div className="flex flex-col min-w-[120px]">
            {currentUserId && Number(currentUserId) === Number(comment.user_id) ? (
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors w-full rounded"
                >
                    ลบความคิดเห็น
                </button>
            ) : (
                <button
                    onClick={handleReport}
                    className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full rounded"
                >
                    รายงานความคิดเห็นนี้
                </button>
            )}
        </div>
    );

    return (
        <div className="py-6 border-b last:border-0 relative group border-gray-100">
            {contextHolderModal}

            {/* Action Menu (3 Dots) */}
            <div className="absolute top-6 right-0">
                <Popover
                    content={actionContent}
                    trigger="click"
                    placement="bottomRight"
                    open={isPopoverOpen}
                    onOpenChange={setIsPopoverOpen}
                    arrow={false}
                >
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                </Popover>
            </div>

            <div className="flex gap-4">
                {/* Avatar & Frame Container */}
                <div className="flex-shrink-0">
                    <Link href={`/profile/${comment.user_id}`} className="block relative w-10 h-10 sm:w-12 sm:h-12 border bg-gray-100 border-gray-200 rounded-full overflow-hidden">
                        <SafeAvatar 
                            src={userAvatar} 
                            alt={comment.user?.fullname || "User"} 
                            className="object-cover"
                        />
                        {/* Frame Overlay (if exists) */}
                        {userFrame && (
                            <div className="absolute -top-[15%] -left-[15%] w-[130%] h-[130%] pointer-events-none z-10">
                                <FrameOverlayImage src={userFrame} alt="User Frame" className="object-contain" />
                            </div>
                        )}
                    </Link>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                    {/* Header */}
                    <div className="mb-2">
                        <Link href={`/profile/${comment.user_id}`}>
                            <h4 className="text-sm font-semibold mb-1 text-gray-900 hover:underline">
                                {comment.user?.fullname || "Anonymous User"}
                            </h4>
                        </Link>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">• {formattedDate}</span>
                        </div>
                    </div>

                    {/* Comment Text */}
                    <div
                        className="comment-rich-content text-sm leading-relaxed break-words mb-3 text-gray-800 [&>p]:mb-2 [&>p:last-child]:mb-0 [&_img]:max-w-full [&_img]:h-auto [&_img]:inline-block [&_img]:align-middle"
                        dangerouslySetInnerHTML={{ __html: safeCommentHtml }}
                    />

                    {/* Actions: Reply Button */}
                    <div className="mb-3">
                        <button
                            onClick={() => {
                                if (!token) {
                                    openLoginModal();
                                    return;
                                }
                                setIsReplying(!isReplying);
                            }}
                            className="text-xs text-gray-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            ตอบกลับ
                        </button>
                    </div>

                    {/* Reply Input Form */}
                    {isReplying && (
                        <div className="mb-4 p-3 rounded-lg animate-fade-in bg-gray-50">
                            <Input.TextArea
                                autoSize={{ minRows: 2, maxRows: 4 }}
                                placeholder={`ตอบกลับคุณ ${comment.user?.fullname || "..."}`}
                                className="mb-2 !text-sm"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="small" onClick={() => setIsReplying(false)}>ยกเลิก</Button>
                                <Button size="small" type="primary" className="bg-red-600 hover:!bg-red-700" onClick={handleReplySubmit}>ส่ง</Button>
                            </div>
                        </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="space-y-3 mt-3 border-l-2 border-gray-100 pl-4 ml-2">
                            {comment.replies.map((reply, replyIndex) => {
                                const safeReplyComment = sanitizeUserGeneratedHtml(reply.comment);
                                return (
                                <div key={reply.id || replyIndex} className="rounded-lg p-3 sm:p-4 border relative group/reply bg-gray-50 border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {/* Small Avatar for Replier */}
                                            <Link href={`/profile/${reply.user_id}`} className="block w-5 h-5 rounded-full overflow-hidden shrink-0 bg-gray-200">
                                                <SafeAvatar 
                                                    src={reply.user?.img} 
                                                    alt="Replier" 
                                                    className="object-cover w-full h-full"
                                                    isReply={true}
                                                />
                                            </Link>
                                            <Link href={`/profile/${reply.user_id}`}>
                                                <span className="text-xs sm:text-sm font-bold text-gray-800 hover:underline">
                                                    {reply.user?.fullname || "Admin"}
                                                </span>
                                            </Link>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(reply.created_at).toLocaleDateString("th-TH")}
                                            </span>
                                        </div>

                                        {/* Reply Actions */}
                                        <Popover
                                            content={
                                                <div className="flex flex-col min-w-[120px]">
                                                    {currentUserId && Number(currentUserId) === Number(reply.user_id) ? (
                                                        <button
                                                            onClick={() => {
                                                                modal.confirm({
                                                                    title: 'ยืนยันการลบ',
                                                                    content: 'คุณต้องการลบการตอบกลับนี้ใช่หรือไม่?',
                                                                    okText: 'ลบ',
                                                                    okType: 'danger',
                                                                    cancelText: 'ยกเลิก',
                                                                    onOk: async () => {
                                                                        try {
                                                                            await deleteCollectionReply(comment.collection_id, comment.id, reply.id);
                                                                            api.success({ message: 'สำเร็จ', description: 'ลบการตอบกลับเรียบร้อยแล้ว' });
                                                                            if (onReplySuccess) onReplySuccess();
                                                                        } catch (err: any) {
                                                                            api.error({ message: 'ผิดพลาด', description: err?.response?.data?.message || 'ไม่สามารถลบได้' });
                                                                        }
                                                                    }
                                                                });
                                                            }}
                                                            className="px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors w-full rounded"
                                                        >
                                                            ลบการตอบกลับ
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={async () => {
                                                                if (!token) {
                                                                    openLoginModal();
                                                                    return;
                                                                }
                                                                try {
                                                                    await reportCollectionReply(reply.id);
                                                                    api.success({ message: 'สำเร็จ', description: 'รายงานการตอบกลับเรียบร้อยแล้ว' });
                                                                } catch (err: any) {
                                                                    api.error({ message: 'ผิดพลาด', description: err?.response?.data?.message || 'ไม่สามารถรายงานได้' });
                                                                }
                                                            }}
                                                            className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full rounded"
                                                        >
                                                            รายงาน
                                                        </button>
                                                    )}
                                                </div>
                                            }
                                            trigger="click"
                                            placement="bottomRight"
                                            arrow={false}
                                        >
                                            <button className="text-gray-400 hover:text-gray-600 p-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="1"></circle>
                                                    <circle cx="12" cy="5" r="1"></circle>
                                                    <circle cx="12" cy="19" r="1"></circle>
                                                </svg>
                                            </button>
                                        </Popover>
                                    </div>
                                    {/* Reply content sends HTML */}
                                    <div
                                        className="comment-rich-content text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: safeReplyComment }}
                                    />
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
