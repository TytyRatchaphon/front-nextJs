"use client"

import React, { useState } from "react";
import Image from "next/image";
import { CommentThreadData } from "@/types/api";
import { postThreadReply, reportThreadComment, reportThreadReply, deleteThreadReply, deleteThreadComment } from "@/services/apiServices"; // We need to export this
import { Button, Input, notification, Popover } from "antd";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { sanitizeUserGeneratedHtml } from "@/utils/sanitizeHtml";
import FrameOverlayImage from "@/components/ui/FrameOverlayImage";

interface ThreadCommentItemProps {
  review: CommentThreadData;
  onReplySuccess?: () => void;
  currentUserId?: number | null;
  onDeleteSuccess?: () => void;
  topicId?: string | number; // Add this prop
}

export default function ThreadCommentItem({ 
  review, 
  onReplySuccess, 
  currentUserId, 
  topicId,
  onDeleteSuccess,
}: ThreadCommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [api, contextHolder] = notification.useNotification();
  // const [modal, contextHolderModal] = Modal.useModal();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { token } = useAuthStore() as any;
  const { openLoginModal } = useUIStore();

  const userAvatar = review.user?.img || null;
    const fImg = review.user?.frame_img;
    const fProp = review.user?.frame;
    const userFrame = fImg || (typeof fProp === 'string' ? fProp : (fProp as any)?.img) || null; // cast any to avoid ts error

  // Format Date
  const formattedDate = new Date(review.update_at).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const safeReviewComment = React.useMemo(
    () => sanitizeUserGeneratedHtml(review.comment),
    [review.comment]
  );


  const handleReplySubmit = async () => {
    if (!token) {
        openLoginModal();
        return;
    }
    if (!replyText.trim()) return;
    
    // Use prop topicId if available, fallback to review.topic_id (which might be missing in some responses)
    const activeTopicId = topicId || review.topic_id;

    if (!activeTopicId) {
        api.error({
             message: 'เกิดข้อผิดพลาด',
             description: "ไม่พบข้อมูลรหัสกระทู้ (Topic ID)",
             placement: 'topRight'
        });
        return;
    }

    try {
        await postThreadReply(activeTopicId, review.comment_topic_id, replyText);


        api.success({
            message: 'สำเร็จ',
            description: 'ตอบกลับเรียบร้อยแล้ว',
            placement: 'topRight',
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

  // Stub for actions
  const handleDelete = async () => {
      setIsPopoverOpen(false);
      try {
        await deleteThreadComment(review.comment_topic_id);
        api.success({
            message: 'สำเร็จ',
            description: 'ลบความคิดเห็นเรียบร้อยแล้ว',
            placement: 'topRight',
        });
        if (onDeleteSuccess) onDeleteSuccess();
      } catch (error: any) {
        api.error({
            message: 'เกิดข้อผิดพลาด',
            description: error?.response?.data?.message || "ไม่สามารถลบความคิดเห็นได้",
            placement: 'topRight',
        });
      }
  };

  const handleReport = async () => {
      setIsPopoverOpen(false);
      try {
        await reportThreadComment(review.comment_topic_id);
        api.success({
            message: 'สำเร็จ',
            description: 'รายงานความคิดเห็นเรียบร้อยแล้ว',
            placement: 'topRight',
        });
      } catch (error: any) {
        api.error({
            message: 'เกิดข้อผิดพลาด',
            description: error?.response?.data?.message || "ไม่สามารถรายงานความคิดเห็นได้",
            placement: 'topRight',
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
                  className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full rounded"
              >
                  รายงานความคิดเห็นนี้
              </button>
          )}
      </div>
  );

  return (
    <div className="py-6 border-b border-gray-100 last:border-0 relative group">
      {contextHolder}
      
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
            <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                {userAvatar ? (
                <Image
                    src={userAvatar}
                    alt={review.user?.fullname || "User"}
                    fill
                    className="object-cover"
                />
                ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </div>
                )}
            </div>
            
            {/* Frame Overlay */}
            {userFrame && (
                <div className="absolute -top-[15%] -left-[15%] w-[130%] h-[130%] pointer-events-none z-10">
                    <FrameOverlayImage
                      src={typeof userFrame === 'string' ? userFrame.trim() : userFrame}
                      alt="User Frame"
                      className="object-contain"
                    />
                </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          {/* Header */}
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {review.user?.fullname || "Anonymous User"}
            </h4>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">• {formattedDate}</span>
            </div>
          </div>

          {/* Comment Text */}
          <div 
            className="comment-rich-content text-sm text-gray-800 leading-relaxed break-words mb-3 [&>p]:mb-2 [&>p:last-child]:mb-0 [&_img]:max-w-full [&_img]:h-auto [&_img]:inline-block [&_img]:align-middle"
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
             <div className="mb-4 bg-gray-50 p-3 rounded-lg animate-fade-in">
                <Input.TextArea
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    placeholder={`ตอบกลับคุณ ${review.user?.fullname || "..."}`}
                    className="mb-2 !text-sm"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <Button size="small" onClick={() => setIsReplying(false)}>ยกเลิก</Button>
                    <Button size="small" type="primary" className="!bg-red-600 !border-red-600 hover:!bg-red-700 hover:!border-red-700" onClick={handleReplySubmit}>ส่ง</Button>
                </div>
             </div>
           )}

           {/* Replies */}
           {review.comment_sub_data && review.comment_sub_data.length > 0 && (
             <div className="space-y-3 mt-3">
                {review.comment_sub_data.map((reply, replyIndex) => (
                    <ReplyItem 
                        key={reply.comment_sub_topic_id || replyIndex} 
                        reply={reply} 
                        api={api}
                        currentUserId={currentUserId}
                        onReload={onReplySuccess}
                    />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReplyItem({ reply, api, currentUserId, onReload }: { reply: any, api: any, currentUserId?: any, onReload?: () => void }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const safeReplyComment = sanitizeUserGeneratedHtml(reply.comment);

  const handleReportReply = async () => {
      setIsPopoverOpen(false);
      try {
        await reportThreadReply(reply.comment_sub_topic_id);
        api.success({
            message: 'สำเร็จ',
            description: 'รายงานความคิดเห็นเรียบร้อยแล้ว',
            placement: 'topRight',
        });
      } catch (error: any) {
        api.error({
            message: 'เกิดข้อผิดพลาด',
            description: error?.response?.data?.message || "ไม่สามารถรายงานความคิดเห็นได้",
            placement: 'topRight',
        });
      }
  };

  const handleDeleteReply = async () => {
      setIsPopoverOpen(false);
      try {
        await deleteThreadReply(reply.comment_sub_topic_id);
        api.success({
            message: 'สำเร็จ',
            description: 'ลบความคิดเห็นเรียบร้อยแล้ว',
            placement: 'topRight',
        });
        if (onReload) onReload();
      } catch (error: any) {
        api.error({
            message: 'เกิดข้อผิดพลาด',
            description: error?.response?.data?.message || "ไม่สามารถลบความคิดเห็นได้",
            placement: 'topRight',
        });
      }
  };

  const isOwner = currentUserId && Number(currentUserId) === Number(reply.user_id);

  const actionContent = (
      <div className="flex flex-col min-w-[120px]">
          {isOwner ? (
             <button 
                onClick={handleDeleteReply}
                className="px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors w-full rounded"
             >
                ลบความคิดเห็น
             </button>
          ) : (
            <button 
                onClick={handleReportReply}
                className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full rounded"
            >
                รายงานความคิดเห็นนี้
            </button>
          )}
      </div>
  );

  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100 relative group/reply">
        {/* Action Menu (3 Dots) for Reply - Visible on Hover */}
        <div className={`absolute top-2 right-2 transition-opacity ${isPopoverOpen ? 'opacity-100' : 'opacity-0 group-hover/reply:opacity-100'}`}>
          <Popover 
              content={actionContent} 
              trigger="click" 
              placement="bottomRight"
              open={isPopoverOpen}
              onOpenChange={setIsPopoverOpen}
              arrow={false}
          >
              <button className="text-gray-400 hover:text-gray-600 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                  </svg>
              </button>
          </Popover>
        </div>

        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 shrink-0">
                    {reply.user?.img ? (
                        <Image src={reply.user.img} alt="Replier" width={20} height={20} className="object-cover w-full h-full"/>
                    ) : (
                        <div className="w-full h-full bg-red-600 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        </div>
                    )}
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-800">
                    {reply.user?.fullname || "Admin"}
                </span>
                <span className="text-[10px] text-gray-400">
                    {reply.update_at ? new Date(reply.update_at).toLocaleDateString("th-TH") : ""}
                </span>
            </div>
        </div>
        <div 
            className="comment-rich-content text-xs sm:text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: safeReplyComment }}
        />
    </div>
  );
}
