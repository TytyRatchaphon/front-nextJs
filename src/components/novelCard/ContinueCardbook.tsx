import Image from 'next/image';
import Link from 'next/link'
import React from 'react'
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';

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
  [key: string]: any;
}

interface CardBookProps {
  // allow partial shapes (API sometimes omits fields)
  book: Partial<Book>;
}

function CardBook({ book }: CardBookProps) {
  
  const [imgError, setImgError] = React.useState(false);

  // Client-side debug: log whether shelveCount is present when the card mounts/updates
  React.useEffect(() => {
    try {
    } catch {
      // ignore
    }
  }, [book.book_id, book.bookID, book.shelveCount]);
  
  const imageUrl = resolveBookCoverImageSrc(book, '/images/ejb.png');

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

  // Episode id for read route: prefer numeric `ep_id`, then `epID`/`epId`.
  const epParam = (book.last_read_ep_id ?? book.ep_id ?? book.epID ?? book.epId ?? book.epid ?? book.epIdStr ?? '')
  const epParamStr = epParam !== undefined && epParam !== null ? String(epParam) : ''

  // Episode display name from API (many responses use `epName`, `ep_name`, or `last_read_ep_name`)
  const epName = book.epName ?? book.ep_name ?? book.epname ?? book.last_read_ep_name ?? ''

  return (
  <Link href={`/read/${encodeURIComponent(bookParam)}/${encodeURIComponent(epParamStr)}`} className="block w-[168px] h-[355px] flex-shrink-0">
      <div className="flex flex-col w-full h-full rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
        {/* Image Container */}
        <div className="relative w-full">
          {!imgError ? (
            <Image 
              src={imageUrl}
              alt={book.name ?? ''}
              className="w-full h-[237px] object-cover"
              width={168}
              height={237}
              loading="lazy"
              onError={() => {
                setImgError(true);
              }}
            />
          ) : (
            <Image 
              src="/images/ejb.png"
              alt={book.name ?? ''}
              className="w-full h-[237px] object-cover"
              width={168}
              height={237}
            />
          )}
          
          {/* End Status Badge - แสดงเมื่อสถานะบ่งชี้ว่าจบแล้ว */}
          {ended && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
              จบแล้ว
            </div>
          )}
  </div>
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
