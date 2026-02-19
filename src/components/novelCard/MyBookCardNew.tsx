import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';

interface Book {
  book_id?: number;
  bookID?: any; // strict string in some contexts
  img?: string;
  name?: string;
  view?: number;
  chapter?: number;
  total_income?: number; // Assumption: API provides this or I default to 0
  status?: string | number; // For "close story" check
  [key: string]: any;
}

interface MyBookCardNewProps {
  book: Partial<Book>;
}

const MyBookCardNew: React.FC<MyBookCardNewProps> = ({ book }) => {
  const router = useRouter();

  // 1. Image URL Logic
  const imageUrl = book.img
    ? (typeof book.img === 'string' && book.img.startsWith('http')
      ? book.img
      : `https://image.enjoybook.co/enjoybook.image/book_thumbnail/${book.img}`)
    : "/images/ejb.png";

  // 2. Format Numbers
  const formatNumber = (num: number) => {
    if (num >= 1000 && num <= 999999) return `${(num / 1000).toFixed(0)}k`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    return num;
  };

  // 3. ID Logic
  const bookParam = book.book_id ? String(book.book_id) : (book.bookID && String(book.bookID).trim() !== "" ? String(book.bookID) : "");

  // 4. Handlers
  const handleCloseStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Logic to close/unpublish story - likely just a placeholder or needs API integration
    // User asked to "Design" it, functionality might be separate. 
    // I'll make it a button that looks right.
  };

  const handleOpenStats = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookParam) {
      router.push(`/w/report/${bookParam}`);
    }
  };

  /* handleEdit removed, logic moved to Link onClick */
  const destination = bookParam ? `/w/b/${encodeURIComponent(bookParam)}` : '/w/b';

  const onLinkClick = () => {
    if (bookParam) {
      try {
        sessionStorage.setItem(`editBook_${bookParam}`, JSON.stringify(book));
      } catch (e) { }
    }
  }

  return (
    <div
      className="w-[168px] flex-shrink-0 relative group"
    >
      <Link
        href={destination}
        target="_blank"
        onClick={onLinkClick}
        className="absolute inset-0 z-[1]"
      />
      {/* Cover Image */}
      <div className="relative w-full h-[237px] mb-2 overflow-hidden rounded-lg shadow-sm">
        <Image
          src={imageUrl}
          alt={book.name || 'Book Cover'}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Info Section */}
      <div className="flex flex-col gap-1">
        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 min-h-[3rem] hover:!text-red-600 transition-colors duration-300" title={book.name}>
          {book.name || 'No Title'}
        </h3>

        {/* Stats Row: Views & Chapters */}
        <div className="flex items-center justify-between text-gray-500 text-base">
          {/* Views */}
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{formatNumber(book.view || 0)}</span>
          </div>

          {/* Chapters */}
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-base">{book.chapter || 0}</span>
          </div>
        </div>

        {/* Income Row */}
        <div className="flex items-center justify-between text-[13px] text-gray-700 mt-1 whitespace-nowrap">
          <span className="flex-shrink-0">รายได้ทั้งหมด</span>
          <span className="font-bold truncate ml-2" title={(book.total_income || 0).toLocaleString()}>
            {(book.total_income || 0).toLocaleString()}
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-1 relative z-10">
          <button
            onClick={handleCloseStory}
            className={`px-3 py-0.5 !text-white text-base rounded ${
              book.status === 'publish'
                ? 'bg-green-500 hover:bg-green-600'
                : book.status === 'wait'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            {book.status === 'publish'
              ? 'เปิดเรื่อง'
              : book.status === 'wait'
                ? 'รออนุมัติ'
                : 'ปิดเรื่อง'}
          </button>

          <div
            onClick={handleOpenStats}
            className="text-base text-black hover:text-red-500 font-medium flex items-center"
          >
            สถิติ {'>'}{'>'}{'>'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookCardNew;
