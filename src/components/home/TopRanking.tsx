"use client";

import React from 'react';
import Link from "next/link";
import Image from "next/image";
import { useWebsiteStore } from '@/stores/websiteStore';
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

  const { settings } = useWebsiteStore();
  const rankingList = rankingGroup?.list || [];

  return (
    <div className="w-full mt-12 mb-24">
      <div className="text-left mb-4 hidden lg:block">
        {rankingGroup?.name_web ? (
          <h2 
            className="text-xl font-normal text-black"
            dangerouslySetInnerHTML={{ __html: rankingGroup.name_web }}
          />
        ) : (
          <h2 className="text-xl font-normal text-black">Top 10</h2>
        )}
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden lg:block relative w-[1227px] h-[575px] mx-auto mb-24">
        {/* Background Image */}
        <Image 
          src="/images/black-board.png"
          alt="Black Board"
          className="absolute inset-0 w-full h-full object-fill overflow-visible"
          width={1227}
          height={575}
        />
        
        {/* Top 3 Podium Area - New structure based on old website */}
        <div className="absolute left-12 -bottom-8 z-30 w-[475px] h-[296px]"> 
          <div className="relative">
            {/* Podium base image */}
            <Image 
              src={settings?.chartpng || '/images/podium.png'}
              alt="Podium"
              className="w-full h-auto"
              width={600}
              height={200}
            />
            
            {/* Three cards grid positioned above podium */}
            <div className="absolute -top-[272px] left-0 right-0 grid grid-cols-3 gap-4 px-4">
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
        <div className="absolute top-[168px] right-16 z-10">
          {/* Top row: Ranks 4-7 (Indices 6, 5, 4, 3) */}
          <div className="flex gap-14 mb-16">
            {[3, 4, 5, 6].map((index, i) => {
              const rank = i + 4;
              const item = rankingList[index];
              return (
              <Link href={item ? `/book/${item.book_id}` : '#'} key={rank} target="_blank">
              <div className="relative w-[86px] h-[122px]  bg-white overflow-visible cursor-pointer hover:scale-105 transition-transform border-4 border-[#d8d8c8] rounded-[4px]">
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
              <div className="relative w-[85px] h-[120px] rounded-[4px] shadow-lg bg-white overflow-visible cursor-pointer hover:scale-105 transition-transform border-4 border-[#d8d8c8]">
                {item ? (
                  <Image 
                    src={getImageUrl(item.img_full || item.img)}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-[4px]"
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
            className="absolute -bottom-[120px] left-0 z-20 w-[600px] h-[61px]"
            width={600}
            height={61}
            loader={imageLoader}
          />
        </div>
        {/* Bottom orange/gold bar */}
      </div>

      {/* Mobile Layout - Top 3 Only */}
      <div className="block lg:hidden w-full relative h-[550px] sm:h-[650px] mx-auto rounded-lg bg-[#305341] mb-20">
        {/* Background */}
        <div className="absolute inset-0">
             {/* Using standard img tag to avoid Next.js Image loader issues */}
             <img 
               src="/images/res-bb.png"
               alt="Background"
               className="w-full h-full object-fill opacity-100 rounded-lg"
             />
             
             {/* Header Title: Top 3 Image */}
             <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
                 <img
                    src="/images/top3.png"
                    alt="Top 3"
                    className="w-[180px] h-auto opacity-90"
                 />
             </div>
        </div>

        {/* Podium and Books Container */}
        <div className="absolute -bottom-24 left-0 w-full h-[350px] flex justify-center items-end pb-4">
             <div className="relative w-full max-w-full sm:max-w-[80%] h-full"> 
                   {/* Podium - res-podium.png */}
                   <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full flex justify-center z-10">
                       <img 
                          src={settings?.chartpng || '/images/podium.png'}
                          alt="Podium"
                          className="w-[95%] sm:w-[80%] h-auto object-contain"
                       />
                   </div>

                   {/* Books - Absolute positioning relative to this container */}
                   {/* Rank 2 (Left) */}
                   <div className="absolute left-[5%] bottom-[235px] sm:bottom-[250px] z-20 flex flex-col items-center w-[30%]">
                        <Link href={rankingList[1] ? `/book/${rankingList[1].book_id}` : '#'} className="w-full flex flex-col items-center">
                            <div className="w-[85%] max-w-[130px] aspect-[2/3] relative rounded-md border-2 border-[#d8d8c8] shadow-md overflow-hidden bg-white transition-transform duration-300 hover:scale-110">
                                 {rankingList[1] ? (
                                    <Image 
                                      src={getImageUrl(rankingList[1].img || rankingList[1].img_full)}
                                      alt={rankingList[1].name}
                                      fill
                                      className="object-cover"
                                      loader={imageLoader}
                                    />
                                 ) : <div className="w-full h-full bg-gray-200" />}
                            </div>
                        </Link>
                   </div>

                   {/* Rank 1 (Center) */}
                   <div className="absolute left-[35%] bottom-[275px] sm:bottom-[290px] z-30 flex flex-col items-center w-[30%]">
                        <Link href={rankingList[0] ? `/book/${rankingList[0].book_id}` : '#'} className="w-full flex flex-col items-center">
                            <div className="w-[95%] max-w-[160px] aspect-[2/3] relative rounded-md border-2 border-amber-300 shadow-lg overflow-hidden bg-white scale-110 transition-transform duration-300 hover:scale-125">
                                 {rankingList[0] ? (
                                    <Image 
                                      src={getImageUrl(rankingList[0].img || rankingList[0].img_full)}
                                      alt={rankingList[0].name}
                                      fill
                                      className="object-cover"
                                      loader={imageLoader}
                                    />
                                 ) : <div className="w-full h-full bg-gray-200" />}
                            </div>
                        </Link>
                   </div>

                   {/* Rank 3 (Right) */}
                   <div className="absolute right-[5%] bottom-[215px] sm:bottom-[230px] z-20 flex flex-col items-center w-[30%]">
                        <Link href={rankingList[2] ? `/book/${rankingList[2].book_id}` : '#'} className="w-full flex flex-col items-center">
                             <div className="w-[85%] max-w-[130px] aspect-[2/3] relative rounded-md border-2 border-[#e8ad74] shadow-md overflow-hidden bg-white transition-transform duration-300 hover:scale-110">
                                 {rankingList[2] ? (
                                    <Image 
                                      src={getImageUrl(rankingList[2].img || rankingList[2].img_full)}
                                      alt={rankingList[2].name}
                                      fill
                                      className="object-cover"
                                      loader={imageLoader}
                                    />
                                 ) : <div className="w-full h-full bg-gray-200" />}
                            </div>
                        </Link>
                   </div>
             </div>
        </div>

      </div>

    </div>
  );
}
