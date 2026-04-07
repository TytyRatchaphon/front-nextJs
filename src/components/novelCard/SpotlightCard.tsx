
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookTrans } from '@/types/api';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';

interface SpotlightCardProps {
  book: BookTrans;
}


export default function SpotlightCard({ book }: SpotlightCardProps) {
  // Safe helper to format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <Link href={`/book/${book.book_id}`} prefetch={false} className="w-full">
      <div className="flex flex-col w-full h-auto group bg-transparent">
        <div className="relative shadow-md rounded-lg overflow-hidden bg-white aspect-[168/237]">
          <Image 
            src={resolveBookCoverImageSrc(book, '/images/ejb.png', 'book')}
            alt={book.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
           {/* Fallback for status/ribbon if needed */}
           {(book.status === 'end') && (
             <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full z-10">
               จบ
             </div>
           )}
        </div>
        <div className="mt-2">
          <p className="text-black text-lg font-medium truncate group-hover:text-red-600 transition-colors duration-300">
            {book.name}
          </p>
          <div className="flex items-center justify-between text-xs mt-1 text-gray-500 whitespace-nowrap min-w-0">
            {/* View Count (Heart Icon in code comments, but View Icon in logic?) */}
            {/* Note: In the code logic, the first item uses shelve_count (Heart/Fav) but has a visible Eye icon? 
                Wait, looking at code:
                First item: shelve_count, Icon: Path d="M12.62...". This path looks like a Heart or Shield? 
                Actually, let's just stick to the structure but improve layout.
            */}
            <div className="hidden lg:flex items-center gap-1 truncate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500 flex-shrink-0">
                <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="truncate">{formatNumber(book.shelve_count || 0)}</span>
            </div>
             {/* Second item: view count (Eye or Heart?) uses book.view */}
             <div className="flex items-center gap-1 truncate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500 flex-shrink-0">
                <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="truncate">{formatNumber(book.view || 0)}</span>
            </div>
            {/* Chapter Count */}
            <div className="flex items-center gap-1 truncate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500 flex-shrink-0">
                <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="truncate">{formatNumber(book.chapter || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
