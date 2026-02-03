"use client";

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import ContinueHomeCardBook from '../novelCard/ContinueHomeCardBook';
import Link from 'next/link';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

interface ContinueReadingSwiperProps {
  books: any[];
}

export default function ContinueReadingSwiper({ books }: ContinueReadingSwiperProps) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);

  const breakpoints = {
    320: {
      slidesPerView: 'auto' as const,
      spaceBetween: 10,
    },
    640: {
      slidesPerView: 'auto' as const,
      spaceBetween: 15,
    },
    768: {
      slidesPerView: 'auto' as const,
      spaceBetween: 20,
    },
    1024: {
      slidesPerView: 'auto' as const,
      spaceBetween: 20,
    },
    1280: {
      slidesPerView: 'auto' as const,
      spaceBetween: 20,
    },
     1536: {
      slidesPerView: 'auto' as const,
      spaceBetween: 20,
    },
  };

  if (!books || books.length === 0) return null;

  return (
    <div className="w-full relative group/swiper py-4">
      <div className="flex items-center gap-3 mb-1 px-4 bg-white/50 backdrop-blur-sm rounded-lg p-2">
         <div className="h-10 flex items-center">
            <h2 className="text-2xl font-bold [&_*]:m-0 leading-none">อ่านต่อ</h2>
         </div>
         <Link href="/shelve?tab=2" className="ml-auto text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1">
            ดูทั้งหมด
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
         </Link>
      </div>

      {/* Navigation Buttons */}
      <button 
        ref={prevRef}
        className="arrow-left absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover/swiper:opacity-100 transition-all duration-300 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button 
        ref={nextRef}
        className="arrow-right absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover/swiper:opacity-100 transition-all duration-300 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed"
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
        className="z-0 !pb-2"
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          // @ts-ignore
          swiper.params.navigation.prevEl = prevRef.current;
          // @ts-ignore
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        freeMode={true}
      >
        {books.map((book, index) => (
            <SwiperSlide key={book.book_id || index} className="!w-auto">
              <ContinueHomeCardBook book={book} />
            </SwiperSlide>
          ))
        }
      </Swiper>
    </div>
  );
}
