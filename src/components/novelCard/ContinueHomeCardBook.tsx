import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Book as BookIcon } from 'lucide-react';

interface ContinueHomeCardBookProps {
  book: any; // Using any for now to match flexible API response, refactor to proper type later
}

const ContinueHomeCardBook = ({ book }: ContinueHomeCardBookProps) => {
  // Safe access to properties
  const title = book.name || book.title || 'Unknown Title';
  const author = book.writer_name || book.author || 'Unknown Author';
  const cover = book.img_full || book.img || book.cover || '/images/default-book.png';
  const lastEp = book.last_read_ep_name || book.last_read_ep || 'Chapter ?';
  // Assuming API gives total unread or similar, otherwise mock logic or hide
  // The UI shows "อ่านต่อมากกว่า 10+ ตอน", implying we might need a calculation 
  // or it's a static text for 'continue reading'. 
  // If we have total_chapter and last_read_ep_order, we can calc.
  
  return (
    <Link href={`/read/${book.book_id}/${book.last_read_ep_id}`} className="block w-[85vw] sm:w-auto">
      <div className="w-full sm:w-[441px] h-[134px] bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
         {/* Cover Image */}
         <div className="w-[85px] h-full relative rounded-lg overflow-hidden flex-shrink-0">
             <Image 
                src={cover}
                alt={title}
                fill
                className="object-cover"
                unoptimized
             />
         </div>

         {/* Content */}
         <div className="flex-1 flex flex-col justify-between py-1">
            <div>
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 pr-2 leading-tight mb-1 hover:text-red-500 transition-colors">{title}</h3>
                <p className="text-sm text-gray-400 truncate ">{author}</p>
            </div>

            <div className="mt-auto space-y-1">
                 {/* Last Read Status */}
                 <div className="flex items-center gap-2 text-sm text-gray-600">
                     <span className="text-red-500 font-medium whitespace-nowrap">อ่านล่าสุด</span>
                     <span className="truncate max-w-[180px]">{lastEp}</span>
                 </div>
            </div>
         </div>
      </div>
    </Link>
  );
};

export default ContinueHomeCardBook;