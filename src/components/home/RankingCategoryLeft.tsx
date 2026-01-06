'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, ChevronRight } from 'lucide-react';
import NavIcon from '@/assets/images/icon.png';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { useQuery } from "@tanstack/react-query";
import { fetchCategoryRankingBooks, CategoryRankingBookItem } from "@/services/apiServices";
import GifLoader from '@/components/utility/GifLoader';

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
}

interface RankingCategoryLeftProps {
  categoryId?: number;
  categoryName?: string;
}

export default function RankingCategoryLeft({ categoryId, categoryName }: RankingCategoryLeftProps) {
  const [activeTab, setActiveTab] = useState<'7' | '15' | '30'>('7');

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['categoryRanking', categoryId, activeTab],
    queryFn: () => {
      // Convert tab '7' -> range 7, '15' -> 15, '30' -> 30
      const rangeMap = { '7': 7, '15': 15, '30': 30 };
      if (!categoryId) return [];
      return fetchCategoryRankingBooks(categoryId, rangeMap[activeTab]);
    },
    enabled: !!categoryId,
  });

  if (!categoryId || !categoryName) return null;

  return (
    <div className="w-full max-w-[540px] h-[889px] mx-auto bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 font-primary">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4 flex items-center justify-between text-white relative h-[76px]">
        <div className="w-10 h-10 bg-white rounded-full p-1 flex items-center justify-center flex-shrink-0 shadow-sm z-10">
             <Image src={NavIcon} alt="Logo" width={32} height={32} className="object-contain" />
        </div>
        
        <h2 className="text-lg font-bold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
            จัดอันดับหมวด{categoryName}
        </h2>

        <Link href={`/ranking/category/${categoryId}`} className="flex items-center text-xs font-medium !text-white hover:!text-gray-800 !transition-colors z-10">
          ดูเพิ่มเติม <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex text-sm font-bold border-b border-gray-100">
        <button
          onClick={() => setActiveTab('7')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            activeTab === '7' ? 'text-red-600' : 'text-gray-800 hover:text-red-500'
          }`}
        >
          7 วัน
          {activeTab === '7' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('15')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            activeTab === '15' ? 'text-red-600' : 'text-gray-800 hover:text-red-500'
          }`}
        >
          15 วัน
          {activeTab === '15' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('30')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            activeTab === '30' ? 'text-red-600' : 'text-gray-800 hover:text-red-500'
          }`}
        >
          30 วัน
          {activeTab === '30' && (
             <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* List */}
      <div className="p-4 flex flex-col gap-4 h-[calc(100%-130px)] overflow-y-auto">
        {isLoading ? (
            <GifLoader className="h-full" />
        ) : books.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-gray-400">
             <p>ไม่พบข้อมูลการจัดอันดับ</p>
           </div>
        ) : (
          books.map((book: CategoryRankingBookItem) => (
            <div key={book.book_id} className="flex items-center gap-4 py-2 px-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer">
              {/* Rank Number */}
              <div className="w-10 flex-shrink-0 text-center">
                <span className={`text-3xl font-bold ${book.rank <= 3 ? 'text-black' : 'text-black'}`}>
                  {book.rank}
                </span>
              </div>

              {/* Book Cover */}
              <div className="relative w-[70px] h-[105px] flex-shrink-0 shadow-md rounded-md overflow-hidden">
                <Image 
                  src={book.img} 
                  alt={book.name} 
                  fill 
                  className="object-cover"
                  loader={imageLoader}
                  unoptimized
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <Link href={`/book/${book.book_id}`}>
                  <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                    {book.name}
                  </h3>
                </Link>
                <p className="text-xs text-gray-500">
                  {book.writer_name}
                </p>
                
                <div className="flex items-center justify-between mt-1">
                   {/* Tags */}
                   <div className="flex-1 min-w-0 mr-2 overflow-hidden">
                      <Swiper
                        slidesPerView="auto"
                        spaceBetween={4}
                        freeMode={true}
                        modules={[FreeMode]}
                        className="w-full"
                      >
                       {book.tag?.split(',').map((tag, i) => (
                           <SwiperSlide key={i} className="!w-auto">
                              <span className="border border-red-300 text-red-500 text-[12px] px-2 py-0.5 rounded leading-none whitespace-nowrap block">
                                  {tag.trim()}
                              </span>
                           </SwiperSlide>
                       ))}
                      </Swiper>
                   </div>
                   
                   {/* Views */}
                   <div className="flex items-center gap-1 text-gray-400 text-xs ml-2 flex-shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{book.view}</span>
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
