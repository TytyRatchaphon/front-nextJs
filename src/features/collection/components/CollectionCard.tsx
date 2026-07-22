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
          <div className="flex items-center gap-3">
            {col.like_count !== undefined && col.like_count > 0 && (
              <div className="flex items-center gap-1 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span className="font-medium">{col.like_count}</span>
              </div>
            )}
            {!col.owner && (
              <span>{new Date(col.created_at).toLocaleDateString('th-TH')}</span>
            )}
          </div>
        </div>
        {col.owner && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 relative shrink-0">
              {col.owner.img ? (
                <Image src={col.owner.img} alt={col.owner.writer_name} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 truncate">{col.owner.writer_name || col.owner.fullname}</span>
          </div>
        )}
      </div>
    </div>
  );
}
