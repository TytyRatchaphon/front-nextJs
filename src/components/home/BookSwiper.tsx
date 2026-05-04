"use client";
import * as React from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Scrollbar, A11y, EffectFade, FreeMode } from 'swiper/modules';
import CardBook from '../novelCard/CardBook';
import Image from 'next/image';
import parse from 'html-react-parser';

import Link from 'next/link';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import 'swiper/css/effect-fade';
import 'swiper/css/free-mode';

interface BookSwiperProps {
  books: any[];
  title?: string;
  icon?: string;
  link?: string;
  onBookClick?: (book: any) => void;
}

export default function BookSwiper({ books, title, icon, link, onBookClick }: BookSwiperProps) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);

  const breakpoints = {
    320: {
      slidesPerView: 'auto' as const,
      spaceBetween: 6,
    },
    640: {
      slidesPerView: 'auto' as const,
      spaceBetween: 8,
    },
    768: {
      slidesPerView: 'auto' as const,
      spaceBetween: 10,
    },
    1024: {
      slidesPerView: 'auto' as const,
      spaceBetween: 10,
    },
    1280: {
      slidesPerView: 'auto' as const,
      spaceBetween: 12,
    },
  };

  return (
    <div className="w-full relative group/swiper py-1">
      <div className="flex items-center gap-3 mb-1 px-4 bg-white/50 backdrop-blur-sm rounded-lg p-1">
        {icon && (
          <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={icon}
              alt={title || 'icon'}
              fill
              className="object-cover"
            />
          </div>
        )}
        {title && (
          <div className={`flex items-center ${title.trim().startsWith('<p') ? 'translate-y-4' : 'translate-y-1'}`}>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold [&_*]:m-0 flex items-baseline gap-1 leading-none">
              {parse(title)}
            </h2>
          </div>
        )}

        {link && (
          <Link href={link} className="ml-auto text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1">
            ดูทั้งหมด
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </div>

      {/* Custom Navigation Buttons */}
      <button
        ref={prevRef}
        className="arrow-left absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-3 rounded-full shadow-lg opacity-0 group-hover/swiper:opacity-100 transition-all duration-300 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-gray-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        ref={nextRef}
        className="arrow-right absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-3 rounded-full shadow-lg opacity-0 group-hover/swiper:opacity-100 transition-all duration-300 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-gray-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      <Swiper
        centeredSlides={false}
        speed={500}
        breakpoints={breakpoints}
        modules={[Navigation, Pagination, Scrollbar, A11y, EffectFade, FreeMode]}
        // className="z-0 px-4 !pb-1"
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
        autoHeight={true}
        freeMode={true}
      >
        {books && books.length > 0 ? (
          books.map((book, index) => (
            <SwiperSlide
              key={`${book.book_id ?? book.id ?? 'book'}-${book.parent_book_id ?? 'root'}-${book.content_type ?? 'novel'}-${index}`}
              className="!w-auto"
            >
              <CardBook book={book} onBookClick={onBookClick} />
            </SwiperSlide>
          ))
        ) : (
          // Fallback or empty state
          <div className="text-center py-10 text-gray-400">ไม่มีหนังสือ</div>
        )}
      </Swiper>
    </div>
  );
}
