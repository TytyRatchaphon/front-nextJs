"use client";
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { postBookClick } from '@/services/apiServices';
import FlashSaleSVG from './FlashSaleSvg';
import { UniversalBook } from '../../types/api';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';
import { normalizeBookForCard } from '@/utils/normalizeBookForCard';
import { useGifPreference } from '@/hooks/useGifPreference';
import { BookPurchaseRewardBadge } from './BookPurchaseRewardBadge';
import { BookCoverImage } from './BookCoverImage';
import { BookStatusBadges } from './BookStatusBadges';
import { computeEnded } from './bookCardUtils';

interface CardBookImageOnlyProps {
  book: UniversalBook;
  onBookClick?: (book: UniversalBook) => void;
}

function CardBookImageOnly({ book: rawBook, onBookClick }: CardBookImageOnlyProps) {
  const book = React.useMemo(() => normalizeBookForCard(rawBook), [rawBook]);
  const showGif = useGifPreference(true);
  const imageUrl = resolveBookCoverImageSrc(book, '/images/ejb.png', 'tn', showGif);
  const hasBottomSaleOverlay = Boolean((book.discount && book.discount > 0) || (book.discount_ep_count && book.discount_ep_count > 0));
  const ended = computeEnded(book);
  const bookParam = book.book_id ? String(book.book_id) : (book.bookID && String(book.bookID).trim() !== "" ? String(book.bookID) : "");

  return (
    <div className="w-full max-w-[180px] flex-shrink-0 relative z-0">
      <Link
        href={`/book/${encodeURIComponent(bookParam)}`}
        prefetch={false}
        className="flex flex-col cursor-pointer text-start bg-transparent relative overflow-visible h-full hover:opacity-90 transition-opacity"
        style={{ width: '100%' }}
        onClick={() => {
          if (bookParam) postBookClick(bookParam);
          onBookClick?.(rawBook);
        }}
      >
        <div className="flex flex-col w-full group/card cursor-pointer relative overflow-visible">
          {/* Image Container */}
          <div className="relative rounded-lg shadow-sm group-hover/card:shadow-md transition-shadow w-full">
            <BookCoverImage
              src={imageUrl}
              alt={book.name ?? ''}
              width={168}
              height={237}
              imgClassName="w-full aspect-[168/237] object-cover rounded-lg relative z-0"
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
          </div>

          {/* Status Badges */}
          <BookStatusBadges
            isBestSeller={book.isBestSeller}
            isNew={book.isNew}
            discount={book.discount}
            ended={ended}
          />

          {/* Title Container */}
          <div className="px-1 pt-1.5 pb-1 flex flex-col flex-1 justify-center">
            <h3 className="text-black text-[11px] sm:text-xs lg:text-sm xl:text-base font-primary font-medium group-hover/card:text-red-600 transition-colors duration-300 line-clamp-2 leading-tight">
              {book.name}
            </h3>
          </div>
        </div>
      </Link >
    </div >
  );
}

export default CardBookImageOnly;
