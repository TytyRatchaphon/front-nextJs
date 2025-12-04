"use client";

import React from 'react';
import DailyPopup from "@/components/DailyPopup";
import { BackToTopButton } from "@/components/BackToTopButton";
import Link from "next/link";
import Banner from "@/components/home/Banner";
import Image from "next/image";
import { fetchHomeData, HomeDataResponse } from "@/services/apiServices";
import BookGroups from "@/components/home/BookGroups";
import TopRanking from "@/components/home/TopRanking";
import { useQuery } from "@tanstack/react-query";

interface HomeContentProps {
  initialData: HomeDataResponse | null;
}

export default function HomeContent({ initialData }: HomeContentProps) {
  const { data: homeData } = useQuery({
    queryKey: ['homeData'],
    queryFn: fetchHomeData,
    initialData: initialData,
  });

  const slides = homeData?.data?.slides || [];
  const groupBookHome = (homeData?.data as any)?.groupBookHome || [];
  const rankingGroup = groupBookHome.find((group: any) => group.type === 'ranking');

  return (
    <div className="bg-white font-primary font-medium flex flex-col items-center transition-colors duration-300">
      <Banner slides={slides} />
      {/* Main Content Section */}
      <div className="w-full flex justify-center mt-4 lg:mt-32">
        <div className="max-w-[1440px] w-full px-4 lg:px-[156px]">
          
          {/* Spotlight & New Novels Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-8">
            {/* Spotlight Column */}
            <div className="w-full h-auto">
              <h2 className="font-bold text-2xl mb-2 text-black">Spotlight</h2>
              <div className="w-full h-[1px] bg-gray-200 mb-4"></div>
              <div className="grid grid-cols-3 gap-2 lg:gap-4">
                {[...Array(6)].map((_, i) => (
                <Link href="#" key={i} className="w-full">
                  <div key={i} className="flex flex-col w-full h-auto group">
                    <div className="relative shadow-md rounded-lg overflow-hidden bg-white aspect-[168/237]">
                      <Image 
                        src="/images/ejb.png"
                        alt="ENJOY BOOK"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-black text-lg font-medium truncate group-hover:text-red-600 transition-colors duration-300">หนังสือเล่มใหม่</p>
                      <div className="flex items-center gap-4 text-sm mt-1">
                        <div className="hidden lg:flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>1k</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>10k</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span>10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                ))}
              </div>
            </div>

            {/* New Novels Column */}
            <div>
              <h2 className="font-bold text-2xl mb-2 text-black">นิยายมาใหม่</h2>
              <div className="w-full h-[1px] bg-gray-200 mb-4"></div>
              <div className="flex flex-col gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-[91px] h-[128px] rounded overflow-hidden flex-shrink-0">
                      <Image 
                        src="/images/ejb.png"
                        alt="ENJOY BOOK"
                        className="w-full h-full object-cover"
                        width={91}
                        height={128}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black">หนังสือเล่มใหม่</h3>
                      <p className="text-sm text-gray-600">ดูแล้ว</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>1k</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>10k</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span>10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Other Groups Section */}
          <BookGroups groupBookHome={groupBookHome} />

          {/* Top 10 Ranking Section */}
          <div className="w-full ">
            <TopRanking rankingGroup={rankingGroup} />
          </div>
           <BackToTopButton />         
          <DailyPopup />
        </div>
      </div>
    </div>
  );
}
