import React, { useState } from 'react';
import { useStoryBar } from '../hooks/useStoryBar';
import { useStoryStore } from '../stores/storyStore';
import StoryCard from './StoryCard';
import StoryCardSkeleton from './StoryCardSkeleton';
import StoryUploader from './StoryUploader';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/free-mode';

const StoryBar = () => {
  const { groups, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useStoryBar();
  const openViewer = useStoryStore((state) => state.openViewer);
  
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const scrollLeft = () => {
    if (swiper) swiper.slidePrev();
  };

  const scrollRight = () => {
    if (swiper) swiper.slideNext();
  };

  const handleSwiper = (swiperInstance: SwiperType) => {
    setSwiper(swiperInstance);
    setIsBeginning(swiperInstance.isBeginning);
    setIsEnd(swiperInstance.isEnd);
  };

  const handleSlideChange = (swiperInstance: SwiperType) => {
    setIsBeginning(swiperInstance.isBeginning);
    setIsEnd(swiperInstance.isEnd);
  };

  if (!isLoading && groups.length === 0) {
    return (
      <div className="relative w-full py-4 group/bar">
        <div className="flex gap-3">
          <StoryUploader>
            <div className="w-28 h-44 rounded-xl relative overflow-hidden cursor-pointer group bg-zinc-900 shadow-sm flex items-center justify-center hover:bg-zinc-800 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-500 border-2 border-zinc-900 flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <p className="text-white text-xs font-medium">สร้างสตอรี่</p>
              </div>
            </div>
          </StoryUploader>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full py-4 group/bar">
      <style dangerouslySetInnerHTML={{__html: `
        .story-scroll-container::-webkit-scrollbar { display: none; }
      `}} />

      {!isBeginning && (
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 shadow-lg flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-all hidden md:flex hover:bg-black/70 hover:scale-110 active:scale-95 text-white backdrop-blur-sm border-0 -ml-4"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-white" color="white" strokeWidth={2.5} />
        </button>
      )}

      <Swiper
        modules={[FreeMode]}
        freeMode={true}
        slidesPerView={'auto'}
        spaceBetween={12}
        onSwiper={handleSwiper}
        onSlideChange={handleSlideChange}
        onReachBeginning={() => setIsBeginning(true)}
        onReachEnd={() => {
          setIsEnd(true);
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onFromEdge={() => {
          if (swiper) {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }
        }}
        className="w-full pb-2"
      >
        <SwiperSlide className="!w-auto">
          {isLoading ? (
            <div className="w-28 h-44 rounded-xl relative overflow-hidden cursor-not-allowed group bg-[#1A1A1A] shadow-sm flex items-center justify-center border border-zinc-800/50 opacity-80">
              <div className="w-12 h-12 rounded-full bg-[#1877F2] border-[3px] border-zinc-300 flex items-center justify-center text-white mb-4 shadow-md">
                <Plus className="w-6 h-6" />
              </div>
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <p className="text-white text-xs font-medium">สร้างสตอรี่</p>
              </div>
            </div>
          ) : (
            <StoryUploader>
              <div className="w-28 h-44 rounded-xl relative overflow-hidden cursor-pointer group bg-[#1A1A1A] shadow-sm flex items-center justify-center hover:bg-[#252525] transition-colors border border-zinc-800/50">
                <div className="w-12 h-12 rounded-full bg-[#1877F2] border-[3px] border-zinc-300 flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform shadow-md">
                  <Plus className="w-6 h-6" />
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <p className="text-white text-xs font-medium">สร้างสตอรี่</p>
                </div>
              </div>
            </StoryUploader>
          )}
        </SwiperSlide>

        {isLoading ? (
          Array.from({ length: 14 }).map((_, i) => (
            <SwiperSlide key={`skeleton-${i}`} className="!w-auto">
              <StoryCardSkeleton />
            </SwiperSlide>
          ))
        ) : (
          groups.map((group, index) => (
            <SwiperSlide key={`${group.groupType}-${group.groupId}`} className="!w-auto">
              <StoryCard 
                group={group} 
                isOwn={group.section === 'own'}
                onClick={() => openViewer(index, [group.preview], 0)} 
              />
            </SwiperSlide>
          ))
        )}
      </Swiper>

      {!isEnd && groups.length > 0 && (
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 shadow-lg flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-all hidden md:flex hover:bg-black/70 hover:scale-110 active:scale-95 text-white backdrop-blur-sm border-0 -mr-4"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-white" color="white" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default StoryBar;
