
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { fetchBookRecommendation } from '@/services/apiServices';
import CardBook from '@/components/novelCard/CardBook';
import 'swiper/css';
import 'swiper/css/navigation';

interface RecommendedBooksProps {
  bookId: string | number;
}

export default function RecommendedBooks({ bookId }: RecommendedBooksProps) {
  const { data: books, isLoading } = useQuery({
    queryKey: ['recommendedBooks', bookId],
    queryFn: () => fetchBookRecommendation(bookId),
    enabled: !!bookId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (!isLoading && (!books || books.length === 0)) {
    return null;
  }

  return (
    <div className="w-full mt-8 mb-8">
       {/* Separator and Header */}
      <div className="flex flex-col mb-4">
        <h2 className="font-bold text-xl md:text-2xl text-black mb-2">หนังสือที่คุณน่าจะสนใจ</h2>
        <div className="w-full h-[1px] bg-gray-200"></div>
      </div>

      {isLoading ? (
        // Skeleton Loader
        <div className="w-full overflow-hidden">
          <div className="flex gap-4">
            {[...Array(5)].map((_, i) => (
               <div key={i} className="flex-shrink-0 w-[160px] md:w-[180px] flex flex-col gap-2 animate-pulse">
                  <div className="w-full h-[237px] bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
               </div>
            ))}
          </div>
        </div>
      ) : (
        // Content
        <div className="w-full relative group/swiper-container">
          <Swiper
            modules={[Navigation]}
            spaceBetween={16}
            slidesPerView="auto"
            navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
            }}
            breakpoints={{
              320: { slidesPerView: 2.2, spaceBetween: 12 },
              640: { slidesPerView: 3.2, spaceBetween: 16 },
              768: { slidesPerView: 4.2, spaceBetween: 16 },
              1024: { slidesPerView: 5, spaceBetween: 24 }, // Fixed 5 items
            }}
            className="w-full !pb-4"
          >
            {books?.map((book: any) => (
              <SwiperSlide key={book.book_id} className="!w-[160px] md:!w-[180px]">
                <CardBook book={book} />
              </SwiperSlide>
            ))}
          </Swiper>

            {/* Custom Navigation Buttons (Visible on hover for desktop) */}
            <div className="swiper-button-prev-custom absolute top-[40%] left-0 z-10 w-10 h-10 bg-white/80 rounded-full shadow-md items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover/swiper-container:opacity-100 hover:bg-white disabled:opacity-0 -ml-4 hidden lg:flex">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </div>
            <div className="swiper-button-next-custom absolute top-[40%] right-0 z-10 w-10 h-10 bg-white/80 rounded-full shadow-md items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover/swiper-container:opacity-100 hover:bg-white disabled:opacity-0 -mr-4 hidden lg:flex">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
        </div>
      )}
    </div>
  );
}
