
import Image from 'next/image';
import Link from 'next/link'
import React from 'react'
import { postBookClick } from '@/services/apiServices';
import FlashSaleSVG from './FlashSaleSvg';
import { UniversalBook } from '../../types/api';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';
import { normalizeBookForCard } from '@/utils/normalizeBookForCard';
import { useGifPreference } from '@/hooks/useGifPreference';
import { BookPurchaseRewardBadge } from './BookPurchaseRewardBadge';
import { BookCoverImage } from './BookCoverImage';
import { BookStatusBadges } from './BookStatusBadges';
import { BookStatsRow } from './BookStatsRow';
import { computeEnded } from './bookCardUtils';



interface CardBookProps {
  // allow partial shapes (API sometimes omits fields)
  book: UniversalBook;
  onBookClick?: (book: UniversalBook) => void;
}



function CardBook({ book: rawBook, onBookClick }: CardBookProps) {

  const book = React.useMemo(() => normalizeBookForCard(rawBook), [rawBook]);

  const showGif = useGifPreference(true);
  const imageUrl = resolveBookCoverImageSrc(book, '/images/ejb.png', 'tn', showGif);
  const hasBottomSaleOverlay = Boolean((book.discount && book.discount > 0) || (book.discount_ep_count && book.discount_ep_count > 0));

  const ended = computeEnded(book);

  // Prefer the short numeric `book_id` when available; fall back to the string `bookID`.
  const bookParam = book.book_id ? String(book.book_id) : (book.bookID && String(book.bookID).trim() !== "" ? String(book.bookID) : "");

  return (
    <div className="w-full max-w-[180px] h-[380px] flex-shrink-0 relative z-0">
      <Link
        href={`/book/${encodeURIComponent(bookParam)}`}
        prefetch={false}
        className="flex flex-col cursor-pointer p-1 text-start hover:text-red-600 bg-transparent relative overflow-visible h-full"
        style={{ width: '100%' }}
        onClick={() => {
          if (bookParam) postBookClick(bookParam);
          onBookClick?.(rawBook);
        }}
      >
        <div className="flex flex-col w-full h-full rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow group/card cursor-pointer relative overflow-visible">
          {/* Image Container */}
          <BookCoverImage
            src={imageUrl}
            alt={book.name ?? ''}
            width={168}
            height={237}
            imgClassName="w-full h-[237px] object-cover rounded-t-lg relative z-0"
          >
            {/* Flash Sale / Discount Overlay */}
            {(book.discount && book.discount > 0) ? (
                 <div className="absolute bottom-0 left-0 right-0 z-10 w-full">
                    <FlashSaleSVG className="w-full h-auto" endtime={book.time_end || new Date().setHours(23, 59, 59, 999)} />
                 </div>
            ) : book.discount_ep_count && book.discount_ep_count > 0 ? (
              <div className="absolute bottom-0 left-0 right-0 z-10 w-full">
                <Image
                  src="/images/sale-ep.png"
                  alt="sale-ep"
                  width={120}
                  height={30}
                  className="w-full h-[40px] object-contain align-bottom"
                />
                <div className="absolute bottom-[1px] left-0 right-0 text-center text-white text-[11px] font-bold drop-shadow-md">
                  ลดราคา <span className="text-[#FFD700] text-xs mx-0.5">{book.discount_ep_count}</span> ตอน
                </div>
              </div>
            ) : null}

            <BookPurchaseRewardBadge book={book} avoidBottomOverlay={hasBottomSaleOverlay} />

            {/* Rank Badge */}
            {book.rank && (
              <div className="absolute bottom-1 right-1 w-[20px] h-[20px] md:w-[30px] md:h-[30px] transform rotate-45 rounded-lg bg-[#E60000] shadow-md border-2 border-white flex items-center justify-center z-20">
                <div className="transform -rotate-45 text-white font-bold text-xs md:text-lg">{book.rank}</div>
              </div>
            )}
          </BookCoverImage>

          {/* Status Badges */}
          <BookStatusBadges
            isBestSeller={book.isBestSeller}
            isNew={book.isNew}
            discount={book.discount}
            ended={ended}
          />

          {/* Content Container */}
          <div className="px-3 pt-3 pb-2 flex flex-col gap-1 flex-1">
            <h3 className="text-black text-base font-primary font-medium group-hover/card:text-red-600 transition-colors duration-300 line-clamp-2 h-[3rem]">
              {book.name}
            </h3>

            <p className="text-gray-400 text-xs mb-2 truncate">{book.writer || book.writer_name || book.author}</p>

            <BookStatsRow
              shelveCount={book.shelveCount || book.shelfCount || book.shelve_count || book.shelf_count || 0}
              viewCount={book.view || 0}
              chapterCount={book.chapter || 0}
            />
          </div>
        </div>
      </Link >
    </div >
  );
}

export default CardBook
