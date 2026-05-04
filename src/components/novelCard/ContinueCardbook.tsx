import Link from 'next/link'
import React from 'react'
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';
import { BookPurchaseRewardBadge } from './BookPurchaseRewardBadge';
import { BookCoverImage } from './BookCoverImage';
import { computeEnded } from './bookCardUtils';

interface Book {
  book_id?: number;
  img?: string;
  name?: string;
  view?: number;
  end?: string;
  chapter?: number;
  shelveCount?: number;
  [key: string]: any;
}

interface CardBookProps {
  book: Partial<Book>;
}

function CardBook({ book }: CardBookProps) {
  const imageUrl = resolveBookCoverImageSrc(book, '/images/ejb.png');
  const ended = computeEnded(book);
  
  // Prefer the short numeric `book_id` when available; fall back to the string `bookID`.
  const bookParam = book.book_id ? String(book.book_id) : (book.bookID && String(book.bookID).trim() !== "" ? String(book.bookID) : "");

  // Episode id for read route: prefer numeric `ep_id`, then `epID`/`epId`.
  const epParam = (book.last_read_ep_id ?? book.ep_id ?? book.epID ?? book.epId ?? book.epid ?? book.epIdStr ?? '')
  const epParamStr = epParam !== undefined && epParam !== null ? String(epParam) : ''

  // Episode display name from API (many responses use `epName`, `ep_name`, or `last_read_ep_name`)
  const epName = book.epName ?? book.ep_name ?? book.epname ?? book.last_read_ep_name ?? ''

  return (
  <Link href={`/read/${encodeURIComponent(bookParam)}/${encodeURIComponent(epParamStr)}`} className="block w-[168px] h-[355px] flex-shrink-0">
      <div className="flex flex-col w-full h-full rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
        {/* Image Container */}
        <BookCoverImage
          src={imageUrl}
          alt={book.name ?? ''}
          width={168}
          height={237}
          imgClassName="w-full h-[237px] object-cover"
        >
          {/* End Status Badge */}
          {ended && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
              จบแล้ว
            </div>
          )}
          <BookPurchaseRewardBadge book={book} />
        </BookCoverImage>

        {/* Content Container */}
        <div className="px-3 pt-3 pb-2 flex flex-col gap-1 flex-1">
          <h3 className="text-black text-md font-primary font-medium group-hover:text-red-600 transition-colors duration-300 line-clamp-1 min-h-[2.5rem]">
            {book.name}
          </h3>

          <p className="text-gray-400 text-xs mb-2 truncate">{book.author}</p>

          <div className="mt-auto text-sm text-gray-600 truncate w-full">
            {epName ? <span className="text-gray-700">{epName}</span> : <span className="text-gray-400">ไม่มีชื่อบท</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CardBook
