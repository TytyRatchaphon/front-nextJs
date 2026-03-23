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
          // pagination={{ clickable: true, dynamicBullets: true }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          className="h-full rounded-2xl"
        >
          {randomBigBooks.map((book: PromotingBook) => {
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
          // pagination={{ clickable: true }}
          className="h-full pb-14"
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

const PromotionBlockTypeC = ({ block }: { block: PromotingBlock }) => {
  return (
    <div className="w-full">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 2 },
        }}
        // pagination={{ clickable: true }}
        className="pb-14"
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
      >
        {block.books?.map((book: PromotingBook) => (
          <SwiperSlide key={book.book_id}>
            <Link href={`/book/${book.book_id}`}>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex gap-4 h-[220px]">
                {/* Book Cover */}
                <div className="relative w-[140px] flex-shrink-0 h-full rounded-lg overflow-hidden shadow-sm">
                   <Image
                      src={book.img.startsWith('http') ? book.img : `https://img.enjoybook.co/img/book/tn/${book.img}`}
                      alt={book.name}
                      fill
                      className="object-cover"
                   />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col min-w-0">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1 mb-1" title={book.name}>
                        {book.name}
                    </h3>
                    
                    {/* Tags / Category (Mocking or using simplified tag data) */}
                    <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-1">
                        {book.tag?.slice(0, 2).map((t, i) => (
                            <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-[10px]">{t}</span>
                        ))}
                    </div>

                    {/* Description (Title in API) */}
                    <div className="text-sm text-gray-600 line-clamp-3 mb-auto leading-relaxed">
                        {book.title || "ไม่มีคำโปรย..."}
                    </div>

                    {/* Stats Footer */}
                    <div className="flex items-center gap-4 text-gray-400 text-xs mt-3 pt-3 border-t border-gray-50">
                        {/* Views */}
                        <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{book.view > 1000 ? `${(book.view / 1000).toFixed(1)}K` : book.view}</span>
                        </div>
                        
                        {/* Chapters */}
                        <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span>{book.chapter}</span>
                        </div>
                    </div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

const PromotionBlockTypeA = ({ block }: { block: PromotingBlock }) => {
  return (
    <div className="w-full">
      <Swiper
        modules={[Navigation, Pagination, FreeMode]}
        spaceBetween={10}
        slidesPerView="auto"
        freeMode={true}
        // pagination={{ clickable: true, dynamicBullets: true }}
        className="pb-14"
      >
        {block.books?.map((book: PromotingBook) => (
          <SwiperSlide key={book.book_id} className="!w-auto">
             <div className="transform hover:-translate-y-1 transition-transform duration-300">
                <CardBook book={book} />
             </div>
          </SwiperSlide>
        ))}
      </Swiper>
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
        <div className="relative w-full max-w-[1152px] mx-auto mt-6 rounded-2xl overflow-hidden shadow-sm h-[200px] md:h-[400px]">
          <Image
            src={promotionData.banner}
            alt={promotionData.name}
            fill
            sizes="100vw"
            className="object-fill"
          />
        </div>
      )}

      <div className="w-full max-w-[1070px] mx-auto mt-8 space-y-12">
        <div className="text-center mb-8 px-4">
          <h1 className="text-3xl md:text-4xl font-bold font-primary text-gray-900 mb-2">{promotionData.name}</h1>
          <div className="h-1 w-20 bg-red-600 mx-auto rounded-full"></div>
        </div>

        {/* Blocks */}
        {promotionData.blocks?.map((block) => (
          <div key={block.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Block Banner */}
            {block.banner && (
              <div className="relative w-full mb-0 h-[150px] md:h-[250px]">
                <Image
                  src={block.banner}
                  alt={`Block Banner ${block.id}`}
                  fill
                  sizes="100vw"
                  className="object-fill"
                />
              </div>
            )}

            <div className="p-4 md:p-6">
            {/* Block Header: Name & See All */}
            {(block.block_name || block.has_more) && (
              <div className="flex justify-between items-center mb-4 px-2">
                 {block.block_name ? (
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 border-l-4 border-red-600 pl-3">
                        {block.block_name}
                    </h2>
                 ) : (
                    <div></div> 
                 )}

                 {block.has_more && (
                    <Link
                      href={`/promotion/${id}/block/${block.id}`}
                      className="px-6 py-1.5 bg-white border border-red-600 text-red-600 rounded-full font-primary hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md text-sm"
                    >
                      ดูทั้งหมด
                    </Link>
                 )}
              </div>
            )}

            {/* Content Logic based on Block Type */}
            {block.type === 'B' ? (
              <PromotionBlockTypeB block={block} />
            ) : block.type === 'C' ? (
              <PromotionBlockTypeC block={block} />
            ) : (
// TYPE A (Default): Swiper
              <PromotionBlockTypeA block={block} />
            )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PromotionDetail;
