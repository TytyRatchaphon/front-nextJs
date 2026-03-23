"use client";

import React from 'react';
import Link from "next/link";
import Image from "next/image";
import { useWebsiteStore } from '@/stores/websiteStore';
import { Eye, Crown, Heart, List } from 'lucide-react';
import BookSwiper from './BookSwiper';
import { imageLoader } from '@/utils/imageUtils';

interface TopRankingProps {
  rankingGroup: any;
}


const getImageUrl = (img?: string) => {
  return img
    ? (typeof img === 'string' && img.startsWith('https')
      ? img
      : `https://img.enjoybook.co/img/book/tn/${img}`)
    : "/images/ejb.png";
};

const formatViewCount = (width: number) => {
  if (width >= 1000000) {
    return (width / 1000000).toFixed(1) + 'M';
  } else if (width >= 1000) {
    return (width / 1000).toFixed(1) + 'k';
  } else {
    return width.toString();
  }
};

export default function TopRanking({ rankingGroup }: TopRankingProps) {

  const { settings } = useWebsiteStore();
  const rankingList = Array.isArray(rankingGroup?.list) ? rankingGroup.list : [];

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 mt-4 mb-4">
      {/* Title */}
      <div className="flex justify-between items-center mb-22 lg:mb-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl lg:text-2xl font-bold text-black">
            {rankingGroup?.name_web ? (
              <span dangerouslySetInnerHTML={{ __html: rankingGroup.name_web }} />
            ) : (
              "อันดับ 1-10 สุดยอด"
            )}
          </h2>
        </div>
        <Link href="/ranking" className="text-gray-500 hover:text-red-500 text-sm font-medium flex items-center gap-1">
          ดูทั้งหมด <span className="text-lg">›</span>
        </Link>
      </div>

      {/* Mobile Layout - Podium */}
      <div className="block lg:hidden relative w-full mb-10 px-2">
        <div className="relative h-[400px] flex justify-center items-end">
          {/* Podium Image Base */}
          <div className="absolute bottom-[-50px] z-10 w-[360px]">
            <Image
              src={settings?.chartpng || '/images/podium.png'}
              alt="Podium"
              width={360}
              height={200}
              className="w-full h-auto object-contain"
              unoptimized
            />
          </div>

          {/* Rank 2 (Left) */}
          <div className="absolute bottom-[140px] left-[calc(50%-170px)] z-20 flex flex-col items-center w-[100px]">
            <Link href={rankingList[1] ? `/book/${rankingList[1].book_id}` : '#'} className="relative flex flex-col items-center transform transition-all duration-300 ease-in-out hover:scale-105">
              <div className="relative w-[100px] h-[150px] rounded-lg overflow-hidden border-2 border-[#C0C0C0] shadow-lg">
                {rankingList[1] ? (
                  <Image
                    src={getImageUrl(rankingList[1].img || rankingList[1].img_full)}
                    alt={rankingList[1].name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : <div className="w-full h-full bg-gray-200" />}
              </div>
              <div className="w-[24px] h-[24px] mt-[-12px] transform rotate-45 rounded-lg bg-[#C0C0C0] relative z-10 shadow-md border-2 border-white flex items-center justify-center">
                <div className="transform -rotate-45 text-white font-bold text-sm">2</div>
              </div>
            </Link>
            <div className="mt-2 text-center w-full">
              <h3 className="font-bold text-xs truncate w-full text-black">{rankingList[1]?.name || "-"}</h3>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-[10px] mt-1">
                <Eye size={10} />
                <span>{formatViewCount(rankingList[1]?.view || 0)}</span>
              </div>
              <Link href={rankingList[1] ? `/book/${rankingList[1].book_id}` : '#'} className="mt-1 flex justify-center w-full">
                <button className="bg-[#E60000] hover:bg-red-700 !text-white text-[10px] px-3 py-1 rounded-full transition-colors duration-300 w-auto shadow-sm min-w-[60px]">
                  อ่าน
                </button>
              </Link>
            </div>
          </div>

          {/* Rank 1 (Center) */}
          <div className="absolute bottom-[180px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center w-[120px]">
            <Link href={rankingList[0] ? `/book/${rankingList[0].book_id}` : '#'} className="relative flex flex-col items-center transform transition-all duration-300 ease-in-out hover:scale-110">
              {/* Crown Icon */}
              <div className="mb-1 animate-bounce-slow">
                <Image src="/images/crown.png" alt="Crown" width={30} height={30} className="w-8 h-8 object-contain" unoptimized />
              </div>
              <div className="relative w-[120px] h-[180px] rounded-lg overflow-hidden border-4 border-[#f3ad3d] shadow-xl">
                {rankingList[0] ? (
                  <Image
                    src={getImageUrl(rankingList[0].img || rankingList[0].img_full)}
                    alt={rankingList[0].name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : <div className="w-full h-full bg-gray-200" />}
              </div>
              <div className="w-[28px] h-[28px] mt-[-14px] transform rotate-45 rounded-lg bg-[#f3ad3d] relative z-10 shadow-md border-2 border-white flex items-center justify-center">
                <div className="transform -rotate-45 text-white font-bold text-base">1</div>
              </div>
            </Link>
            <div className="mt-3 text-center w-full">
              <h3 className="font-bold text-sm truncate w-full text-black">{rankingList[0]?.name || "-"}</h3>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mt-1">
                <Eye size={12} />
                <span>{formatViewCount(rankingList[0]?.view || 0)}</span>
              </div>
              <Link href={rankingList[0] ? `/book/${rankingList[0].book_id}` : '#'} className="mt-2 flex justify-center w-full">
                <button className="bg-[#E60000] hover:bg-red-700 !text-white text-xs px-4 py-1.5 rounded-full transition-colors duration-300 w-auto shadow-lg min-w-[70px]">
                  อ่าน
                </button>
              </Link>
            </div>
          </div>

          {/* Rank 3 (Right) */}
          <div className="absolute bottom-[115px] right-[calc(50%-170px)] z-20 flex flex-col items-center w-[100px]">
            <Link href={rankingList[2] ? `/book/${rankingList[2].book_id}` : '#'} className="relative flex flex-col items-center transform transition-all duration-300 ease-in-out hover:scale-105">
              <div className="relative w-[100px] h-[150px] rounded-lg overflow-hidden border-2 border-[#CD7F32] shadow-lg">
                {rankingList[2] ? (
                  <Image
                    src={getImageUrl(rankingList[2].img || rankingList[2].img_full)}
                    alt={rankingList[2].name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : <div className="w-full h-full bg-gray-200" />}
              </div>
              <div className="w-[24px] h-[24px] mt-[-12px] transform rotate-45 rounded-lg bg-[#CD7F32] relative z-10 shadow-md border-2 border-white flex items-center justify-center">
                <div className="transform -rotate-45 text-white font-bold text-sm">3</div>
              </div>
            </Link>
            <div className="mt-2 text-center w-full">
              <h3 className="font-bold text-xs truncate w-full text-black">{rankingList[2]?.name || "-"}</h3>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-[10px] mt-1">
                <Eye size={10} />
                <span>{formatViewCount(rankingList[2]?.view || 0)}</span>
              </div>
              <Link href={rankingList[2] ? `/book/${rankingList[2].book_id}` : '#'} className="mt-1 flex justify-center w-full">
                <button className="bg-[#E60000] hover:bg-red-700 !text-white text-[10px] px-3 py-1 rounded-full transition-colors duration-300 w-auto shadow-sm min-w-[60px]">
                  อ่าน
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Podium */}
      <div className="hidden lg:block relative w-full mb-50">
        {/* Podium Container */}
        <div className="relative h-[640px] flex justify-center items-end">
      
          {/* Podium Image Base */}
          <div className="absolute bottom-[-140px] z-10 w-[574px]">
            <Image
              src={settings?.chartpng || '/images/podium.png'}
              alt="Podium"
              width={574}
              height={342}
              className="w-full h-auto object-contain"
              unoptimized
            />
          </div>


          {/* Rank 2 (Left) */}
          <div className="absolute bottom-[140px] left-[calc(50%-265px)] z-20 flex flex-col items-center w-[150px]">
            <Link href={rankingList[1] ? `/book/${rankingList[1].book_id}` : '#'} className="relative flex flex-col items-center transform transition-all duration-300 ease-in-out hover:scale-105">
              <div className="relative w-[150px] h-[220px] rounded-lg overflow-hidden border-4 border-[#C0C0C0] shadow-lg">
                {rankingList[1] ? (
                  <Image
                    src={getImageUrl(rankingList[1].img || rankingList[1].img_full)}
                    alt={rankingList[1].name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : <div className="w-full h-full bg-gray-200" />}
              </div>
              <div className="w-[30px] h-[30px] mt-[-15px] transform rotate-45 rounded-lg bg-[#C0C0C0] relative z-10 shadow-md border-2 border-white flex items-center justify-center">
                <div className="transform -rotate-45 text-white font-bold text-lg">2</div>
              </div>
            </Link>
            <div className="mt-4 text-center w-full">
              <h3 className="font-bold text-lg truncate w-full text-black">{rankingList[1]?.name || "-"}</h3>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-1">
                <Eye size={14} />
                <span>{formatViewCount(rankingList[1]?.view || 0)}</span>
              </div>
              <Link href={rankingList[1] ? `/book/${rankingList[1].book_id}` : '#'} className="mt-2 flex justify-center w-full">
                <button className="bg-[#E60000] hover:bg-red-700 !text-white text-sm px-6 py-1.5 rounded-full transition-colors duration-300 w-auto shadow-sm min-w-[100px]">
                  อ่านนิยาย
                </button>
              </Link>
            </div>
          </div>

          {/* Rank 1 (Center) */}
          <div className="absolute bottom-[220px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center w-[150px]">
            <Link href={rankingList[0] ? `/book/${rankingList[0].book_id}` : '#'} className="relative flex flex-col items-center transform transition-all duration-300 ease-in-out hover:scale-110">
              {/* Crown Icon */}
              <div className="mb-2 animate-bounce-slow">
                <Image src="/images/crown.png" alt="Crown" width={40} height={40} className="w-10 h-10 object-contain" unoptimized />
              </div>
              <div className="relative w-[150px] h-[220px] rounded-lg overflow-hidden border-4 border-[#f3ad3d] shadow-xl">
                {rankingList[0] ? (
                  <Image
                    src={getImageUrl(rankingList[0].img || rankingList[0].img_full)}
                    alt={rankingList[0].name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : <div className="w-full h-full bg-gray-200" />}
              </div>
              <div className="w-[30px] h-[30px] mt-[-15px] transform rotate-45 rounded-lg bg-[#f3ad3d] relative z-10 shadow-md border-2 border-white flex items-center justify-center">
                <div className="transform -rotate-45 text-white font-bold text-xl">1</div>
              </div>
            </Link>
            <div className="mt-5 text-center w-full">
              <h3 className="font-bold text-xl truncate w-full text-black">{rankingList[0]?.name || "-"}</h3>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-1">
                <Eye size={16} />
                <span>{formatViewCount(rankingList[0]?.view || 0)}</span>
              </div>
              <Link href={rankingList[0] ? `/book/${rankingList[0].book_id}` : '#'} className="mt-3 flex justify-center w-full">
                <button className="bg-[#E60000] hover:bg-red-700 !text-white text-sm px-6 py-1.5 rounded-full transition-colors duration-300 w-auto shadow-lg min-w-[100px]">
                  อ่านนิยาย
                </button>
              </Link>
            </div>
          </div>

          {/* Rank 3 (Right) */}
          <div className="absolute bottom-[100px] right-[calc(50%-265px)] z-20 flex flex-col items-center w-[150px]">
            <Link href={rankingList[2] ? `/book/${rankingList[2].book_id}` : '#'} className="relative flex flex-col items-center transform transition-all duration-300 ease-in-out hover:scale-105">
              <div className="relative w-[150px] h-[220px] rounded-lg overflow-hidden border-4 border-[#CD7F32] shadow-lg">
                {rankingList[2] ? (
                  <Image
                    src={getImageUrl(rankingList[2].img || rankingList[2].img_full)}
                    alt={rankingList[2].name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : <div className="w-full h-full bg-gray-200" />}
              </div>
              <div className="w-[30px] h-[30px] mt-[-15px] transform rotate-45 rounded-lg bg-[#CD7F32] relative z-10 shadow-md border-2 border-white flex items-center justify-center">
                <div className="transform -rotate-45 text-white font-bold text-lg">3</div>
              </div>
            </Link>
            <div className="mt-4 text-center w-full">
              <h3 className="font-bold text-lg truncate w-full text-black">{rankingList[2]?.name || "-"}</h3>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-1">
                <Eye size={14} />
                <span>{formatViewCount(rankingList[2]?.view || 0)}</span>
              </div>
              <Link href={rankingList[2] ? `/book/${rankingList[2].book_id}` : '#'} className="mt-2 flex justify-center w-full">
                <button className="bg-[#E60000] hover:bg-red-700 !text-white text-sm px-6 py-1.5 rounded-full transition-colors duration-300 w-auto shadow-sm min-w-[100px]">
                  อ่านนิยาย
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Ranks 4-10 List (Desktop Grid / Mobile Swiper) */}
      <div className="hidden lg:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 lg:gap-6">
        {rankingList.map((item: any, index: number) => {
          if (index >= 10) return null; // Limit to Top 10

          const rank = index + 1;
          const isTop3 = index < 3;
          // Hide Top 3 on Desktop (as they are in podium), show on Mobile
          const visibilityClass = isTop3 ? 'lg:hidden' : '';

          return (
            <div key={item.book_id || index} className={`flex flex-col gap-2 ${visibilityClass}`}>
            <Link href={`/book/${item.book_id}`} prefetch={false} className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <Image
                  src={getImageUrl(item.img || item.img_full)}
                  alt={item.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
                {/* Rank Badge */}
                <div className="absolute bottom-1 right-1 w-[30px] h-[30px] transform rotate-45 rounded-lg bg-[#E60000] shadow-md border-2 border-white flex items-center justify-center z-10">
                  <div className="transform -rotate-45 text-white font-bold text-lg">{rank}</div>
                </div>
              </Link>
              <div className="text-left">
                <h4 className="font-bold text-black text-sm line-clamp-1" title={item.name}>{item.name}</h4>
                <p className="text-gray-500 text-xs line-clamp-1">{item.writer_name || "Unknown"}</p>
                <div className="flex items-center gap-3 text-gray-400 text-xs mt-1">
                  <div className="flex items-center gap-1">
                    <Eye size={12} />
                    <span>{formatViewCount(item.view || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart size={12} />
                    <span>{formatViewCount(item.shelve_count || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <List size={12} />
                    <span>{formatViewCount(item.chapter || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile Swiper for 4-10 */}
      <div className="block lg:hidden mt-6">
        <BookSwiper books={rankingList.slice(3, 10).map((book: any, index: number) => ({ ...book, rank: index + 4 }))} />
      </div>

    </div>
  );
}
