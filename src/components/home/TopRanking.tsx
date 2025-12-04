"use client";

import React from 'react';
import Link from "next/link";
import Image from "next/image";

interface TopRankingProps {
  rankingGroup: any;
}

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
}

const getImageUrl = (img?: string) => {
  return img
    ? (typeof img === 'string' && img.startsWith('https')
        ? img
        : `https://img.enjoybook.co/img/book/tn/${img}`)
    : "/images/ejb.png";
};

export default function TopRanking({ rankingGroup }: TopRankingProps) {
  const rankingList = rankingGroup?.list || [];

  return (
    <div className="w-full mt-12 mb-24">
      <div className="text-left mb-4">
        {rankingGroup?.name_web ? (
          <h2 
            className="text-xl font-normal text-black"
            dangerouslySetInnerHTML={{ __html: rankingGroup.name_web }}
          />
        ) : (
          <h2 className="text-xl font-normal text-black">Top 10</h2>
        )}
      </div>
      
      <div className="relative w-[1227px] h-[575px] mx-auto mb-24">
        {/* Background Image */}
        <Image 
          src="/images/black-board.png"
          alt="Black Board"
          className="absolute inset-0 w-full h-full object-fill overflow-visible"
          width={1227}
          height={575}
        />
        
        {/* Top 3 Podium Area - New structure based on old website */}
        <div className="absolute left-12 -bottom-8 z-30">
          <div className="relative">
            {/* Podium base image */}
            <Image 
              src="/images/podium.png"
              alt="Podium"
              className="w-full h-auto"
              width={600}
              height={200}
            />
            
            {/* Three cards grid positioned above podium */}
            <div className="absolute -top-68 left-0 right-0 grid grid-cols-3 gap-4 px-4">
              {/* Rank 2 - Left (Index 8) */}
              <div className="flex justify-start items-start w-full mt-16">
                <div className="flex flex-col justify-center items-center gap-2 w-full">
                  <Link href={rankingList[1] ? `/book/${rankingList[1].book_id}` : '#'} target="_blank">
                  <div className="w-[95px] h-[133px] flex items-center justify-center rounded-lg shadow-md cursor-pointer relative border-4 border-[#d8d8c8] overflow-hidden mx-auto transition-transform duration-300 hover:scale-110">
                    {rankingList[1] ? (
                      <Image 
                        src={getImageUrl(rankingList[1].img || rankingList[1].img_full)}
                        alt={rankingList[1].name}
                        className="w-full h-full object-cover"
                        width={95} 
                        height={133}
                        loader={imageLoader}
                        
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  </Link>
                  {/* Read button */}
                  <Link href={rankingList[1] ? `/book/${rankingList[1].book_id}` : '#'} target="_blank">
                  <button className="bg-red-600 rounded hover:bg-red-700 transition-colors w-[70px] h-[32px] mx-auto mt-4 flex items-center justify-center">
                    <span className="text-gray-200 text-sm">
                      อ่านนิยาย
                    </span>
                  </button>
                  </Link>
                </div>
              </div>

              {/* Rank 1 - Center (Index 9) */}
              <div className="flex justify-start items-start w-full mt-0">
                <div className="flex flex-col justify-center items-center gap-2 w-full">
                  <Link href={rankingList[0] ? `/book/${rankingList[0].book_id}` : '#'} target="_blank">
                  <div className="w-[117px] h-[163px] flex items-center justify-center rounded-lg shadow-md cursor-pointer relative border-4 border-amber-300 overflow-hidden mx-auto transition-transform duration-300 hover:scale-110">
                    {rankingList[0] ? (
                      <Image 
                        src={getImageUrl(rankingList[0].img || rankingList[0].img_full)}
                        alt={rankingList[0].name}
                        className="w-full h-full object-cover"
                        width={117}
                        height={163}
                        loader={imageLoader}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  </Link>
                  {/* Read button */}
                  <Link href={rankingList[0] ? `/book/${rankingList[0].book_id}` : '#'} target="_blank">
                  <button className="bg-red-600 rounded hover:bg-red-700 transition-colors w-[70px] h-[32px] mx-auto mt-6 flex items-center justify-center">
                    <span className="text-gray-200 text-sm">
                      อ่านนิยาย
                    </span>
                  </button>
                  </Link>
                </div>
              </div>

              {/* Rank 3 - Right (Index 7) */}
              <div className="flex justify-start items-start w-full mt-32">
                <div className="flex flex-col justify-center items-center gap-2 w-full">
                  <Link href={rankingList[2] ? `/book/${rankingList[2].book_id}` : '#'} target="_blank">
                  <div className="w-[97px] h-[135px] flex items-center justify-center rounded-lg shadow-md cursor-pointer relative border-4 border-[#e8ad74] overflow-hidden mx-auto transition-transform duration-300 hover:scale-110">
                    {rankingList[2] ? (
                      <Image 
                        src={getImageUrl(rankingList[2].img || rankingList[2].img_full)}
                        alt={rankingList[2].name}
                        className="w-full h-full object-cover"
                        width={97}
                        height={135}
                        loader={imageLoader}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  </Link>
                  {/* Read button */}
                  <Link href={rankingList[2] ? `/book/${rankingList[2].book_id}` : '#'} target="_blank">
                  <button className="bg-red-600 rounded hover:bg-red-700 transition-colors w-[70px] h-[32px] mx-auto mt-4 flex items-center justify-center">
                    <span className="text-gray-200 text-sm">
                      อ่านนิยาย
                    </span>
                  </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ranks 4-10 - Right side in 2 rows */}
        <div className="absolute top-42 right-16 z-10">
          {/* Top row: Ranks 4-7 (Indices 6, 5, 4, 3) */}
          <div className="flex gap-14 mb-16">
            {[3, 4, 5, 6].map((index, i) => {
              const rank = i + 4;
              const item = rankingList[index];
              return (
              <Link href={item ? `/book/${item.book_id}` : '#'} key={rank} target="_blank">
              <div className="relative w-[86px] h-[122px]  bg-white overflow-visible cursor-pointer hover:scale-105 transition-transform">
                {item ? (
                  <Image 
                    src={getImageUrl(item.img || item.img_full)}
                    alt={item.name}
                    className="w-full h-full object-cover "
                    width={86}
                    height={122}
                    loader={imageLoader}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
                <Image 
                  src={`/images/${rank}.png`}
                  alt={`${rank}`}
                  className="absolute -bottom-2 -right-2 w-[29px] h-[30px]"
                  width={29}
                  height={30}
                  loader={imageLoader}
                />
              </div>
              </Link>
            )})}
          </div>
          
          {/* Bottom row: Ranks 8-10 (Indices 2, 1, 0) */}
          <div className="flex gap-14 ml-16">
            {[7, 8, 9].map((index, i) => {
              const rank = i + 8;
              const item = rankingList[index];
              return (
              <Link href={item ? `/book/${item.book_id}` : '#'} key={rank} target="_blank">
              <div className="relative w-[85px] h-[120px] rounded shadow-lg bg-white overflow-visible cursor-pointer hover:scale-105 transition-transform">
                {item ? (
                  <Image 
                    src={getImageUrl(item.img_full || item.img)}
                    alt={item.name}
                    className="w-full h-full object-cover rounded"
                    width={85}
                    height={120}
                    loader={imageLoader}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
                <Image 
                  src={`/images/${rank}.png`}
                  alt={`${rank}`}
                  className={`absolute -bottom-2 -right-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${rank === 10 ? 'w-[58px] h-[30px]' : 'w-[29px] h-[30px]'}`}
                  width={rank === 10 ? 58 : 29}
                  height={30}
                  loader={imageLoader}
                />
              </div>
              </Link>
            )})}
          </div>
          
          {/* Chalk slot underneath ranks 4-10 */}
          <Image 
            src="/images/chalk-slot.png"
            alt="Chalk Slot"
            className="absolute -bottom-30 left-0 z-20 w-[600px] h-[61px]"
            width={600}
            height={61}
            loader={imageLoader}
          />
        </div>
        {/* Bottom orange/gold bar */}
      </div>
    </div>
  );
}
