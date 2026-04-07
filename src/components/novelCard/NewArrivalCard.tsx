
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookTrans } from '@/types/api';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';

interface NewArrivalCardProps {
  book: BookTrans;
}


export default function NewArrivalCard({ book }: NewArrivalCardProps) {
  // Safe helper to format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <Link href={`/book/${book.book_id}`} prefetch={false} className="block w-full hover:bg-gray-50 rounded-lg transition-colors p-2 group">
      <div className="flex gap-4 items-start">
        {/* Book Cover */}
        <div className="w-[91px] h-[128px] rounded overflow-hidden flex-shrink-0 relative shadow-sm">
          <Image
            src="/images/new.png"
            alt="NEW"
            width={35}
            height={35}
            className="absolute top-0 right-0 z-10 w-9 h-auto object-contain"
          />
          <Image
            src={resolveBookCoverImageSrc(book, '/images/ejb.png', 'book')}
            alt={book.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-black text-lg mb-1 truncate group-hover:text-red-600 transition-colors duration-300">{book.name}</h3>
          <p className="text-sm text-gray-600 mb-2 truncate">{(book as any).writer_name || book['writer.writer_name'] || 'Unknown Writer'}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            {/* View Count */}
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{formatNumber(book.shelve_count || 0)}</span>
            </div>

            {/* Heart Count */}
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{formatNumber(book.view || 0)}</span>
            </div>

            {/* Chapter Count */}
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>{(book.chapter || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
