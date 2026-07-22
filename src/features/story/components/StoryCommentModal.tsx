"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, MoreHorizontal, MessageCircle, Send, AlertTriangle, Trash2 } from 'lucide-react';
import { useVideoComments, useVideoCommentReplies } from '../hooks/useVideoComments';
import { StoryItemType, VideoComment } from '../types/storyTypes';
import { Dropdown, Spin, Drawer, ConfigProvider } from 'antd';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

interface StoryCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: StoryItemType;
  refId: number;
}

const CommentItem: React.FC<{
  comment: VideoComment;
  onReply: (comment: VideoComment) => void;
  onDelete: (id: number) => void;
  onReport: (id: number) => void;
  isOwner: boolean;
}> = ({ comment, onReply, onDelete, onReport, isOwner }) => {
  const [showReplies, setShowReplies] = useState(false);
  const { repliesQuery } = useVideoCommentReplies(comment.id, showReplies);

  const menuItems = [];
  if (comment.can_delete) {
    menuItems.push({
      key: 'delete',
      label: 'ลบคอมเมนต์',
      icon: <Trash2 className="w-4 h-4 text-red-500" />,
      danger: true,
      onClick: () => onDelete(comment.id),
    });
  }
  if (!comment.is_owner) {
    menuItems.push({
      key: 'report',
      label: 'รายงาน',
      icon: <AlertTriangle className="w-4 h-4" />,
      onClick: () => onReport(comment.id),
    });
  }

  return (
    <div className="flex gap-3 mb-5">
      <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 shrink-0 relative">
        {comment.user?.img ? (
          <Image 
            src={comment.user.img} 
            alt={comment.user.fullname} 
            fill 
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.srcset = '';
              target.src = '/images/default-avatar.png';
            }}
          />
        ) : (
          <Image 
            src="/images/default-avatar.png" 
            alt={comment.user?.fullname || "User"} 
            fill 
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <span className="text-gray-400 text-sm font-semibold">{comment.user.fullname}</span>
          {menuItems.length > 0 && (
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
              <button className="!text-white hover:!text-gray-300 transition-colors" style={{ color: 'white' }}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </Dropdown>
          )}
        </div>
        <p className="text-white text-sm mt-1 whitespace-pre-wrap leading-relaxed">{comment.display_text}</p>
        
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs !text-gray-200" style={{ color: '#e5e7eb' }}>
            {new Date(comment.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
          </span>
          <button 
            onClick={() => onReply(comment)} 
            className="text-xs !text-white font-bold hover:!text-gray-200 transition-colors"
            style={{ color: 'white' }}
          >
            ตอบกลับ
          </button>
        </div>

        {comment.reply_count > 0 && !showReplies && (
          <button 
            onClick={() => setShowReplies(true)}
            className="text-xs !text-white font-semibold mt-3 hover:!text-gray-200 transition-colors flex items-center gap-2"
            style={{ color: 'white' }}
          >
            <div className="w-6 h-[1px] bg-white" />
            ดูการตอบกลับ ({comment.reply_count})
          </button>
        )}

        {showReplies && (
          <div className="mt-4 pl-4 border-l border-zinc-800 space-y-4">
            {repliesQuery.isLoading ? (
              <div className="py-2 flex justify-center"><Spin size="small" /></div>
            ) : (
              repliesQuery.data?.items.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 shrink-0 relative">
                    {reply.user?.img ? (
                      <Image 
                        src={reply.user.img} 
                        alt={reply.user.fullname} 
                        fill 
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.srcset = '';
                          target.src = '/images/default-avatar.png';
                        }}
                      />
                    ) : (
                      <Image 
                        src="/images/default-avatar.png" 
                        alt={reply.user?.fullname || "User"} 
                        fill 
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-400 text-xs font-semibold">{reply.user.fullname}</span>
                      {(reply.can_delete || !reply.is_owner) && (
                        <Dropdown 
                          menu={{ items: [
                            reply.can_delete ? {
                              key: 'delete',
                              label: 'ลบ',
                              danger: true,
                              onClick: () => onDelete(reply.id),
                            } : null,
                            !reply.is_owner ? {
                              key: 'report',
                              label: 'รายงาน',
                              onClick: () => onReport(reply.id),
                            } : null,
                          ].filter(Boolean) as any[] }} 
                          trigger={['click']} 
                          placement="bottomRight"
                        >
                          <button className="!text-white hover:!text-gray-300 transition-colors" style={{ color: 'white' }}>
                            <MoreHorizontal className="w-3 h-3" />
                          </button>
                        </Dropdown>
                      )}
                    </div>
                    <p className="text-white text-sm mt-1 whitespace-pre-wrap">{reply.display_text}</p>
                  </div>
                </div>
              ))
            )}
            <button 
              onClick={() => setShowReplies(false)}
              className="text-xs !text-white font-semibold mt-2 hover:!text-gray-200 transition-colors"
              style={{ color: 'white' }}
            >
              ซ่อนการตอบกลับ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const StoryCommentModal: React.FC<StoryCommentModalProps> = ({ isOpen, onClose, type, refId }) => {
  const { isLoggedIn } = useAuthStore();
  const { openLoginModal } = useUIStore();
  
  const { 
    commentsQuery, 
    createCommentMutation, 
    deleteCommentMutation, 
    reportCommentMutation 
  } = useVideoComments(type, refId);
  const { replyMutation } = useVideoCommentReplies(0, false); // Just for the mutation, id doesn't matter here if we pass directly to API, but wait - our hook needs the id for mutation.
  
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<VideoComment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const comments = commentsQuery.data?.pages.flatMap((page) => page?.items || []) || [];

  const handleSend = () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!inputText.trim()) return;

    if (replyingTo) {
      // Import api directly to bypass hook id requirement for generic reply
      import('../services/storyApi').then(({ storyApi }) => {
         storyApi.replyComment(replyingTo.id, inputText).then(() => {
           commentsQuery.refetch(); // Refetch root to update counts
         });
      });
    } else {
      createCommentMutation.mutate(inputText);
    }
    
    setInputText('');
    setReplyingTo(null);
  };

  const handleReplyClick = (comment: VideoComment) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    setReplyingTo(comment);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <ConfigProvider theme={{ token: { zIndexPopupBase: 10000 } }}>
      <Drawer
      placement={isMobile ? "bottom" : "right"}
      onClose={onClose}
      open={isOpen}
      height={isMobile ? "75vh" : "100%"}
      width={isMobile ? "100%" : 400}
      zIndex={10000}
      classNames={{
        body: '!p-0 !bg-[#121212]',
        header: '!bg-[#121212] !border-b-zinc-800',
      }}
      title={<span className="text-white text-base font-bold text-center block">ความคิดเห็น</span>}
      closeIcon={<X className="text-white w-5 h-5" />}
    >
      <div className="flex flex-col h-full bg-[#121212]">
        <div 
          className="flex-1 overflow-y-auto p-4" 
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
        >
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              onReply={handleReplyClick}
              onDelete={(id) => deleteCommentMutation.mutate(id)}
              onReport={(id) => reportCommentMutation.mutate(id)}
              isOwner={comment.is_owner ?? false}
            />
          ))}

          {commentsQuery.hasNextPage && (
            <div className="text-center mt-4">
              <button 
                onClick={() => commentsQuery.fetchNextPage()}
                disabled={commentsQuery.isFetchingNextPage}
                className="text-gray-400 text-sm hover:text-white transition-colors"
              >
                {commentsQuery.isFetchingNextPage ? <Spin size="small" /> : 'โหลดเพิ่มเติม'}
              </button>
            </div>
          )}
          
          {!commentsQuery.isLoading && comments.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
              <p>ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็นสิ!</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#121212] border-t border-zinc-800">
          <div className="flex items-end gap-3">
            <div className="flex-1 flex flex-col">
              {replyingTo && (
                <div className="flex justify-between items-center px-1 mb-2 text-xs text-gray-400">
                  <span>กำลังตอบกลับ <span className="font-semibold text-gray-300">{replyingTo.user.fullname}</span></span>
                  <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-zinc-800 rounded-full transition-colors"><X className="w-3 h-3 hover:text-white" /></button>
                </div>
              )}
              <input 
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder={replyingTo ? `ตอบกลับ ${replyingTo.user.fullname}...` : "เพิ่มความคิดเห็น..."}
                className="w-full bg-zinc-800 text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${inputText.trim() ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-gray-500'}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        </div>
      </Drawer>
    </ConfigProvider>
  );
};

export default StoryCommentModal;
