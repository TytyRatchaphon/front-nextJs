import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, List } from "lucide-react";
import { CategoryBook } from "@/types/api";
import { TagSwiper } from "@/components/swiper/ImageSlider";

interface CategoryHorizontalCardProps {
  book: CategoryBook;
}



const formatViews = (num: number | undefined | null): string => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(0) + "K";
  return num.toString();
};

const CategoryHorizontalCard: React.FC<CategoryHorizontalCardProps> = ({ book }) => {
  // Parse tags if string
  const tags = typeof book.tag === 'string'
    ? (book.tag as string).split(',').filter(t => t.trim() !== '')
    : (Array.isArray(book.tag) ? book.tag : []);

  return (
    <div className="flex bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 h-[220px]">
      {/* Cover Image */}
      <Link href={`/book/${book.book_id}`} className="block flex-shrink-0 w-[147px] h-full relative group">
        <Image
          src={book.img}
          alt={book.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {book.isNew && (
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md z-10">
            NEW
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 px-4 pt-4 pb-6 flex flex-col justify-between min-w-0">
        <div className="min-w-0 w-full">
          <Link href={`/book/${book.book_id}`}>
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1 hover:text-red-600 transition-colors mb-1">
              {book.name}
            </h3>
          </Link>
          <div className="text-sm text-gray-500 mb-2 truncate">
            {book.writer_name}
          </div>
          <div className="text-sm text-gray-500 mb-2 line-clamp-2">
            {book.title}
          </div>

          <div className="w-full overflow-hidden">
            <TagSwiper
              tags={tags}
              classImport="px-2 py-0.5 rounded-full border border-red-200 text-red-500 text-xs bg-red-50 text-nowrap whitespace-nowrap block"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 border-t pt-2 w-full">
          <div className="flex items-center gap-1">
            <Eye size={14} />
            <span>{formatViews(book.view)}</span>
          </div>
          <div className="flex items-center gap-1">
            <List size={14} />
            <span>{(book.chapter || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryHorizontalCard;
