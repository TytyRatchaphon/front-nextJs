"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Rate, Input, App } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import parse from 'html-react-parser';
import { Edit2, Trash2, Heart, Share2, MessageCircle, Flag, Send } from 'lucide-react';
import { likeReview, shareReview, postReviewComment, fetchReviewComments, reportReviewOrComment } from '@/services/api/commentApi';
import { useAuthStore } from '@/stores/authStore';

dayjs.extend(relativeTime);
dayjs.locale('th');

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: any | null;
  currentUserId?: number;
  onEdit?: (review: any) => void;
  onDelete?: (review: any) => void;
}

export default function ReviewModal({ isOpen, onClose, review, currentUserId, onEdit, onDelete }: ReviewModalProps) {
  const REVIEW_MODAL_Z_INDEX = 3000;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const { notification, modal } = App.useApp();
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen && review) {
      setLiked(review.is_liked || false);
      setLikeCount(review.like_count || review.likes || 0);
      setShareCount(review.share_count || review.shares || 0);
      loadComments();
    }
  }, [isOpen, review]);

  const loadComments = async () => {
    if (!review) return;
    const reviewId = review.review_id || review.id;
    setIsLoadingComments(true);
    try {
      const res = await fetchReviewComments(reviewId);
      setComments(res.comments || []);
    } catch {
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!review || !user) {
      notification.warning({ message: 'กรุณาเข้าสู่ระบบเพื่อกดถูกใจ', placement: 'topRight' });
      return;
    }
    try {
      const reviewId = review.review_id || review.id;
      await likeReview(reviewId);
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } catch {
      notification.error({ message: 'เกิดข้อผิดพลาด', placement: 'topRight' });
    }
  };

  const handleShare = async () => {
    if (!review) return;
    try {
      const reviewId = review.review_id || review.id;
      await shareReview(reviewId);
      setShareCount(prev => prev + 1);
      // Copy link to clipboard
      const url = `${window.location.origin}/review/${reviewId}`;
      await navigator.clipboard.writeText(url);
      notification.success({ message: 'คัดลอกลิงก์แล้ว', placement: 'topRight' });
    } catch {
      notification.error({ message: 'เกิดข้อผิดพลาดในการแชร์', placement: 'topRight' });
    }
  };

  const handleReport = (targetType: 'review' | 'comment', targetId: string | number) => {
    if (!user) {
      notification.warning({ message: 'กรุณาเข้าสู่ระบบเพื่อรายงาน', placement: 'topRight' });
      return;
    }
    modal.confirm({
      zIndex: REVIEW_MODAL_Z_INDEX + 10,
      title: 'ยืนยันการรายงาน',
      content: targetType === 'review' ? 'ต้องการรายงานรีวิวนี้ใช่หรือไม่?' : 'ต้องการรายงานความคิดเห็นนี้ใช่หรือไม่?',
      okText: 'รายงาน',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          await reportReviewOrComment(targetType, targetId);
          notification.success({ message: 'รายงานสำเร็จ ขอบคุณสำหรับการแจ้ง', placement: 'topRight' });
        } catch (error: any) {
          notification.error({ message: error?.response?.data?.message || 'เกิดข้อผิดพลาดในการรายงาน', placement: 'topRight' });
        }
      }
    });
  };

  const handleSubmitComment = async () => {
    if (!review || !commentText.trim()) return;
    if (!user) {
      notification.warning({ message: 'กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น', placement: 'topRight' });
      return;
    }
    try {
      setIsSubmitting(true);
      const reviewId = review.review_id || review.id;
      await postReviewComment(reviewId, commentText.trim());
      setCommentText('');
      notification.success({ message: 'แสดงความคิดเห็นสำเร็จ', placement: 'topRight' });
      loadComments(); // Reload comments
    } catch (error: any) {
      notification.error({ message: error?.response?.data?.message || 'เกิดข้อผิดพลาด', placement: 'topRight' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!review) return null;

  const isOwner = user?.user_id && user.user_id === review.user?.user_id;
  const userAvatar = review.user?.img || '/images/default-avatar.png';
  const userName = review.user?.fullname || 'Unknown';
  const timeAgo = dayjs(review.created_at).fromNow();
  const bookCover = review.book?.img || review.book?.img_full || '/images/default-cover.png';
  const bookTitle = review.book?.name || 'Unknown Book';
  const bookTag = review.book?.tag?.[0] || 'นิยาย';
  const writerName = review.book?.writer_name || 'Unknown Writer';
  const reviewId = review.review_id || review.id;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      zIndex={REVIEW_MODAL_Z_INDEX}
      className="font-primary"
      closeIcon={<span className="text-gray-400 hover:text-red-500 transition-colors">✕</span>}
    >
      <div className="p-2 sm:p-4">
        {/* Header: User & Time */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image src={userAvatar} alt={userName} fill className="object-cover" />
            </div>
            <div>
              <div className="text-base font-bold text-gray-800">{userName}</div>
              <div className="text-sm text-gray-400">{timeAgo}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => onEdit?.(review)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-[#E33527] px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  <Edit2 size={14} />
                  <span>แก้ไข</span>
                </button>
                <button
                  onClick={() => onDelete?.(review)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  <Trash2 size={14} />
                  <span>ลบ</span>
                </button>
              </>
            ) : currentUserId ? (
              <button
                onClick={() => handleReport('review', reviewId)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-orange-500 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors text-sm"
              >
                <Flag size={14} />
                <span>รายงาน</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Rating & Episode */}
        <div className="flex items-center gap-2 mb-4">
          <Rate disabled defaultValue={review.rating} allowHalf className="text-base text-yellow-500" />
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            อ่านถึงตอนที่ {review.ep_read || 0}
          </span>
        </div>

        {/* Content */}
        <div className="text-base text-gray-700 leading-relaxed mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px] whitespace-pre-wrap word-break">
          {parse((review.content || '').replace(/\[\/?\s*SPOILER\s*\]/gi, ''))}
        </div>

        {/* Action Buttons: Like, Share, Comment count */}
        <div className="flex items-center gap-6 mb-4 py-2 border-t border-b border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors text-sm font-medium ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount > 0 ? likeCount : ''} ถูกใจ</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors text-sm font-medium"
          >
            <Share2 size={18} />
            <span>{shareCount > 0 ? shareCount : ''} แชร์</span>
          </button>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
            <MessageCircle size={18} />
            <span>{comments.length > 0 ? comments.length : ''} ความคิดเห็น</span>
          </div>
        </div>

        {/* Book Info footer */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-500 mb-2">รีวิวจากเรื่อง</h3>
          <Link href={`/book/${review.book?.book_id}`} className="flex gap-4 bg-white rounded-xl p-3 border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all group">
            <div className="relative w-14 h-20 rounded-md overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
              <Image src={bookCover} alt={bookTitle} fill className="object-cover" unoptimized />
            </div>
            <div className="flex flex-col justify-center overflow-hidden flex-1">
              <h4 className="text-base font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-red-600 transition-colors">{bookTitle}</h4>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[#E33527] font-medium bg-red-50 px-2 py-0.5 rounded">{bookTag}</span>
              </div>
              <p className="text-sm text-gray-500 truncate mt-auto">เขียนโดย: {writerName}</p>
            </div>
          </Link>
        </div>

        {/* Comments Section */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <MessageCircle size={16} />
            ความคิดเห็น {comments.length > 0 && `(${comments.length})`}
          </h3>

          {/* Comment Input */}
          {currentUserId && (
            <div className="flex gap-2 mb-4">
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <Image src={user?.img || '/images/default-avatar.png'} alt="You" fill className="object-cover" />
              </div>
              <div className="flex-1 flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="เขียนความคิดเห็น..."
                  className="rounded-full border-gray-200 hover:border-red-300 focus:border-red-400"
                  onPressEnter={handleSubmitComment}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !commentText.trim()}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E33527] hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {comments.map((comment: any, idx: number) => {
                const commentId = comment.comment_id || comment.id || idx;
                const commentUserId = comment.user?.user_id || comment.user_id;
                const isCommentOwner = currentUserId && currentUserId === commentUserId;
                return (
                  <div key={commentId} className="flex gap-2 group">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image src={comment.user?.img || '/images/default-avatar.png'} alt={comment.user?.fullname || ''} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{comment.user?.fullname || 'ผู้ใช้งาน'}</span>
                          <span className="text-xs text-gray-400">{dayjs(comment.created_at).fromNow()}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5 break-words">{comment.content}</p>
                      </div>
                      {/* Report comment */}
                      {!isCommentOwner && currentUserId && (
                        <button
                          onClick={() => handleReport('comment', commentId)}
                          className="text-xs text-gray-400 hover:text-orange-500 mt-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          รายงาน
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีความคิดเห็น</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
