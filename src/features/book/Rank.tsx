"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Pagination, ConfigProvider, Select, Empty } from 'antd';
import { fetchRankingBooks, fetchActiveCategories, RankingTimeRange } from '@/services/apiServices';
import { TagSwiper } from "@/components/swiper/ImageSlider";
import GifLoader from '@/components/utility/GifLoader';



export default function Rank() {
  const [range, setRange] = useState<RankingTimeRange>('week');
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<number | string | undefined>(undefined);

  const { data: categoryData } = useQuery({
    queryKey: ['activeCategories'],
    queryFn: () => fetchActiveCategories('all'), // Assuming 'all' or appropriate type
  });

  const categoryOptions = React.useMemo(() => {
    if (!categoryData) return [];
    // Assume categoryData is ActiveCategory[]
    return categoryData.map((cat) => ({
      label: cat.name,
      value: cat.id, // Ensure id is handled as string/number correctly
    }));
  }, [categoryData]);

  React.useEffect(() => {
    if (categoryData && categoryData.length > 0 && categoryId === undefined) {
      setCategoryId(categoryData[0].id);
    }
  }, [categoryData, categoryId]);

  const { data, isLoading } = useQuery({
    queryKey: ['rankingBooks', range, page, categoryId],
    queryFn: () => fetchRankingBooks(range, page, 10, categoryId),
    enabled: categoryId !== undefined,
  });

  const books = data?.books || [];
  const pagination = data?.pagination;

  const handleRangeChange = (newRange: RankingTimeRange) => {
    setRange(newRange);
    setPage(1);
  };

  const handleCategoryChange = (val: number | string) => {
    setCategoryId(val);
    setPage(1);
  }

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };




  return (
    <div className="w-full max-w-[1124px] mx-auto px-4 py-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-2 border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          {/* Icon from design (cat reading?) - using placeholder or text for now if no asset */}
          <Image src="/images/warning_cat.png" width={40} height={40} className="w-10 h-10 object-contain" unoptimized alt="icon" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-3xl font-bold text-black">จัดอันดับ</h1>
        </div>

        <div className='flex items-center gap-4 mt-4 md:mt-0'>
           {categoryOptions.length > 0 && (
              <Select
                value={categoryId}
                onChange={handleCategoryChange}
                options={categoryOptions}
                className="w-[150px]"
              />
           )}
           
           <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleRangeChange('week')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${range === 'week' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                สัปดาห์
              </button>
              <button
                onClick={() => handleRangeChange('month')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${range === 'month' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                เดือน
              </button>
              <button
                onClick={() => handleRangeChange('year')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${range === 'year' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ปี
              </button>
              <button
                onClick={() => handleRangeChange('all')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${range === 'all' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ตลอดกาล
              </button>
           </div>
        </div>
      </div>

      {/* Book List */}
      {isLoading ? (
        <GifLoader />
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {books.map((book) => (
            <div key={book.book_id} className="bg-white rounded-xl p-4 flex gap-4 md:gap-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Ranking Badge & Image */}
              <div className="relative shrink-0 w-[100px] md:w-[140px] aspect-[2/3]">
                <Link href={`/book/${book.book_id}`} className="block w-full h-full relative group overflow-hidden rounded-md">
                  {/* Rank Badge */}
                  <div className="absolute -top-2 -left-2 z-10">
                    <div className="relative w-8 h-8 md:w-10 md:h-10">
                      {/* Simple badge styling if image not available */}
                      <div className={`w-full h-full flex items-center justify-center rounded-full text-xs md:text-sm font-bold shadow-sm bg-white border ${book.rank === 1 ? 'border-yellow-400 text-yellow-500' :
                        book.rank === 2 ? 'border-gray-400 text-gray-500' :
                          book.rank === 3 ? 'border-orange-400 text-orange-500' :
                            'border-gray-200 text-gray-400'
                        }`}>
                        #{book.rank}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {book.end === 'end' && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow z-10">
                      จบ
                    </div>
                  )}

                  <Image
                    src={book.img}
                    alt={book.name}
                    fill
                    className="object-cover rounded-md shadow-sm transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                </Link>
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col justify-start py-1 min-w-0">
                <Link href={`/book/${book.book_id}`}>
                  <h2 className="text-lg md:text-xl font-bold text-black mb-1 line-clamp-1 hover:text-red-600 transition-colors">{book.name}</h2>
                </Link>
                <div className="text-sm text-gray-600 mb-2 font-medium">{book.writer_name || 'Unknown Author'}</div>

                <div className="text-sm text-gray-500 mb-2 line-clamp-2">
                  {book.title}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-auto w-full overflow-hidden">
                  <TagSwiper tags={Array.isArray(book.tag) ? book.tag : (typeof book.tag === 'string' ? book.tag.split(',').filter(t => t.trim() !== '') : [])} classImport="px-2 py-0.5 rounded-full border border-red-300 text-red-500 text-[10px] md:text-xs bg-red-50 whitespace-nowrap" />
                </div>

                {/* Footer Stats */}
                <div className="flex items-center gap-4 text-xs md:text-sm text-gray-500 mt-2">
                  <div className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#9CA3AF" />
                    </svg>
                    {/* Shorten number helper could be nice, usually k/M */}
                    <span>{book.view.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM19 11H13V13H19V11ZM19 7H13V9H19V7ZM19 15H13V17H19V15Z" fill="#9CA3AF" />
                    </svg>
                    <span>{book.chapter.toLocaleString()} ตอน</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
          <Empty description="ไม่พบข้อมูลการจัดอันดับในหมวดหมู่นี้" />
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-8">
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#DC2626', // red-600
              },
            }}
          >
            <Pagination
              current={page}
              total={pagination?.total || 0}
              pageSize={10} // API default limit is 10
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </ConfigProvider>
        </div>
      )}
    </div>
  )
}