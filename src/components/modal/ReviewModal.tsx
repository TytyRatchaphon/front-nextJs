"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Rate, Input, App, Popover } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import parse from 'html-react-parser';
import { Edit2, Trash2, Heart, Share2, MessageCircle, Flag, Send, Ellipsis } from 'lucide-react';
import { likeReview, shareReview, postReviewComment, fetchReviewComments, deleteReviewComment, reportReviewOrComment } from '@/services/api/commentApi';
import { useAuthStore } from '@/stores/authStore';
import ProfileAvatarLink, { extractFrameSrc, normalizeProfileAssetSrc } from '@/components/ui/ProfileAvatarLink';

dayjs.extend(relativeTime);
dayjs.locale('th');

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: any | null;
  currentUserId?: number;
  onEdit?: (review: any) => void;
  onDelete?: (review: any) => void;
  onReviewUpdate?: (reviewId: string | number, updates: Record<string, any>) => void;
}

const getReviewId = (item: any): string => String(item?.review_id ?? item?.id ?? '');

const patchReviewInQueryData = (
  data: any,
  targetId: string,
  updater: (current: any) => any,
) => {
  if (!data) return data;

  if (Array.isArray(data)) {
    let changed = false;
    const next = data.map((item) => {
      if (getReviewId(item) === targetId) {
        changed = true;
        return updater(item);
      }
      return item;
    });
    return changed ? next : data;
  }

  if (Array.isArray(data.reviews)) {
    let changed = false;
    const nextReviews = data.reviews.map((item: any) => {
      if (getReviewId(item) === targetId) {
        changed = true;
        return updater(item);
      }
      return item;
    });
    return changed ? { ...data, reviews: nextReviews } : data;
  }

  if (data.review && getReviewId(data.review) === targetId) {
    return { ...data, review: updater(data.review) };
  }

  return data;
};

