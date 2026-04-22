import Image from 'next/image';
import { Heart, Eye, AlignJustify } from 'lucide-react';
import Link from 'next/link';

interface Chapter {
  id: string;
  bookId: string | number;
  title: string;
  isNew?: boolean;
}

interface BookStats {
  hearts: number;
  views: number;
  chapterCount: number;
}

interface UpdateBookCardProps {
  book?: {
    book_id?: string | number;
    title: string;
    author: string;
    cover: string;
    chapters: Chapter[];
    stats: BookStats;
  };
}

// Helper to format numbers (e.g. 1000 -> 1k)
const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};

const UpdateBookCard = ({ book }: UpdateBookCardProps) => {
  // Default dummy data if no book prop provided (for preview/fallback)
  const data = book || {
    title: 'หนังสือเล่มใหม่',
    author: 'ผู้แต่ง',
    cover: '/images/cover-placeholder.jpg', // Replace with actual placeholder if needed
    chapters: [
      { id: '1', bookId: '1', title: 'ตอนที่ 28 เด็กรับใช้ของเทพแห่งเขาไท่ซาน', isNew: true },
      { id: '2', bookId: '1', title: 'ตอนที่ 27 หนทางสู่เทพราชันย์ : สังเวยร้อยล้านชีวิต', isNew: true },
      { id: '3', bookId: '1', title: 'ตอนที่ 26 เด็กรับใช้ของเทพแห่งเขาไท่ซาน', isNew: false },
      { id: '4', bookId: '1', title: 'ตอนที่ 25 เพียงตั๊กแตนธรรมดาที่ใครต่อใคร', isNew: false },
      { id: '5', bookId: '1', title: 'ตอนที่ 24 หาทางเพิ่มพลังและปกป้องอาณาจักรเทพของตน', isNew: false },
    ],
    stats: {
      hearts: 1000,
      views: 10000,
      chapterCount: 10,
    }
  };

  return (
    <div className="w-full h-[237px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex">
      {/* Cover Image Section */}
      <div className="relative w-[130px] sm:w-[180px] h-full flex-shrink-0 bg-gray-200">
        {/* Using a placeholder div or Image if src exists */}
        {data.cover ? (
          <Link href={`/book/${data.book_id}`}>
             <div className="relative w-full h-full hover:cursor-pointer hover:scale-105 transition-transform">
                {/* Note: In a real app, use a valid src. Using a colored div for structure if image fails */}
                <Image 
                  src={data.cover} 
                  alt={data.title} 
                  fill 
                  className="object-cover"
                  onError={(e) => {
                    // Fallback logic could go here, but for now we rely on the src
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback visual if image is missing/broken url in dev */}
                <div className="absolute inset-0 bg-red-500 flex flex-col items-center justify-center text-white font-bold text-4xl z-[-1]">
                    <div>ENJOY</div>
                    <div className="mt-auto">BOOK</div>
                </div>
             </div>
          </Link>
        ) : (
            <div className="w-full h-full bg-red-500 flex flex-col items-center justify-center text-white font-bold text-3xl p-4">
                <span>ENJOY</span>
                <span className="mt-auto">BOOK</span>
            </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 py-3 px-4 flex flex-col min-w-0">
        {/* Header */}
        <div className="mb-2">
          <Link href={`/book/${data.book_id}`}>
            <h3 className="text-lg font-medium text-gray-900 truncate hover:text-red-500 transition-colors">{data.title}</h3>
          </Link>
          <p className="text-sm text-gray-400 truncate">{data.author}</p>
        </div>

        {/* Chapter List */}
        <div className="flex-1 space-y-1.5">
          {data.chapters.slice(0, 5).map((chapter, index) => (
            <Link 
              key={index} 
              href={`/read/${chapter.bookId}/${chapter.id}`}
              className="block hover:bg-gray-50 rounded px-1 -mx-1 transition-colors group"
            >
              <div className="flex items-baseline text-[13px] leading-tight min-w-0">
                {chapter.isNew && (
                  <span className="bg-[#E44538] text-white font-bold mr-2 px-1.5 py-[2px] rounded text-[10px] flex-shrink-0 inline-flex items-center justify-center leading-none">NEW</span>
                )}
                <span className={`truncate transition-colors group-hover:text-red-600 ${chapter.isNew ? 'text-gray-800' : 'text-gray-600'}`}>
                  {chapter.title}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="mt-2 flex items-center gap-5 text-gray-400 text-sm">
          <div className="flex items-center gap-1.5">
            <Heart size={16} className="text-gray-400" />
            <span>{formatNumber(data.stats.hearts)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye size={16} className="text-gray-400" />
            <span>{formatNumber(data.stats.views)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlignJustify size={16} className="text-gray-400" />
            <span>{data.stats.chapterCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateBookCard;
