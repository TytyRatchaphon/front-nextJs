"use client";

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import Link from 'next/link';
import Image from 'next/image';
import { Rate } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import ReviewModal from '@/components/modal/ReviewModal';
import SpoilerCardWrapper from '@/components/ui/SpoilerCardWrapper';

dayjs.extend(relativeTime);
dayjs.locale('th');

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

interface PinnedReviewsSwiperProps {
  reviews: any[];
}

export default function PinnedReviewsSwiper({ reviews }: PinnedReviewsSwiperProps) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);

  const [selectedReview, setSelectedReview] = React.useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleReviewClick = (review: any) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const breakpoints = {
    320: { slidesPerView: 'auto' as const, spaceBetween: 10 },
    640: { slidesPerView: 'auto' as const, spaceBetween: 15 },
    768: { slidesPerView: 'auto' as const, spaceBetween: 20 },
    1024: { slidesPerView: 'auto' as const, spaceBetween: 20 },
    1280: { slidesPerView: 'auto' as const, spaceBetween: 20 },
    1536: { slidesPerView: 'auto' as const, spaceBetween: 20 },
  };

  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="w-full bg-[#FFE5E5] py-8 mt-6">
      <div className="max-w-[1440px] w-full mx-auto px-4 lg:px-[156px] relative group/swiper">
      <div className="flex items-center gap-3 mb-4">
         <div>
            <h2 className="text-2xl font-bold text-[#E33527] m-0">ปักหมุดรีวิวจากนักอ่าน</h2>
         </div>
         <Link href="/all-review" className="ml-auto text-[#E33527] hover:text-red-700 text-sm font-medium flex items-center gap-1">
            ดูทั้งหมด
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
         </Link>
      </div>

      {/* Navigation Buttons */}
      <button 
        ref={prevRef}
        className="arrow-left absolute left-2 lg:left-[130px] top-1/2 -translate-y-1/2 z-20 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover/swiper:opacity-100 transition-all duration-300 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button 
        ref={nextRef}
        className="arrow-right absolute right-2 lg:right-[130px] top-1/2 -translate-y-1/2 z-20 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover/swiper:opacity-100 transition-all duration-300 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      <Swiper
        centeredSlides={false}
        speed={500}
        breakpoints={breakpoints}
        modules={[Navigation, FreeMode]}
        className="z-0 pb-4"
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          // @ts-expect-error -- Swiper navigation refs are assigned imperatively.
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-expect-error -- Swiper navigation refs are assigned imperatively.
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        freeMode={true}
      >
        {reviews.map((review) => {
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
          const isSpoilerCard = Boolean(review.is_spoiler);
          cleanContent = cleanContent.replace(/\[\/?\s*SPOILER\s*\]/gi, '');

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
                <span className="text-[#E33527] font-medium inline lg:hidden ml-1 whitespace-nowrap">... อ่านเพิ่มเติม</span>
              </div>

              {/* Book Info footer */}
              <Link 
                href={`/book/${review.book?.book_id}`} 
                onClick={(e) => e.stopPropagation()}
                className="flex gap-3 bg-gray-50/50 rounded-lg p-2 border border-gray-100 hover:bg-gray-50 transition-colors mt-auto"
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
            <SwiperSlide key={review.review_id} className="!w-[300px] md:!w-[350px]">
              <SpoilerCardWrapper 
                isSpoiler={isSpoilerCard}
                onClick={() => handleReviewClick(review)}
              >
                {cardContent}
              </SpoilerCardWrapper>
            </SwiperSlide>
          )
        })}
      </Swiper>
      </div>

      <ReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        review={selectedReview} 
      />
    </div>
  );
}