export default function ReviewModal({
  isOpen,
  onClose,
  review,
  currentUserId,
  onEdit,
  onDelete,
  onReviewUpdate,
}: ReviewModalProps) {
  const REVIEW_MODAL_Z_INDEX = 1200;
  const REVIEW_NOTIFICATION_Z_INDEX = 1260;
  const queryClient = useQueryClient();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [openCommentActionId, setOpenCommentActionId] = useState<string | number | null>(null);

  const { notification, modal } = App.useApp();
  const { user } = useAuthStore();

  const syncReviewUpdate = (reviewId: string | number, updates: Record<string, any>) => {
    const targetId = String(reviewId);
    queryClient.setQueriesData(
      {
        predicate: (query) => {
          const root = Array.isArray(query.queryKey) ? String(query.queryKey[0]) : '';
          return root === 'allPinnedReviews' || root === 'pinnedReviews' || root === 'bookReviewsNew';
        },
      },
      (oldData: any) => patchReviewInQueryData(oldData, targetId, (current) => ({ ...current, ...updates })),
    );
    onReviewUpdate?.(reviewId, updates);
  };

  useEffect(() => {
    if (isOpen && review) {
      setLiked(review.is_liked || false);
      setLikeCount(review.like_count || review.likes || 0);
      setShareCount(review.share_count || review.shares || 0);
      void loadComments();
    }
  }, [isOpen, review]);

  const loadComments = async () => {
    if (!review) return;
    const reviewId = review.review_id || review.id;
    setIsLoadingComments(true);
    try {
      const res = await fetchReviewComments(reviewId);
      const nextComments = Array.isArray(res.comments) ? res.comments : [];
      setComments(nextComments);
      syncReviewUpdate(reviewId, {
        comment_count: nextComments.length,
        comments: nextComments.length,
      });
    } catch {
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!review || !user) {
      notification.warning({ message: 'กรุณาเข้าสู่ระบบเพื่อกดถูกใจ', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
      return;
    }
    try {
      const reviewId = review.review_id || review.id;
      await likeReview(reviewId);
      const nextLiked = !liked;
      const nextLikeCount = Math.max(0, likeCount + (liked ? -1 : 1));
      setLiked(nextLiked);
      setLikeCount(nextLikeCount);
      syncReviewUpdate(reviewId, {
        is_liked: nextLiked,
        like_count: nextLikeCount,
        likes: nextLikeCount,
      });
    } catch {
      notification.error({ message: 'เกิดข้อผิดพลาด', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
    }
  };

  const handleShare = async () => {
    if (!review) return;
    try {
      const reviewId = review.review_id || review.id;
      await shareReview(reviewId);
      const nextShareCount = shareCount + 1;
      setShareCount(nextShareCount);
      syncReviewUpdate(reviewId, {
        share_count: nextShareCount,
        shares: nextShareCount,
      });
      const url = `${window.location.origin}/review/${reviewId}`;
      await navigator.clipboard.writeText(url);
      notification.success({ message: 'คัดลอกลิงก์แล้ว', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
    } catch {
      notification.error({ message: 'เกิดข้อผิดพลาดในการแชร์', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
    }
  };

  const handleReport = (targetType: 'review' | 'comment', targetId: string | number) => {
    if (!user) {
      notification.warning({ message: 'กรุณาเข้าสู่ระบบเพื่อรายงาน', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
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
          notification.success({ message: 'รายงานความคิดเห็นสำเร็จ', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
        } catch (error: any) {
          notification.error({ message: error?.response?.data?.message || 'เกิดข้อผิดพลาดในการรายงาน', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
        }
      },
    });
  };

  const handleSubmitComment = async () => {
    if (!review || !commentText.trim()) return;
    if (!user) {
      notification.warning({ message: 'กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
      return;
    }
    try {
      setIsSubmitting(true);
      const reviewId = review.review_id || review.id;
      await postReviewComment(reviewId, commentText.trim());
      const nextCommentCount = comments.length + 1;
      setCommentText('');
      syncReviewUpdate(reviewId, {
        comment_count: nextCommentCount,
        comments: nextCommentCount,
      });
      notification.success({ message: 'แสดงความคิดเห็นสำเร็จ', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
      await loadComments();
    } catch (error: any) {
      notification.error({ message: error?.response?.data?.message || 'เกิดข้อผิดพลาด', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string | number) => {
    if (!review) return;
    if (!user) {
      notification.warning({ message: '\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e02\u0e49\u0e32\u0e2a\u0e39\u0e48\u0e23\u0e30\u0e1a\u0e1a\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e25\u0e1a\u0e04\u0e27\u0e32\u0e21\u0e04\u0e34\u0e14\u0e40\u0e2b\u0e47\u0e19', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
      return;
    }

    const reviewId = review.review_id || review.id;
    modal.confirm({
      zIndex: REVIEW_MODAL_Z_INDEX + 10,
      title: '\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e01\u0e32\u0e23\u0e25\u0e1a',
      content: '\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e25\u0e1a\u0e04\u0e27\u0e32\u0e21\u0e04\u0e34\u0e14\u0e40\u0e2b\u0e47\u0e19\u0e19\u0e35\u0e49\u0e43\u0e0a\u0e48\u0e2b\u0e23\u0e37\u0e2d\u0e44\u0e21\u0e48?',
      okText: '\u0e25\u0e1a',
      okType: 'danger',
      cancelText: '\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01',
      onOk: async () => {
        try {
          await deleteReviewComment(reviewId, commentId);
          notification.success({ message: '\u0e25\u0e1a\u0e04\u0e27\u0e32\u0e21\u0e04\u0e34\u0e14\u0e40\u0e2b\u0e47\u0e19\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
          await loadComments();
        } catch (error: any) {
          notification.error({ message: error?.response?.data?.message || '\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14\u0e43\u0e19\u0e01\u0e32\u0e23\u0e25\u0e1a\u0e04\u0e27\u0e32\u0e21\u0e04\u0e34\u0e14\u0e40\u0e2b\u0e47\u0e19', placement: 'topRight', style: { zIndex: REVIEW_NOTIFICATION_Z_INDEX } });
        }
      },
    });
  };

  if (!review) return null;

  const isOwner = user?.user_id && user.user_id === review.user?.user_id;
  const userAvatar = normalizeProfileAssetSrc(review.user?.img || '/images/default-avatar.png');
  const userFrame = extractFrameSrc(review.user);
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
      closeIcon={<span className="text-gray-400 hover:text-red-500 transition-colors">x</span>}
    >
      <div className="p-2 sm:p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProfileAvatarLink
              userId={review.user?.user_id}
              name={userName}
              avatarSrc={userAvatar}
              frameSrc={userFrame}
              sizeClassName="h-10 w-10"
              frameScaleClassName="-inset-1"
            />
            <div>
              <Link href={`/profile/${review.user?.user_id}`} className="text-base font-bold text-gray-800 hover:text-[#E33527]">
                {userName}
              </Link>
              <div className="text-sm text-gray-400">{timeAgo}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => onEdit?.(review)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-[#E33527]"
                >
                  <Edit2 size={14} />
                  <span>แก้ไข</span>
                </button>
                <button
                  onClick={() => onDelete?.(review)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                  <span>ลบ</span>
                </button>
              </>
            ) : currentUserId ? (
              <button
                onClick={() => handleReport('review', reviewId)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-orange-50 hover:text-orange-500"
              >
                <Flag size={14} />
                <span>รายงาน</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Rate disabled defaultValue={review.rating} allowHalf className="text-base text-yellow-500" />
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-500">
            อ่านถึงตอนที่ {review.ep_read || 0}
          </span>
        </div>

        <div className="mb-4 min-h-[100px] whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 p-4 text-base leading-relaxed text-gray-700">
          {parse((review.content || '').replace(/\[\/?\s*SPOILER\s*\]/gi, ''))}
        </div>

        <div className="mb-4 flex items-center gap-6 border-y border-gray-100 py-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount > 0 ? likeCount : ''} ถูกใจ</span>
          </button>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
            <MessageCircle size={18} />
            <span>{comments.length > 0 ? comments.length : ''} ความคิดเห็น</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-blue-500"
          >
            <Share2 size={18} />
            <span>{shareCount > 0 ? shareCount : ''} แชร์</span>
          </button>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 text-sm font-bold text-gray-500">รีวิวจากเรื่อง</h3>
          <Link href={`/book/${review.book?.book_id}`} className="group flex gap-4 rounded-xl border border-gray-100 bg-white p-3 transition-all hover:border-red-200 hover:bg-red-50/30">
            <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md shadow-sm transition-shadow group-hover:shadow-md">
              <Image src={bookCover} alt={bookTitle} fill className="object-cover" unoptimized />
            </div>
            <div className="flex flex-1 flex-col justify-center overflow-hidden">
              <h4 className="mb-1 line-clamp-2 text-base font-bold text-gray-900 transition-colors group-hover:text-red-600">{bookTitle}</h4>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-[#E33527]">{bookTag}</span>
              </div>
              <p className="mt-auto truncate text-sm text-gray-500">เขียนโดย: {writerName}</p>
            </div>
          </Link>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
            <MessageCircle size={16} />
            ความคิดเห็น {comments.length > 0 && `(${comments.length})`}
          </h3>

          {currentUserId && (
            <div className="mb-4 flex gap-2">
              <ProfileAvatarLink
                userId={user?.user_id}
                name={user?.fullname || 'You'}
                avatarSrc={user?.img || '/images/default-avatar.png'}
                frameSrc={extractFrameSrc(user)}
                sizeClassName="h-8 w-8"
                frameScaleClassName="-inset-1"
              />
              <div className="flex flex-1 gap-2">
                <Input
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="เขียนความคิดเห็น..."
                  className="rounded-full border-gray-200 hover:border-red-300 focus:border-red-400"
                  onPressEnter={handleSubmitComment}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !commentText.trim()}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E33527] text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}

          {isLoadingComments ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="flex animate-pulse gap-2">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 rounded bg-gray-200" />
                    <div className="h-3 w-3/4 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="max-h-[250px] space-y-3 overflow-y-auto pr-1">
              {comments.map((comment: any, index: number) => {
                const commentId = comment.comment_id || comment.id;
                const hasCommentId = commentId !== undefined && commentId !== null;
                const commentUserId = comment.user?.user_id || comment.user_id;
                const activeUserId = currentUserId ?? user?.user_id;
                const isCommentOwner = !!activeUserId && String(activeUserId) === String(commentUserId);
                const commentUserName = comment.user?.fullname || 'ผู้ใช้งาน';
                const showCommentAction = !!activeUserId && hasCommentId;

                return (
                  <div key={commentId || `comment-${index}`} className="group flex gap-2">
                    <ProfileAvatarLink
                      userId={commentUserId}
                      name={commentUserName}
                      avatarSrc={comment.user?.img || '/images/default-avatar.png'}
                      frameSrc={extractFrameSrc(comment.user)}
                      sizeClassName="h-8 w-8"
                      frameScaleClassName="-inset-1"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="relative rounded-xl bg-gray-50 px-3 py-2">
                        {showCommentAction && (
                          <div className="absolute right-2 top-2">
                            <Popover
                              trigger="click"
                              placement="bottomLeft"
                              open={openCommentActionId === commentId}
                              onOpenChange={(open) => setOpenCommentActionId(open ? commentId : null)}
                              content={
                                <div className="flex min-w-[120px] flex-col py-1">
                                  {isCommentOwner ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenCommentActionId(null);
                                        handleDeleteComment(commentId);
                                      }}
                                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                                    >
                                      <Trash2 size={14} />
                                      <span>ลบ</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenCommentActionId(null);
                                        handleReport('comment', commentId);
                                      }}
                                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-orange-500 transition-colors hover:bg-orange-50"
                                    >
                                      <Flag size={14} />
                                      <span>รายงาน</span>
                                    </button>
                                  )}
                                </div>
                              }
                            >
                              <button
                                type="button"
                                onClick={(event) => event.stopPropagation()}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-white hover:text-gray-700"
                                aria-label="จัดการความคิดเห็น"
                              >
                                <Ellipsis size={15} />
                              </button>
                            </Popover>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${commentUserId}`} className="text-sm font-semibold text-gray-800 hover:text-[#E33527]">
                            {commentUserName}
                          </Link>
                          <span className="text-xs text-gray-400">{dayjs(comment.created_at).fromNow()}</span>
                        </div>
                        <p className={`break-words pr-8 text-sm text-gray-700 ${showCommentAction ? 'mt-2.5' : 'mt-0.5'}`}>{comment.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-400">ยังไม่มีความคิดเห็น</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
