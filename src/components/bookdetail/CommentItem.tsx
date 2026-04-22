"use client";
import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { CommentData, CommentEpData } from "@/types/api";
import { postReply, deleteBookReview, reportBookReview, postCommentReply, deleteBookComment, reportBookComment, deleteBookReviewReply, reportBookReviewReply, deleteBookCommentReply, reportBookCommentReply, postReviewReplyNotification, postEpisodeReply, deleteEpisodeComment, reportEpisodeComment, deleteEpisodeReply, reportEpisodeReply, postCommentReplyNotification } from "@/services/apiServices";
import { Button, Input, notification, Popover, Modal } from "antd";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import ProfileAvatarLink from "@/components/ui/ProfileAvatarLink";
import { sanitizeUserGeneratedHtml } from "@/utils/sanitizeHtml";

interface CommentItemProps {
    review: CommentData | CommentEpData;
    onReplySuccess?: () => void;
    currentUserId?: number | null;
    onDeleteSuccess?: () => void;
    mode?: "comment" | "comment_ep" | "read_ep_comment";
    theme?: { bg: string; text: string; key: string };
}

const normalizeRemoteImageSrc = (src?: string | null, fallback = "/images/default-avatar.png") => {
    if (!src || src === "null" || src === "undefined") return fallback;
    if (src.startsWith("http") || src.startsWith("data:")) return src.replace("http:", "https:");
    if (src.startsWith("/")) return src;
    if (src.startsWith("img/")) return `https://img.enjoybook.co/${src}`;
    return `https://img.enjoybook.co/${src}`;
};

