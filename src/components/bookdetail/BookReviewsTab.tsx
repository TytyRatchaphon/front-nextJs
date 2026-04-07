"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBookReviewsNew, deleteUserReview } from '@/services/api/commentApi';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import FrameOverlayImage from '@/components/ui/FrameOverlayImage';
import Link from 'next/link';
import { Rate, Select, App } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import ReviewModal from '@/components/modal/ReviewModal';
import WriteReviewModal from '@/components/modal/WriteReviewModal';
import EditReviewModal from '@/components/modal/EditReviewModal';
import SpoilerCardWrapper from '@/components/ui/SpoilerCardWrapper';
import { useAuthStore } from '@/stores/authStore';
import { Dropdown } from 'antd';
import { MoreVertical, Edit2, Trash2, Heart, Share2, MessageCircle } from 'lucide-react';
import { toSafeReviewPreviewHtml } from '@/utils/reviewText';

dayjs.extend(relativeTime);
dayjs.locale('th');

const normalizeReviewImageSrc = (src: string | null | undefined, fallback: string) => {
  if (!src || src === 'null' || src === 'undefined') return fallback;
  if (src.startsWith('http') || src.startsWith('data:')) return src.replace('http:', 'https:');
  if (src.startsWith('/')) return src;
  if (src.startsWith('img/')) return `https://img.enjoybook.co/${src}`;
  return `https://img.enjoybook.co/${src}`;
};

interface BookReviewsTabProps {
  bookId: string | number;
  book?: any;
}

