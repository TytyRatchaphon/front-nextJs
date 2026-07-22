import Image from 'next/image';
import Link from 'next/link';
import { Book, Heart } from 'lucide-react';
import type { CollectionItem } from '@/services/api/collectionApi';

interface HomeCollectionCardProps {
  collection: CollectionItem;
}

const HomeCollectionCard = ({ collection }: HomeCollectionCardProps) => {
  const imageUrl = collection.cover_image || '/images/default-book.png';
  const ownerName = collection.owner?.writer_name || collection.owner?.fullname || 'Unknown';
  const ownerId = collection.owner?.user_id ?? 1;

  return (
    <Link
      href={`/profile/${ownerId}/collection/${collection.id}`}
      className="block w-[85vw] sm:w-[380px] group cursor-pointer"
    >
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-zinc-900">
        {/* Full Bleed Cover Image */}
        <Image
          src={imageUrl}
          alt={collection.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          unoptimized={!collection.cover_image}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 flex items-end justify-between gap-3">
          {/* Left: Title & Author */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 drop-shadow-md">
              {collection.name}
            </h3>
            <p className="text-[11px] sm:text-xs text-white/60 mt-1 truncate font-medium">
              {ownerName}
            </p>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-3 text-[11px] sm:text-xs font-medium text-white/70 shrink-0">
            <div className="flex items-center gap-1">
              <Book size={12} className="stroke-[2.5]" />
              <span>{collection.book_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart size={12} className="stroke-[2.5] group-hover:text-red-400 transition-colors" />
              <span>{collection.like_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HomeCollectionCard;
