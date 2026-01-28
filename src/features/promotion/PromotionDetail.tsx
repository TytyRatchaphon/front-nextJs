"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchPromotingGroupDetail, PromotingBook, PromotingBlock } from '@/services/apiServices';
import CardBook from '@/components/novelCard/CardBook';
import { Spin } from 'antd';
import Image from 'next/image';
import Link from 'next/link';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const PromotionBlockTypeB = ({ block }: { block: PromotingBlock }) => {
  // Right Side: Chunk books into groups of 6
  const gridChunks = [];
  const gridSize = 6;
  if (block.books) {
    for (let i = 0; i < block.books.length; i += gridSize) {
      gridChunks.push(block.books.slice(i, i + gridSize));
    }
  }

  // Use useMemo to stabilize the random selection
  const randomBigBooks = React.useMemo(() => {
    if (!block.books || block.books.length === 0) return [];
    // Create a copy to sort/shuffle
    const shuffled = [...block.books].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }, [block.books]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 bg-white border border-gray-100 p-4 md:p-6 rounded-3xl min-h-[500px] shadow-sm">
      {/* LEFT SWIPER: Big Feature Highlight (Shows 2 random books) */}
      <div className="w-full xl:w-[35%] flex-shrink-0 min-w-0">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          pagination={{ clickable: true, dynamicBullets: true }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          className="h-full rounded-2xl"
        >
          {randomBigBooks.map((book: PromotingBook, index: number) => {
             // Fallback image handling
             const bigImgSource = book?.img;
             const bigImageUrl = bigImgSource
               ? (typeof bigImgSource === 'string' && bigImgSource.startsWith('https')
                 ? bigImgSource
                 : `https://img.enjoybook.co/img/book/tn/${bigImgSource}`)
               : "/images/ejb.png";

            return (
              <SwiperSlide key={book.book_id} className="h-full">
                <Link href={`/book/${book.book_id}`} className="group block h-full">
                  <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-6 pb-12 h-full flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-md border border-red-100 min-h-[450px]">
                    {/* Decorative Background Blob */}
                    <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-red-100 rounded-full blur-3xl opacity-50"></div>
                    
                    <div className="relative w-[180px] md:w-[220px] aspect-[2/3] mb-6 shadow-xl rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300 z-10">
                      <Image
                        src={bigImageUrl}
                        alt={book.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-0 left-0 bg-red-600 text-white px-3 py-1 rounded-br-lg font-bold shadow-md">
                        แนะนำสำหรับคุณ
                      </div>
                    </div>
                    
                    <h3 className="relative z-10 text-xl md:text-2xl font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-red-600 transition-colors">
                      {book.name}
                    </h3>
                    {book.title && (
                        <p className="relative z-10 text-md text-gray-600 mb-2 font-medium line-clamp-4">
                            {book.title}
                        </p>
                    )}
                    <p className="relative z-10 text-gray-500 text-base mb-4 font-medium">
                      {book.writer_name}
                    </p>
                    
                    <div className="relative z-10 mt-auto pt-4 border-t border-red-100 w-full">
                       <span className="inline-block px-8 py-2 bg-red-600 text-white text-sm rounded-full font-medium shadow-red-200 shadow-lg group-hover:bg-red-700 transition-colors">
                          อ่านเลย
                       </span>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* RIGHT SWIPER: Grid Pages (Shows 6 books per page) */}
      <div className="w-full xl:w-[65%] min-w-0">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          pagination={{ clickable: true }}
          className="h-full pb-10"
        >
          {gridChunks.map((chunk, index) => (
            <SwiperSlide key={index}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 px-4 py-2">
                {chunk.map((book) => (
                  <div key={book.book_id} className="flex justify-center transform hover:-translate-y-1 transition-transform duration-300">
                    <CardBook book={book} />
                  </div>
                ))}
                {/* Fill empty slots */}
                {Array.from({ length: 6 - chunk.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="hidden md:block"></div>
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

function PromotionDetail() {
  const params = useParams();
  const id = params?.id as string;

  const { data: promotionData, isLoading } = useQuery({
    queryKey: ['promotingGroupDetail', id],
    queryFn: () => fetchPromotingGroupDetail(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!promotionData) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-500 text-lg">ไม่พบข้อมูลโปรโมชั่น</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20">
      {/* Main Banner */}
      {promotionData.banner && (
        <div className="relative w-full max-w-6xl mx-auto h-[200px] md:h-[300px] lg:h-[400px] rounded-2xl overflow-hidden mt-6 shadow-sm">
          <Image
            src={promotionData.banner}
            alt={promotionData.name}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto px-4 mt-8 space-y-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-primary text-gray-900 mb-2">{promotionData.name}</h1>
          <div className="h-1 w-20 bg-red-600 mx-auto rounded-full"></div>
        </div>

        {/* Blocks */}
        {promotionData.blocks?.map((block) => (
          <div key={block.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {/* Block Banner */}
            {block.banner && (
              <div className="relative w-full h-[150px] md:h-[200px] lg:h-[250px] mb-6 rounded-xl overflow-hidden">
                <Image
                  src={block.banner}
                  alt={`Block Banner ${block.id}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* See All Button */}
            {block.has_more && (
              <div className="flex justify-end mb-4 px-2">
                <Link
                  href={`/promotion/${id}/block/${block.id}`}
                  className="px-6 py-1.5 bg-white border border-red-600 text-red-600 rounded-full font-primary hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md text-sm"
                >
                  ดูทั้งหมด
                </Link>
              </div>
            )}

            {/* Content Logic based on Block Type */}
            {block.type === 'B' ? (
              <PromotionBlockTypeB block={block} />
            ) : block.type === 'C' ? (
              // TYPE C: Horizontal Scroll (Native) with larger branding or style
              <div className="bg-gradient-to-r from-red-50 to-white p-4 rounded-xl">
                 <div className="flex overflow-x-auto pb-4 gap-4 md:gap-6 snap-x scrollbar-hide">
                    {block.books?.map((book: PromotingBook) => (
                      <div key={book.book_id} className="snap-center flex-shrink-0 w-[160px] md:w-[180px]">
                        <CardBook book={book} />
                      </div>
                    ))}
                 </div>
              </div>
            ) : (
              // TYPE A (Default): Grid
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 justify-items-center">
                {block.books?.map((book: PromotingBook) => (
                  <CardBook key={book.book_id} book={book} />
                ))}
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}

export default PromotionDetail;