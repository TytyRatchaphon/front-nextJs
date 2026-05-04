
import Image from 'next/image';
import 'next/link';
import React from 'react'
import '@/services/apiServices';
import { UniversalBook } from '../../types/api';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';
import { BookPurchaseRewardBadge } from './BookPurchaseRewardBadge';
import { BookCoverImage } from './BookCoverImage';
import { BookStatusBadges } from './BookStatusBadges';
import { BookStatsRow } from './BookStatsRow';
import { computeEnded } from './bookCardUtils';



interface PackCardBookProps {
    book: UniversalBook;
    onClick?: () => void;
}


function PackCardBook({ book, onClick }: PackCardBookProps) {

    const imageUrl = resolveBookCoverImageSrc(book, '/images/ejb.png');
    const hasBottomSaleOverlay = Boolean(book.discount_ep_count && book.discount_ep_count > 0);
    const ended = computeEnded(book);

    return (
        <div className="w-full max-w-[180px] h-auto md:h-[380px] flex-shrink-0 relative z-0">
            <div
                className="flex flex-col cursor-pointer p-1 text-start hover:text-red-600 bg-transparent relative overflow-visible h-full"
                style={{ width: '100%' }}
                onClick={() => {
                    if (onClick) {
                        onClick();
                    }
                }}
            >
                <div className="flex flex-col w-full h-full rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow group/card cursor-pointer relative overflow-visible">
                    {/* Image Container */}
                    <BookCoverImage
                        src={imageUrl}
                        alt={book.name ?? ''}
                        width={168}
                        height={237}
                        className="w-full aspect-[2/3] md:h-[237px]"
                        imgClassName="w-full h-full object-cover rounded-t-lg relative z-0"
                    >
                        {/* Discount Episode Overlay */}
                        {book.discount_ep_count && book.discount_ep_count > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 z-10 w-full">
                                <Image
                                    src="/images/sale-ep.png"
                                    alt="sale-ep"
                                    width={120}
                                    height={30}
                                    className="w-full h-[30px] md:h-[40px] object-contain align-bottom"
                                />
                                <div className="absolute bottom-[1px] md:bottom-[1px] left-0 right-0 text-center text-white text-[9px] md:text-[11px] font-bold drop-shadow-md">
                                    ลดราคา <span className="text-[#FFD700] text-xs mx-0.5">{book.discount_ep_count}</span> ตอน
                                </div>
                            </div>
                        )}

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
                        size="sm"
                    />

                    {/* Content Container */}
                    <div className="px-3 pt-3 pb-2 flex flex-col gap-1 flex-1">
                        <h3 className="text-black text-sm md:text-base font-primary font-medium group-hover/card:text-red-600 transition-colors duration-300 line-clamp-2 h-[2.5rem] md:h-[3rem]">
                            {book.name}
                        </h3>

                        <p className="text-gray-400 text-[10px] md:text-xs mb-2 truncate">{book.writer || book.writer_name || book.author}</p>

                        <BookStatsRow
                            shelveCount={book.shelveCount || book.shelfCount || book.shelve_count || book.shelf_count || 0}
                            viewCount={book.view || 0}
                            chapterCount={book.chapter || 0}
                            size="sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PackCardBook
