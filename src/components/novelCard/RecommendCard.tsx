import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Heart, List } from 'lucide-react';

interface RecommendCardProps {
  data: {
    rec_id: number;
    book_id: number;
    banner: string;
    book: {
      book_id: number;
      name: string;
      writer_name: string;
      view: number;
      chapter: number;
      shelve_count: number;
      title?: string;
    };
  };
}

const formatViews = (num: number | undefined | null): string => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(0) + "K";
  return num.toString();
};

const RecommendCard = ({ data }: RecommendCardProps) => {
  if (!data?.book) return null;

  const imageUrl = data.banner.startsWith('http')
                    ? data.banner
                    : `https://img.enjoybook.co/enjoybook.image/recommend/${data.banner}`;

  return (
    <Link href={`/book/${data.book.book_id}`} className="block w-[85vw] sm:w-auto">
      <div className="w-full sm:w-[470px] h-auto aspect-[470/275] sm:h-[275px] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col border border-gray-100 relative group">
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt={data.book.name}
            fill
            className="object-cover"
          />
          {/* Gradient Overlay for text readability if it's over image */}
          <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90 pointer-events-none" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content (Overlay at bottom) */}
          <div className="absolute bottom-0 left-0 w-full p-4 text-white transform transition-transform duration-300 group-hover:-translate-y-2">
            <h3 className="text-xl font-bold truncate mb-1 transition-colors">{data.book.name}</h3>
            <div className="flex items-center justify-between">
              <p className="text-sm opacity-90 truncate max-w-[50%]">{data.book.writer_name}</p>

              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1">
                  <Eye size={14} />
                  <span>{formatViews(data.book.view)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <List size={14} />
                  <span>{data.book.chapter}</span>
                </div>
                {/* shelve_count usually implies hearts/favs */}
                <div className="flex items-center gap-1">
                  <Heart size={14} />
                  <span>{data.book.shelve_count}</span>
                </div>
              </div>
            </div>
            {/* Reveal Title/Description on Hover */}
            {data.book.title && (
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out">
                <div className="overflow-hidden">
                  <p className="text-xs mt-2 text-white/90 line-clamp-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {data.book.title}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecommendCard;
