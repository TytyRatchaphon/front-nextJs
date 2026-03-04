"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPinnedReviews } from '@/services/api/commentApi';
import Image from 'next/image';
import Link from 'next/link';
import { Rate } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import ReviewModal from '@/components/modal/ReviewModal';
import WriteReviewModal from '@/components/modal/WriteReviewModal';
import SpoilerCardWrapper from '@/components/ui/SpoilerCardWrapper';

dayjs.extend(relativeTime);
dayjs.locale('th');

export default function AllReview() {
  const { data: pinnedReviewsData, isLoading, error } = useQuery({
    queryKey: ['allPinnedReviews'],
    queryFn: fetchPinnedReviews,
  });

  const [selectedReview, setSelectedReview] = React.useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = React.useState(false);

  const handleReviewClick = (review: any) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const reviews = pinnedReviewsData?.reviews || [];

  return (
    <div className="bg-[#F4F6F9] min-h-screen py-8 font-primary font-medium">
      <div className="max-w-[1440px] w-full mx-auto px-4 lg:px-[156px]">
        {/* Breadcrumb / Header */}
        <div className="flex items-center gap-2 mb-6">
           <Link href="/" className="text-gray-500 hover:text-[#E33527] transition-colors">หน้าหลัก</Link>
           <span className="text-gray-400">/</span>
           <span className="text-[#E33527] font-semibold">ปักหมุดรีวิวจากนักอ่าน</span>
        </div>

        <div className="mb-6 flex justify-between items-center">
           <h1 className="text-2xl font-bold text-black border-l-4 border-[#E33527] pl-3 m-0">ปักหมุดรีวิวจากนักอ่านทั้งหมด</h1>
           <button 
             onClick={() => setIsWriteModalOpen(true)}
             className="bg-[#E33527] hover:bg-red-700 !text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
               <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
             </svg>
             เขียนรีวิว
           </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm h-[240px] border border-gray-100 animate-pulse">
                <div className="p-4 h-full flex flex-col justify-between">
                  {/* ... loading skeleton ... */}
                <div className="flex justify-between items-center mb-2">
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                        <div className="w-20 h-4 bg-gray-200 rounded"></div>
                     </div>
                  </div>
                  <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="flex-1 space-y-2 mt-2">
                     <div className="w-full h-3 bg-gray-200 rounded"></div>
                     <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-full h-14 bg-gray-100 rounded mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
             <h3 className="text-red-500 font-bold mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
             <p className="text-gray-500">กรุณาลองใหม่อีกครั้งในภายหลัง</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && reviews.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.38-.432 1.62-.812 2.68-1.42 3.23a.75.75 0 00.41 1.282c1.71.243 3.972-.169 6.041-1.127A8.96 8.96 0 0012 20.25z" />
               </svg>
             </div>
             <h3 className="text-xl font-bold text-gray-700 mb-2">ยังไม่มีรีวิวที่ปักหมุด</h3>
             <p className="text-gray-500">ติดตามรีวิวที่น่าสนใจได้ที่นี่ในเร็วๆ นี้</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reviews.map((review: any) => {
              const userAvatar = review.user?.img || '/images/default-avatar.png';
              const userName = review.user?.fullname || 'Unknown';
              const bookCover = review.book?.img || review.book?.img_full || '/images/default-cover.png';
              const bookTitle = review.book?.name || 'Unknown Book';
              const bookTag = review.book?.tag?.[0] || 'นิยาย';
              const writerName = review.book?.writer_name || 'Unknown Writer';
              const timeAgo = dayjs(review.created_at).fromNow();
              
              let cleanContent = review.content || '';
              if (cleanContent.startsWith('<p>')) {
                 cleanContent = cleanContent.replace(/<[^>]+>/g, '');
              }
              const isSpoilerCard = cleanContent.includes('[SPOILER]');
              cleanContent = cleanContent.replace(/\[\/?SPOILER\]/gi, '');

              const cardContent = (
                <>
                  {/* Header: User & Time */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <Image src={userAvatar} alt={userName} fill className="object-cover" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 line-clamp-1">{userName}</span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo}</span>
                  </div>

                  {/* Rating & Episode */}
                  <div className="flex items-center gap-2 mb-2">
                    <Rate disabled defaultValue={review.rating} allowHalf className="text-sm text-yellow-500" />
                    <span className="text-xs text-gray-500">อ่านถึง #{review.ep_read || 0}</span>
                  </div>

                  {/* Content */}
                  <div className="text-sm text-gray-700 line-clamp-3 mb-4 flex-1 break-words">
                    {cleanContent}
                  </div>
                  {/* Book Info footer */}
                  <Link 
                    href={`/book/${review.book?.book_id}`} 
                    onClick={(e) => e.stopPropagation()}
                    className="flex gap-3 bg-gray-50/50 rounded-lg p-2 border border-gray-100 hover:bg-[#FFE5E5]/30 transition-colors mt-auto"
                  >
                    <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0">
                      <Image src={bookCover} alt={bookTitle} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex flex-col justify-center overflow-hidden">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{bookTitle}</h4>
                      <span className="text-xs text-[#E33527] font-medium truncate mb-0.5">{bookTag}</span>
                      <span className="text-xs text-gray-500 truncate">{writerName}</span>
                    </div>
                  </Link>
                </>
              );

              return (
                <SpoilerCardWrapper 
                  key={review.review_id}
                  isSpoiler={isSpoilerCard}
                  onClick={() => handleReviewClick(review)}
                >
                  {cardContent}
                </SpoilerCardWrapper>
              )
            })}
          </div>
        )}
      </div>
      <ReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        review={selectedReview} 
      />

      <WriteReviewModal 
        isOpen={isWriteModalOpen} 
        onClose={() => setIsWriteModalOpen(false)} 
      />
    </div>
  );
}  