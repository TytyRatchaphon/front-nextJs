"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchPromotingBlockBooks, PromotingBook } from '@/services/apiServices';
import CardBook from '@/components/novelCard/CardBook';
import { Spin, Button } from 'antd';
import Image from 'next/image';
import { ArrowLeftOutlined } from '@ant-design/icons';

function PromotionBlockDetail() {
  const params = useParams();
  const blockId = params?.blockId as string;
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [allBooks, setAllBooks] = useState<PromotingBook[]>([]);

  const { data: blockData, isLoading, isFetching } = useQuery({
    queryKey: ['promotingBlockBooks', blockId, page],
    // Fetch all books (up to 1000) if it's the first page request to support "View All" requirement
    queryFn: () => fetchPromotingBlockBooks(blockId, page, page === 1 ? 1000 : undefined),
    enabled: !!blockId,
  });

  // Effect to append books when data changes
  useEffect(() => {
    if (blockData?.books) {
      if (page === 1) {
        setAllBooks(blockData.books);
      } else {
        setAllBooks(prev => {
           // Avoid duplicates
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

  // Use the data from the first fetch (page 1) or current fetch for header info
  // Assuming banner and name don't change across pages
  const displayBanner = blockData?.banner; 
  const displayTitle = blockData?.block_name || 'รายการหนังสือ';
  // Logic to hide load more if we fetched everything
  // Determine if we have loaded all available books
  const hasMore = blockData ? (allBooks.length < blockData.total) : false;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      <div className="w-full max-w-[1070px] mx-auto py-8">
        
        {/* Header / Back */}
        <div className="mb-6 flex items-center px-4">
             <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => router.back()}
                className="mr-4 text-lg"
             />
             <h1 className="text-2xl font-bold font-primary m-0">
               {displayTitle}
             </h1>
        </div>

        {/* Banner */}
        {displayBanner && (
          <div className="px-4">
            <div className="relative mb-8 h-[170px] w-full overflow-hidden rounded-[28px] border border-black/5 bg-[#f7f3f0] shadow-[0_18px_48px_rgba(15,23,42,0.08)] md:h-[250px]">
              <Image
                src={displayBanner}
                alt="Block Banner"
                fill
                sizes="(max-width: 768px) calc(100vw - 32px), 1070px"
                className="object-cover object-center"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Books Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 justify-items-center px-4">
          {allBooks.map((book) => (
            <CardBook key={book.book_id} book={book} />
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="mt-8 flex justify-center px-4">
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
