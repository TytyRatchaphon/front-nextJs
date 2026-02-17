
import Image from 'next/image';
import React from 'react'
import { UniversalBook } from '../../types/api';
import SaleGroupSVG from './SaleGroupSvg';
import { imageLoader } from '@/utils/imageUtils';



interface PackCardBookHorizontalProps {
    book: UniversalBook;
    onClick?: () => void;
    action?: React.ReactNode;
    className?: string;
}


function PackCardBookHorizontal({ book, onClick, action, className = "" }: PackCardBookHorizontalProps) {
    const [imgError, setImgError] = React.useState(false);

    const formatNumber = (num: number) => {
        if (num >= 1000 && num <= 999999) {
            return `${(num / 1000).toFixed(0)}k`;
        }
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        return num;
    }

    // สร้าง URL รูปภาพ
    const imgSource = book.img;
    const imageUrl = imgSource
        ? (typeof imgSource === 'string' && imgSource.startsWith('https')
            ? imgSource
            : `https://img.enjoybook.co/img/book/tn/${imgSource}`)
        : "/images/ejb.png";

    const isEndedValue = (v: any) => {
        if (v === true) return true;
        if (v === 1 || v === '1') return true;
        if (!v && v !== 0) return false;
        if (typeof v === 'number' && v >= 2) return true;
        if (typeof v === 'string' && /^[0-9]+$/.test(v) && Number(v) >= 2) return true;
        const s = String(v).trim().toLowerCase();
        return s === 'end' || s === 'ended' || s === 'finished' || s === 'true' || s === 'จบ' || s === 'จบแล้ว' || s === 'complete' || s === 'completed' || s === 'finished';
    };

    const ended = isEndedValue(book.end) || isEndedValue(book.status) || isEndedValue(book.finished) || isEndedValue(book.is_end) || isEndedValue(book.isFinished) || isEndedValue(book.finish) || isEndedValue(book.ended) || isEndedValue(book.end_status) || isEndedValue(book.publish_status) || isEndedValue(book.status_id) || isEndedValue(book.status_code) || isEndedValue(book.complete) || isEndedValue(book.is_complete) || isEndedValue(book.finish_status);

    return (
        <div
            className={`flex gap-4 p-3 bg-white relative transition-all w-full ${className}`}
            onClick={onClick}
        >
            {/* Image Container - Fixed Aspect Ratio 2:3 */}
            <div className="relative w-[120px] aspect-[2/3] flex-shrink-0">
                {!imgError ? (
                    <Image
                        src={imageUrl}
                        alt={book.name ?? ''}
                        className="w-full h-full object-cover rounded-lg relative z-0"
                        fill
                        loading="lazy"
                        unoptimized
                        onError={() => {
                            setImgError(true);
                        }}
                    />
                ) : (
                    <Image
                        src="/images/ejb.png"
                        alt={book.name ?? ''}
                        className="w-full h-full object-cover rounded-lg relative z-0"
                        fill
                        unoptimized
                    />
                )}

                {/* Discount Episode Overlay */}
                {book.discount_ep_count && book.discount_ep_count > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 z-10 w-full">
                        <Image
                            src="/images/sale-ep.png"
                            alt="sale-ep"
                            width={120}
                            height={30}
                            className="w-full h-[30px] object-contain align-bottom"
                            unoptimized
                        />
                        <div className="absolute bottom-[1px] left-0 right-0 text-center text-white text-[9px] font-bold drop-shadow-md">
                            ลดราคา <span className="text-[#FFD700] text-xs mx-0.5">{book.discount_ep_count}</span> ตอน
                        </div>
                    </div>
                )}

                {/* Rank Badge */}
                {book.rank && (
                    <div className="absolute bottom-1 right-1 w-[20px] h-[20px] transform rotate-45 rounded-lg bg-[#E60000] shadow-md border-2 border-white flex items-center justify-center z-20">
                        <div className="transform -rotate-45 text-white font-bold text-xs">{book.rank}</div>
                    </div>
                )}

                {/* Status Badges */}
                {(() => {
                    let leftBadge: any = null;
                    let rightBadge: any = null;
                    const badges = {
                        bestSeller: { src: "/images/bestseller.png", width: 46, height: 54, className: "absolute -top-2 -right-0" },
                        bestSellerLeft: { src: "/images/bestseller.png", width: 46, height: 54, className: "absolute -top-2 -left-2 scale-x-[-1]" },
                        new: { src: "/images/new.png", width: 50, height: 50, className: "absolute top-2 right-1" },
                        discount: (percent: number | string) => ({
                            component: (
                                <SaleGroupSVG 
                                    className="absolute top-0 right-2 z-20 w-[2.8rem] h-[3.9rem] drop-shadow-md" 
                                    percent={percent} 
                                />
                            )
                        }),
                        newEp: { src: "/images/new.png", width: 36, height: 36, className: "absolute top-0 right-0" },
                        ended: (pos: 'left' | 'right') => ({
                            component: (
                                <div className={`absolute top-2 ${pos === 'left' ? 'left-2' : 'right-2'} bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium shadow-md z-20`}>
                                    จบแล้ว
                                </div>
                            )
                        })
                    };

                    if (book.isBestSeller && book.discount) {
                        leftBadge = { ...badges.bestSeller, className: "absolute -top-[10px] left-2" };
                        rightBadge = badges.discount(book.discount);
                    } else if (book.isBestSeller) {
                        rightBadge = badges.bestSeller;
                        if (ended) leftBadge = badges.ended('left');
                    } else if (book.isNew && !ended) {
                        rightBadge = badges.new;
                    } else if (book.discount) {
                        rightBadge = badges.discount(book.discount);
                        if (ended) leftBadge = badges.ended('left');
                    } else if (ended) {
                        rightBadge = badges.ended('right');
                    }

                    return (
                        <>
                            {leftBadge && (leftBadge.component ? leftBadge.component : (
                                <div className={`${leftBadge.className} z-20`}>
                                    <Image
                                        src={leftBadge.src}
                                        alt="badge"
                                        width={leftBadge.width}
                                        height={leftBadge.height}
                                        className="object-contain drop-shadow-md"
                                        unoptimized
                                    />
                                </div>
                            ))}
                            {rightBadge && (rightBadge.component ? rightBadge.component : (
                                <div className={`${rightBadge.className} z-20`}>
                                    <Image
                                        src={rightBadge.src}
                                        alt="badge"
                                        width={rightBadge.width}
                                        height={rightBadge.height}
                                        className="object-contain drop-shadow-md"
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </>
                    );
                })()}
            </div>

            {/* Content Container */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="mb-2">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1 truncate pr-2">{book.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 gap-3 mb-2">
                        {/* Views */}
                        <div className="flex items-center gap-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                                <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="leading-none">{formatNumber(book.view || 0)}</span>
                        </div>
                        {/* Chapters */}
                        <div className="flex items-center gap-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                                <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span className="leading-none flex items-center gap-2">
                                {(book.chapter || 0).toLocaleString()} ตอน
                                {book.type === 'NORMAL' && <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded border border-blue-100 font-medium">รายตอน</span>}
                                {book.type === 'BUNDLE' && <span className="text-sm bg-orange-50 text-orange-500 px-2 py-0.5 rounded border border-orange-100 font-medium">มัดแพ็ค</span>}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                        {book.writer || book.writer_name || book.author ? (
                            <span className="font-semibold block mb-1">โดย: {book.writer || book.writer_name || book.author}</span>
                        ) : null}
                        {book.title || book.detail || book.description || ""}
                    </p>
                </div>
                {action && (
                    <div className="mt-auto pt-2 border-t border-dashed border-gray-100 w-full">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PackCardBookHorizontal
