import Image from 'next/image';
import type { CollectionItem } from '@/services/api/collectionApi';

export default function CollectionCard({ collection: col }: { collection: CollectionItem }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
      {/* Cover Image */}
      <div className="relative w-full h-[160px] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {col.cover_image ? (
          <Image
            src={col.cover_image}
            alt={col.name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 hover:text-red-600 transition-colors mb-1 truncate">
          {col.name}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3 min-h-[40px]">
          {col.description || 'ไม่มีรายละเอียด'}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>{col.book_count} เล่ม</span>
          </div>
          <span>{new Date(col.created_at).toLocaleDateString('th-TH')}</span>
        </div>
      </div>
    </div>
  );
}
