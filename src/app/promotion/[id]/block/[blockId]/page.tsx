"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchPromotingBlock, PromotingBook, PromotingBlock } from '@/services/apiServices';
import CardBook from '@/components/novelCard/CardBook';
import { Spin, Button } from 'antd';
import Image from 'next/image';
import { ArrowLeftOutlined } from '@ant-design/icons';

function PromotionBlockDetail() {
  const params = useParams();
  const id = params?.id as string;
  const blockId = params?.blockId as string;
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [allBooks, setAllBooks] = useState<PromotingBook[]>([]);

  // Use keepPreviousData equivalent or just manual appending
  const { data: blockData, isLoading, isFetching } = useQuery({
    queryKey: ['promotingBlock', blockId, page],
    queryFn: () => fetchPromotingBlock(blockId, page),
    enabled: !!blockId,
  });

  // Effect to append books when data changes
  useEffect(() => {
    if (blockData?.books) {
      if (page === 1) {
        setAllBooks(blockData.books);
      } else {
        setAllBooks(prev => {
           // Avoid duplicates just in case
           const newBooks = blockData.books.filter(newBook => !prev.some(b => b.book_id === newBook.book_id));
           return [...prev, ...newBooks];
        });
      }
    }
  }, [blockData, page]);

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!blockData && page === 1) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-500 text-lg">ไม่พบข้อมูลบล็อก</p>
      </div>
    );
  }

  // Fallback for banner/title if we are on page > 1 and blockData might be different? 
  // Actually usually block info (banner) is consistent.
  const displayBlock = blockData || { banner: '', type: 'Block Detail', books: [], has_more: false }; 

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header / Back */}
        <div className="mb-6 flex items-center">
             <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => router.back()}
                className="mr-4 text-lg"
             />
             <h1 className="text-2xl font-bold font-primary m-0">
               {/* Use type or generic name if name is missing in Interface */}
               {displayBlock.type || 'รายการหนังสือ'}
             </h1>
        </div>

        {/* Banner */}
        {displayBlock.banner && (
          <div className="relative w-full h-[150px] md:h-[250px] lg:h-[300px] mb-8 rounded-xl overflow-hidden shadow-sm">
            <Image
              src={displayBlock.banner}
              alt="Block Banner"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Books Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 justify-items-center">
          {allBooks.map((book) => (
            <CardBook key={book.book_id} book={book} />
          ))}
        </div>

        {/* Load More */}
        {blockData?.has_more && (
          <div className="mt-8 flex justify-center">
            <Button 
                size="large"
                onClick={() => setPage(p => p + 1)}
                loading={isFetching}
                className="min-w-[120px] rounded-full border-red-600 text-red-600 hover:bg-red-50"
            >
              ดูเพิ่มเติม
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PromotionBlockDetail;