export default function CommentItem({
    review,
    onReplySuccess,
    currentUserId,
    onDeleteSuccess,
    mode = "comment",
    theme
}: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [api, contextHolder] = notification.useNotification();
    const [modal, contextHolderModal] = Modal.useModal();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const { token } = useAuthStore() as any;
    const { openLoginModal } = useUIStore();

    const userAvatar = review.user?.img || null;
    // Expanded Logic for debugging
    const fImg = review.user?.frame_img;
    const fProp = review.user?.frame;

    // Prioritize frame_img (flat), then frame (string), then frame.img (object)
    const userFrame = fImg || (typeof fProp === 'string' ? fProp : fProp?.img) || null;
    const normalizedUserFrame = normalizeRemoteImageSrc(userFrame, "");

    // Debug Log (Remove in production)
    // 


    // Format Date
    const formattedDate = new Date(review.update_at).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const safeReviewComment = React.useMemo(
        () => sanitizeUserGeneratedHtml(review.comment),
        [review.comment]
    );

    // Type Guards
    const isReview = (item: CommentData | CommentEpData): item is CommentData => {
        return (item as CommentData).comment_book_id !== undefined;
    };

    const handleReplySubmit = async () => {
        if (!token) {
            openLoginModal();
            return;
        }
        if (!replyText.trim()) return;

        try {
            if (isReview(review)) {
                const res = await postReply(review.comment_book_id, replyText);
                // Trigger notification for review reply using the new reply ID
                const newReplyId = res?.data?.comment_sub_book_id || res?.comment_sub_book_id;
                if (newReplyId) {
                    await postReviewReplyNotification(newReplyId);
                }
            } else {
                // For comments, use comment_ep_id
                const id = (review as CommentEpData).comment_ep_id;
                if (!id) throw new Error("Comment ID not found");

                if (mode === "read_ep_comment") {
                    const res = await postEpisodeReply(id, replyText);
                    // Trigger notification for episode reply
                    const newReplyId = res?.data?.comment_sub_ep_id || res?.comment_sub_ep_id;
                    if (newReplyId) {
                        await postCommentReplyNotification(newReplyId);
                    }
                } else {
                    await postCommentReply(id, replyText);
                }
            }

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
            // Refresh comments if callback provided
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
                    if (isReview(review)) {
                        await deleteBookReview(review.comment_book_id);
                    } else {
                        const id = (review as CommentEpData).comment_ep_id;
                        if (!id) throw new Error("Comment ID not found");

                        if (mode === "read_ep_comment") {
                            await deleteEpisodeComment(id);
                        } else {
                            await deleteBookComment(id);
                        }
                    }

                    if (onDeleteSuccess) {
                        onDeleteSuccess();
                    } else {
                        // Fallback local notification
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
        setIsPopoverOpen(false);
        try {
            if (isReview(review)) {
                await reportBookReview(review.comment_book_id);
            } else {
                const id = (review as CommentEpData).comment_ep_id;
                if (!id) throw new Error("Comment ID not found");

                if (mode === "read_ep_comment") {
                    await reportEpisodeComment(id);
                } else {
                    await reportBookComment(id);
                }
            }

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
            {currentUserId && Number(currentUserId) === Number(review.user_id) ? (
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors w-full rounded"
                >
                    ลบความคิดเห็น
                </button>
            ) : (
                <button
                    onClick={handleReport}
                    className={`px-4 py-2 text-left text-sm transition-colors w-full rounded ${theme?.key === 'black' ? 'text-gray-300 hover:bg-[#333]' : theme?.key === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    รายงานความคิดเห็นนี้
                </button>
            )}
        </div>
    );

    return (
        <div className={`py-6 border-b last:border-0 relative group ${theme?.key === 'black' ? 'border-[#333]' : theme?.key === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
            {contextHolder}
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
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                        {/* Base Avatar */}
                        <ProfileAvatarLink
                            userId={review.user_id}
                            name={review.user?.fullname || "User"}
                            avatarSrc={userAvatar}
                            frameSrc={normalizedUserFrame}
                            sizeClassName="w-10 h-10 sm:w-12 sm:h-12"
                            frameScaleClassName="-top-[15%] -left-[15%] w-[130%] h-[130%]"
                            imageClassName="object-cover"
                            className={theme?.key === 'black' ? 'bg-[#1f1f1f]' : theme?.key === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6"> {/* Added padding right for menu */}
                    {/* Header */}
                    <div className="mb-2">
                        <Link href={`/profile/${review.user_id}`}>
                            <h4 className={`text-sm font-semibold mb-1 hover:underline ${theme ? theme.text : 'text-gray-900'}`}>
                                {review.user?.fullname || "Anonymous User"}
                            </h4>
                        </Link>
                        <div className="flex items-center gap-2">
                            {/* {isReview(review) && (
                    <>
                        <Rate disabled defaultValue={review.star} className="text-sm !text-gray-900 [&_.ant-rate-star-second]:!text-gray-900 [&_.ant-rate-star-zero_svg]:!text-gray-200" style={{ fontSize: 14 }} />
                        <span className="text-xs text-gray-500 font-medium">{review.star}</span>
                    </>
                )} */}
                            {/* For reviews: unit_ep. For comments: maybe nothing or ep_name? */}
                            {isReview(review) && review.unit_ep > 0 && (
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                    อ่านแล้ว {review.unit_ep} ตอน
                                </span>
                            )}
                            {/* Check if Ep Name exists (in CommentEpData) */}
                            {((review as CommentEpData).ep_name) && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                    จากตอน {(review as CommentEpData).ep_name}
                                </span>
                            )}
                            <span className={`text-xs ${theme?.key === 'dark' || theme?.key === 'black' ? 'text-gray-500' : 'text-gray-400'}`}>• {formattedDate}</span>
                        </div>
                    </div>

                    {/* Comment Text */}
                    <div
                        className={`comment-rich-content text-sm leading-relaxed break-words mb-3 [&>p]:mb-2 [&>p:last-child]:mb-0 [&_img]:max-w-full [&_img]:h-auto [&_img]:inline-block [&_img]:align-middle ${theme ? theme.text : 'text-gray-800'}`}
                        dangerouslySetInnerHTML={{ __html: safeReviewComment }}
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
                        <div className={`mb-4 p-3 rounded-lg animate-fade-in ${theme?.key === 'black' ? 'bg-[#1f1f1f]' : theme?.key === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <Input.TextArea
                                autoSize={{ minRows: 2, maxRows: 4 }}
                                placeholder={`ตอบกลับคุณ ${review.user?.fullname || "..."}`}
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

                    {/* Admin Reply (comment_sub_data) */}
                    {review.comment_sub_data && review.comment_sub_data.length > 0 && (
                        <div className="space-y-3 mt-3">
                            {review.comment_sub_data.map((reply, replyIndex) => {
                                const safeReplyComment = sanitizeUserGeneratedHtml(reply.comment);
                                return (
                                <div key={reply.comment_sub_book_id || reply.comment_sub_ep_id || replyIndex} className={`rounded-lg p-3 sm:p-4 border relative group/reply ${theme?.key === 'black' ? 'bg-[#1f1f1f]/50 border-[#333]' : theme?.key === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {/* Small Avatar for Replier */}
                                            <ProfileAvatarLink
                                                userId={reply.user_id}
                                                name={reply.user?.fullname || "Replier"}
                                                avatarSrc={reply.user?.img}
                                                frameSrc={normalizeRemoteImageSrc(reply.user?.frame_img || (typeof reply.user?.frame === 'string' ? reply.user?.frame : reply.user?.frame?.img) || null, "")}
                                                sizeClassName="w-5 h-5"
                                                frameScaleClassName="-inset-1"
                                                imageClassName="object-cover"
                                                className={theme?.key === 'black' ? 'bg-[#333]' : theme?.key === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}
                                            />
                                            <Link href={`/profile/${reply.user_id}`}>
                                                <span className={`text-xs sm:text-sm font-bold hover:underline ${theme ? theme.text : 'text-gray-800'}`}>
                                                    {reply.user?.fullname || "Admin"}
                                                </span>
                                            </Link>
                                            {/* Optional: Add Date for reply if needed */}
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(reply.update_at).toLocaleDateString("th-TH")}
                                            </span>
                                        </div>

                                        {/* Reply Actions (Review & Comment Mode) */}
                                        {((mode === 'comment' && reply.comment_sub_book_id) || (mode === 'comment_ep' && reply.comment_sub_ep_id) || (mode === 'read_ep_comment' && reply.comment_sub_ep_id)) && (
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
                                                                                if (mode === 'comment' && reply.comment_sub_book_id) {
                                                                                    await deleteBookReviewReply(reply.comment_sub_book_id);
                                                                                } else if (mode === 'comment_ep' && reply.comment_sub_ep_id) {
                                                                                    await deleteBookCommentReply(reply.comment_sub_ep_id);
                                                                                } else if (mode === 'read_ep_comment' && reply.comment_sub_ep_id) {
                                                                                    await deleteEpisodeReply(reply.comment_sub_ep_id);
                                                                                }
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
                                                                    try {
                                                                        if (mode === 'comment' && reply.comment_sub_book_id) {
                                                                            await reportBookReviewReply(reply.comment_sub_book_id);
                                                                        } else if (mode === 'comment_ep' && reply.comment_sub_ep_id) {
                                                                            await reportBookCommentReply(reply.comment_sub_ep_id);
                                                                        } else if (mode === 'read_ep_comment' && reply.comment_sub_ep_id) {
                                                                            await reportEpisodeReply(reply.comment_sub_ep_id);
                                                                        }
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
                                        )}
                                    </div>
                                    {/* Reply content sends HTML */}
                                    <div
                                        className={`comment-rich-content text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none ${theme ? theme.text : 'text-gray-700'}`}
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
