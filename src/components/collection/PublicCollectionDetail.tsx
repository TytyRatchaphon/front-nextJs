'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import CardBook from '@/components/novelCard/CardBook';
import { getPublicUserCollectionDetail, getPublicUserCollections } from '@/services/api/publicUserApi';
import type { CollectionBook } from '@/services/api/collectionApi';

interface Props {
  userId: string;
  collectionId: string;
}

export default function PublicCollectionDetail({ userId, collectionId }: Props) {
  const router = useRouter();

  const { data: publicCollections, isLoading: isLoadingMeta } = useQuery({
    queryKey: ['public-user-collections', userId, 'all'],
    queryFn: () => getPublicUserCollections(userId, 1, 100),
    enabled: !!userId,
  });

  const { data: books = [], isLoading: isLoadingBooks } = useQuery({
    queryKey: ['public-user-collection-detail', userId, collectionId],
    queryFn: () => getPublicUserCollectionDetail(userId, collectionId),
    enabled: !!userId && !!collectionId,
  });

  const collection = useMemo(
    () => publicCollections?.list?.find((c: any) => String(c.id) === String(collectionId)),
    [publicCollections, collectionId]
  );

  const sortedBooks = useMemo(
    () => [...books].sort((a: CollectionBook, b: CollectionBook) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [books]
  );

  if (isLoadingMeta || isLoadingBooks) {
    return (
      <div className="min-h-screen bg-white py-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-white py-6">
        <div className="container mx-auto px-4 text-center" style={{ maxWidth: '1200px' }}>
          <Empty description="ไม่พบคอลเลคชั่น" />
          <button
            onClick={() => router.push(`/profile/${userId}`)}
            className="mt-4 inline-flex items-center rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-red-500 hover:text-red-600"
          >
            กลับไปโปรไฟล์
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6">
      <div className="container mx-auto px-4" style={{ maxWidth: '1200px' }}>
        <button
          onClick={() => router.push(`/profile/${userId}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors mb-4 md:mb-6 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform mb-4">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span className="text-sm font-medium mb-4">กลับไปโปรไฟล์</span>
        </button>

        <div className="relative w-full h-[180px] md:h-[260px] rounded-2xl overflow-hidden mb-6 md:mb-8 shadow-lg">
          {collection.cover_image ? (
            <Image src={collection.cover_image} alt={collection.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-400 to-rose-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">เผยแพร่</span>
                  <span className="text-white/70 text-xs">{sortedBooks.length} เล่ม</span>
                </div>
                <h1 className="text-xl md:text-3xl font-bold text-white mb-1">{collection.name}</h1>
                <p className="text-white/70 text-xs md:text-base max-w-xl line-clamp-2">{collection.description || 'ไม่มีรายละเอียด'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-base md:text-lg font-bold text-gray-900">หนังสือในคอลเลคชั่น</h2>
        </div>

        {sortedBooks.length === 0 ? (
          <div className="py-12">
            <Empty description="ยังไม่มีหนังสือในคอลเลคชั่นนี้" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sortedBooks.map((b: CollectionBook) => (
              <div key={b.book_id} className="relative w-full max-w-[180px] h-[380px] mx-auto">
                <CardBook book={b as any} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
