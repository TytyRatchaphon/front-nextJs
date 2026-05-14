"use client";
import * as React from "react";
// import Image from "next/image";
import Link from "next/link";
import parse from "html-react-parser";
import CardBookImageOnly from "../novelCard/CardBookImageOnly";

interface ImgLeftBgBookGridProps {
  group: any;
  link?: string;
  onBookClick?: (book: any) => void;
}

export default function ImgLeftBgBookGrid({ group, link, onBookClick }: ImgLeftBgBookGridProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const books = group.list || [];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full relative mb-8">
      {/* Full-bleed Background */}
      {group.img_bg && (
        <div 
          className="absolute top-0 bottom-0 left-[calc(-50vw+50%)] w-[100vw] pointer-events-none"
          style={{ 
            backgroundImage: `url(${group.img_bg})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}

      {/* Content Container */}
      <div className="w-full relative py-8 sm:py-10 z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10 w-full gap-2 sm:gap-4">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 drop-shadow-sm line-clamp-2">
          {group.name_web ? parse(group.name_web) : parse(group.name || '')}
        </h2>

        {link && (
          <Link 
            href={link}
            className="text-gray-700 hover:text-red-600 text-sm sm:text-base font-medium flex items-center gap-1 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full transition-colors whitespace-nowrap flex-shrink-0"
          >
            ดูทั้งหมด
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-row gap-3 sm:gap-4 lg:gap-6 relative z-10 items-stretch">
        
        {/* Left Banner */}
        {group.img_left && (
          <div className="w-[180px] sm:w-[200px] md:w-[230px] lg:w-[260px] xl:w-[280px] flex-shrink-0 relative">
            {/* Absolute height to exactly match the 2 rows of the grid (excluding pb-4) */}
            <div className="absolute top-0 left-0 w-full bottom-4 flex items-center justify-center p-1">
              <div className="relative max-w-full max-h-full rounded-[16px] sm:rounded-[24px] overflow-hidden flex">
                <img 
                  src={group.img_left} 
                  alt={group.name || 'promotion banner'} 
                  className="max-w-full max-h-full w-auto h-auto"
                />
              </div>
            </div>
          </div>
        )}

        {/* Right Grid (2 rows horizontal scroll) */}
        <div className="flex-1 relative group/slider overflow-hidden">
          
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-2 sm:p-3 rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:bg-white"
            aria-label="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-2 sm:p-3 rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:bg-white"
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <div 
            ref={scrollRef}
            className="grid grid-rows-2 grid-flow-col auto-cols-[96px] justify-start gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar sm:auto-cols-[110px] md:auto-cols-[120px] lg:auto-cols-[130px] xl:auto-cols-[140px]"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none' 
            }}
          >
            {books.length > 0 ? (
              books.map((book: any, index: number) => (
                <div key={book.book_id || index} className="snap-start w-[96px] sm:w-[110px] md:w-[120px] lg:w-[130px] xl:w-[140px]">
                  <CardBookImageOnly book={book} onBookClick={onBookClick} noShadow />
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 py-10 row-span-2 col-span-full">
                ไม่มีหนังสือ
              </div>
            )}
          </div>
          
        </div>
        </div>
      </div>
    </div>
  );
}