export default function BookReviewsTab({ bookId, book }: BookReviewsTabProps) {
  const [sort, setSort] = useState<string>('liked');
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { user } = useAuthStore();
  const currentUserId = user?.user_id;
  const { notification, modal } = App.useApp();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookReviewsNew', bookId, sort],
    queryFn: () => fetchBookReviewsNew(bookId, sort),
    enabled: !!bookId,
  });

  const reviews = data?.reviews || [];

  const getReviewWithBook = (review: any) => {
    if (review.book) return review;
    return {
      ...review,
      book: {
        book_id: book?.id || book?.book_id || bookId,
        img: book?.cover || book?.img || book?.img_full,
        img_gif: book?.img_gif || book?.img_gif_full,
        name: book?.title || book?.name,
        tag: book?.tags || (book?.tag ? [book.tag] : ['นิยาย']),
        writer_name: book?.writer?.writer_name || book?.writer_name,
      }
    };
  };

  const handleReviewClick = (review: any) => {
    setSelectedReview(getReviewWithBook(review));
    setIsModalOpen(true);
  };

  const handleEditClick = (e: any, review: any) => {
    e.stopPropagation();
    setSelectedReview(getReviewWithBook(review));
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (e: any, review: any) => {
    e.stopPropagation();
    modal.confirm({
      title: 'ต้องการลบรีวิวนี้ใช่หรือไม่?',
      content: 'เมื่อลบแล้วจะไม่สามารถกู้คืนได้',
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          const reviewId = review.review_id || review.id;
          const res = await deleteUserReview(reviewId);
          notification.success({
            message: res?.message || 'ลบรีวิวสำเร็จ',
            placement: 'topRight'
          });
          setSelectedReview(null);
          setIsModalOpen(false);
          refetch();
        } catch (error: any) {
          console.error('Failed to delete review:', error);
          notification.error({
            message: error?.response?.data?.message || 'เกิดข้อผิดพลาดในการลบรีวิว',
            placement: 'topRight'
          });
        }
      }
    });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 p-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="w-24 h-4 bg-gray-200 rounded mb-1" />
                <div className="w-16 h-3 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="w-28 h-4 bg-gray-200 rounded mb-2" />
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-gray-200 rounded" />
              <div className="w-3/4 h-3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header: Sort + Write Button */}
        <div className="flex items-center justify-between px-2">
          <Select
            value={sort}
            onChange={(val) => setSort(val)}
            size="small"
            className="font-primary"
            style={{ width: 130 }}
            options={[
              { value: 'liked', label: '🔥 ยอดนิยม' },
              { value: 'newest', label: '🕐 ล่าสุด' },
            ]}
          />
          {currentUserId && (
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="bg-[#E33527] hover:bg-red-700 !text-white px-4 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
              เขียนรีวิว
            </button>
          )}
        </div>

        {/* Empty State */}
        {reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-600 mb-1">ยังไม่มีรีวิว</h3>
            <p className="text-sm text-gray-400">เป็นคนแรกที่รีวิวเรื่องนี้!</p>
          </div>
        )}

        {/* Review Cards */}
        {reviews.length > 0 && (
          <div className="space-y-3 px-2">
            {reviews.map((review: any) => {
              const userAvatar = normalizeReviewImageSrc(review.user?.img, '/images/default-avatar.png');
              const userName = review.user?.fullname || 'Unknown';
              const userFrame = review.user?.frame;
              const timeAgo = dayjs(review.created_at).fromNow();

              const cleanContentHtml = toSafeReviewPreviewHtml(review.content);
              const isSpoilerCard = !!review.is_spoiler;

              const cardContent = (
                <>
                  {/* Header: Avatar + Name + Time */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/profile/${review.user?.user_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="relative flex-shrink-0"
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden">
                          <ImageWithFallback src={userAvatar} alt={userName} fill className="object-cover" />
                        </div>
                        {userFrame && (
                          <div className="absolute -inset-1">
                            <FrameOverlayImage src={userFrame.img} alt={userFrame.name} className="object-contain" />
                          </div>
                        )}
                      </Link>
                      <div>
                        <Link
                          href={`/profile/${review.user?.user_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-semibold text-gray-800 hover:text-[#E33527] transition-colors line-clamp-1"
                        >
                          {userName}
                        </Link>
                        <span className="text-xs text-gray-400 block">{timeAgo}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {currentUserId === review.user?.user_id && (
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'edit',
                                label: (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Edit2 size={16} />
                                    <span>แก้ไข</span>
                                  </div>
                                ),
                                onClick: (e) => handleEditClick(e.domEvent, review)
                              },
                              {
                                key: 'delete',
                                danger: true,
                                label: (
                                  <div className="flex items-center gap-2">
                                    <Trash2 size={16} />
                                    <span>ลบ</span>
                                  </div>
                                ),
                                onClick: (e) => handleDeleteClick(e.domEvent, review)
                              }
                            ]
                          }}
                          trigger={['click']}
                          placement="bottomRight"
                        >
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </Dropdown>
                      )}
                    </div>
                  </div>

                  {/* Rating + Episode */}
                  <div className="flex items-center gap-2 mb-2">
                    <Rate disabled defaultValue={review.rating} allowHalf className="text-sm text-yellow-500" />
                    {review.ep_read > 0 && (
                      <span className="text-xs text-gray-500">อ่านแล้ว {review.ep_read} ตอน</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="text-sm text-gray-700 line-clamp-3 mb-3 break-words leading-relaxed [&_a]:pointer-events-none">
                    {cleanContentHtml ? (
                      <span dangerouslySetInnerHTML={{ __html: cleanContentHtml }} />
                    ) : (
                      'รีวิวนี้ยังไม่มีข้อความเพิ่มเติม'
                    )}
                  </div>

                  {/* Interaction Stats */}
                  <div className="flex items-center gap-5 text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Heart size={14} fill={review.is_liked ? '#E33527' : 'none'} className={review.is_liked ? 'text-[#E33527]' : ''} />
                      {(review.like_count || 0) > 0 && <span>{review.like_count}</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={14} />
                      {(review.comment_count || 0) > 0 && <span>{review.comment_count}</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 size={14} />
                      {(review.share_count || 0) > 0 && <span>{review.share_count}</span>}
                    </span>
                  </div>
                </>
              );

              if (isSpoilerCard) {
                return (
                  <SpoilerCardWrapper
                    key={review.review_id}
                    isSpoiler={true}
                    onClick={() => handleReviewClick(review)}
                  >
                    {cardContent}
                  </SpoilerCardWrapper>
                );
              }

              return (
                <div
                  key={review.review_id}
                  onClick={() => handleReviewClick(review)}
                  className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer hover:border-red-200"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          refetch();
        }}
        review={selectedReview}
        currentUserId={currentUserId}
        onEdit={(review: any) => {
          setIsModalOpen(false);
          setSelectedReview(review);
          setIsEditModalOpen(true);
        }}
        onDelete={(review: any) => {
          setIsModalOpen(false);
          handleDeleteClick({ stopPropagation: () => {} }, review);
        }}
      />

      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        initialBook={book ? {
          book_id: book.id || book.book_id,
          img: book.cover || book.img || book.img_full,
          img_gif: book.img_gif || book.img_gif_full,
          name: book.title || book.name,
        } : null}
        lockBook={true}
        onSuccess={() => refetch()}
      />

      <EditReviewModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        review={selectedReview}
        onSuccess={() => refetch()}
      />
    </>
  );
}
