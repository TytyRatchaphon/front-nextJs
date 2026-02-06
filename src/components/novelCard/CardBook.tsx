import { write } from 'fs';
import Image from 'next/image';
import Link from 'next/link'
import React from 'react'
import { postBookClick } from '@/services/apiServices';
import FlashSaleSVG from './FlashSaleSvg';

interface Book {
  book_id?: number;
  // bookID: string;
  // type: string;
  img?: string;
  name?: string;
  // title: string;
  // tag: string;
  view?: number;
  // heart: number;
  // flower: number;
  end?: string; // make optional because some payloads omit it
  chapter?: number;
  shelveCount?: number;
  discount_ep_count?: number;
  [key: string]: any;
}

interface CardBookProps {
  // allow partial shapes (API sometimes omits fields)
  book: Partial<Book>;
}

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 100}`
}

function CardBook({ book }: CardBookProps) {

  const [imgError, setImgError] = React.useState(false);

  // Client-side debug: log whether shelveCount is present when the card mounts/updates
  React.useEffect(() => {
    try {
    } catch (e) {
      // ignore
    }
  }, [book.book_id, book.bookID, book.shelveCount, book['writer.writer_name'], book.writer_name, book.author]);

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
  // Support both full URLs and filename keys from the API.
  const imgSource = book.img;
  const imageUrl = imgSource
    ? (typeof imgSource === 'string' && imgSource.startsWith('https')
      ? imgSource
      : `https://img.enjoybook.co/img/book/tn/${imgSource}`)
    : "/images/ejb.png";

  // Normalize and detect various "ended" values from different APIs
  const isEndedValue = (v: any) => {
    if (v === true) return true;
    if (v === 1 || v === '1') return true;
    if (!v && v !== 0) return false;
    // numeric codes (some APIs use 2 for finished)
    if (typeof v === 'number' && v >= 2) return true;
    if (typeof v === 'string' && /^[0-9]+$/.test(v) && Number(v) >= 2) return true;
    const s = String(v).trim().toLowerCase();
    return s === 'end' || s === 'ended' || s === 'finished' || s === 'true' || s === 'จบ' || s === 'จบแล้ว' || s === 'complete' || s === 'completed' || s === 'finished';
  };

  const ended = isEndedValue(book.end) || isEndedValue(book.status) || isEndedValue(book.finished) || isEndedValue(book.is_end) || isEndedValue(book.isFinished) || isEndedValue(book.finish) || isEndedValue(book.ended) || isEndedValue(book.end_status) || isEndedValue(book.publish_status) || isEndedValue(book.status_id) || isEndedValue(book.status_code) || isEndedValue(book.complete) || isEndedValue(book.is_complete) || isEndedValue(book.finish_status);

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
        }}
      >
        <div className="flex flex-col w-full h-full rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow group/card cursor-pointer relative overflow-visible">
          {/* Image Container */}
          <div className="relative w-full">
            {!imgError ? (
              <Image
                src={imageUrl}
                alt={book.name ?? ''}
                className="w-full h-[237px] object-cover rounded-t-lg relative z-0"
                width={168}
                height={237}
                loading="lazy"
                unoptimized
                loader={imageLoader}
                onError={() => {
                  setImgError(true);
                }}
              />
            ) : (
              <Image
                src="/images/ejb.png"
                alt={book.name ?? ''}
                className="w-full h-[237px] object-cover rounded-t-lg relative z-0"
                width={168}
                height={237}
                loader={imageLoader}
              />
            )}

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
                  loader={imageLoader}
                />
                <div className="absolute bottom-1.5 left-0 right-0 text-center text-white text-[11px] font-bold drop-shadow-md">
                  ลดราคา <span className="text-[#FFD700] text-xs mx-0.5">{book.discount_ep_count}</span> ตอน
                </div>
              </div>
            ) : null}

            {/* Rank Badge */}
            {book.rank && (
              <div className="absolute bottom-1 right-1 w-[20px] h-[20px] md:w-[30px] md:h-[30px] transform rotate-45 rounded-lg bg-[#E60000] shadow-md border-2 border-white flex items-center justify-center z-20">
                <div className="transform -rotate-45 text-white font-bold text-xs md:text-lg">{book.rank}</div>
              </div>
            )}
          </div>

          {/* Status Badges */}
          {(() => {
            let leftBadge: any = null;
            let rightBadge: any = null;

            // Badge definitions
            const badges = {
              bestSeller: { src: "/images/bestseller.png", width: 46, height: 54, className: "absolute -top-2 -right-0" },
              bestSellerLeft: { src: "/images/bestseller.png", width: 46, height: 54, className: "absolute -top-2 -left-2 scale-x-[-1]" }, // Flip for left? Or just position left. Let's just position left for now. User didn't ask for flip, but standard UI might flip ribbon. Using standard left position first. Actually, Bestseller usually looks specific. Let's keep it simple: Position Left.
              new: { src: "/images/new.png", width: 50, height: 50, className: "absolute top-2 right-1" },
              discount: (percent: number | string) => ({
                component: (
                  <div className="absolute -top-3 -right-3 z-20 w-[75px] h-[75px]">
                    <Image
                      src="/images/sale-group.png"
                      alt="sale"
                      width={75}
                      height={75}
                      className="absolute inset-0 object-contain drop-shadow-md"
                      loader={imageLoader}
                    />
                    <span className="absolute top-[64px] right-[18px] text-white  text-[15px] leading-none transform -rotate-[17deg]">{percent}%</span>
                  </div>
                )
              }),
              newEp: { src: "/images/new.png", width: 36, height: 36, className: "absolute top-0 right-0" },
              ended: (pos: 'left' | 'right') => ({
                component: (
                  <div className={`absolute top-2 ${pos === 'left' ? 'left-2' : 'right-2'} bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md z-20`}>
                    จบแล้ว
                  </div>
                )
              })
            };

            // Logic Determination
            if (book.isBestSeller && book.discount) {
              // Special Case: BestSeller Left, Discount Right
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

            // Render
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
                      loader={imageLoader}
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
                      loader={imageLoader}
                    />
                  </div>
                ))}
              </>
            );
          })()}

          {/* Content Container */}
          <div className="px-3 pt-3 pb-2 flex flex-col gap-1 flex-1">
            <h3 className="text-black text-base font-primary font-medium group-hover/card:text-red-600 transition-colors duration-300 line-clamp-2 h-[3rem]">
              {book.name}
            </h3>

            <p className="text-gray-400 text-xs mb-2 truncate">{book.writer || book.writer_name || book.author}</p>

            <div className="mt-auto grid grid-cols-3 items-center text-xs text-gray-500 w-full">
              {/* Left: heart (left aligned) */}
              <div className="flex items-center gap-1 justify-start">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                  <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="leading-none">{formatNumber(book.shelveCount || book.shelfCount || book.shelve_count || book.shelf_count || 0)}</span>
              </div>

              {/* Center: view (centered) */}
              <div className="flex items-center gap-1 justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                  <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="leading-none">{formatNumber(book.view || 0)}</span>
              </div>

              {/* Right: menu / more (right aligned) */}
              <div className="flex items-center gap-1 justify-end">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                  <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="leading-none">{(book.chapter || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Link >
    </div >
  );
}

export default CardBook