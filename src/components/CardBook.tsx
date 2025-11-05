import Image from 'next/image';
import Link from 'next/link'
import React from 'react'

interface Book {
  book_id: number;
  bookID: string;
  type: string;
  img: string;
  name: string;
  title: string;
  tag: string;
  view: number;
  heart: number;
  flower: number;
  [key: string]: any;
}

interface CardBookProps {
  book: Book;
}

function CardBook({ book }: CardBookProps) {
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
  const imageUrl = book.img 
    ? `https://img.enjoybook.co/img/book/tn/${book.img}`
    : "/images/ejb.png";

  return (
    <Link href={`/book/${book.book_id}`}>
      <div className="flex flex-col w-[168px] h-[355px] rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
        {/* Image Container */}
        <div className="relative w-full">
          <Image 
            src={imageUrl}
            alt={book.name}
            className="w-full h-[237px] object-cover"
            width={168}
            height={237}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/ejb.png";
            }}
          />
          
          {/* End Status Badge - แสดงเมื่อสถานะเป็น "end" */}
          {book.end === 'end' && (
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
            
          <p className="text-gray-400 text-xs">{book.author}</p>

          <div className="flex items-center justify-between text-sm text-gray-500 mt-5">
            {/* Heart Icon */}
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{formatNumber(book.heart || 0)}</span>
            </div>
            
            {/* Eye Icon */}
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{formatNumber(book.view || 0)}</span>
            </div>
            
            {/* Menu Icon */}
            <div className="flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{formatNumber(book.flower || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CardBook