"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/free-mode";

import { useStoryBar } from "../hooks/useStoryBar";
import { useStoryStore } from "../stores/storyStore";
import StoryCard from "./StoryCard";
import StoryCardSkeleton from "./StoryCardSkeleton";
import StoryUploader from "./StoryUploader";

const CreateStoryCard = ({ disabled = false }: { disabled?: boolean }) => (
  <div className="group relative isolate flex h-44 w-28 items-center justify-center overflow-hidden rounded-[24px] border border-zinc-800/50 bg-[#1A1A1A] shadow-sm">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-zinc-300 bg-[#1877F2] text-white shadow-md transition-transform group-hover:scale-105">
      <Plus className="h-6 w-6" />
    </div>
    <span className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-white">
      {disabled ? "กำลังโหลด..." : "สร้างสตอรี่"}
    </span>
  </div>
);

const StoryBar = () => {
  const { groups, isLoading, fetchNextGroups, hasNextPage, isFetchingNextPage } = useStoryBar();
  const openViewer = useStoryStore((state) => state.openViewer);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const syncEdges = (instance: SwiperType) => {
    setIsBeginning(instance.isBeginning);
    setIsEnd(instance.isEnd);
  };

  return (
    <section className="group/storybar relative w-full py-4" aria-label="สตอรี่">
      {!isBeginning ? (
        <button
          type="button"
          onClick={() => swiper?.slidePrev()}
          className="absolute left-0 top-1/2 z-20 -ml-4 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 shadow-lg transition-all hover:bg-black/80 group-hover/storybar:opacity-100 md:flex"
          aria-label="เลื่อนสตอรี่ไปทางซ้าย"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : null}

      <Swiper
        modules={[FreeMode]}
        freeMode
        slidesPerView="auto"
        spaceBetween={12}
        onSwiper={(instance) => {
          setSwiper(instance);
          syncEdges(instance);
        }}
        onSlideChange={syncEdges}
        onReachBeginning={() => setIsBeginning(true)}
        onFromEdge={syncEdges}
        onReachEnd={() => {
          setIsEnd(true);
          if (hasNextPage && !isFetchingNextPage) void fetchNextGroups();
        }}
        className="w-full pb-2"
      >
        <SwiperSlide className="!w-auto">
          {isLoading ? (
            <CreateStoryCard disabled />
          ) : (
            <StoryUploader>
              <CreateStoryCard />
            </StoryUploader>
          )}
        </SwiperSlide>

        {isLoading
          ? Array.from({ length: 8 }, (_, index) => (
              <SwiperSlide key={`story-skeleton-${index}`} className="!w-auto">
                <StoryCardSkeleton />
              </SwiperSlide>
            ))
          : groups.map((group, index) => (
              <SwiperSlide key={`${group.groupType}-${group.groupId}`} className="!w-auto">
                <StoryCard
                  group={group}
                  isOwn={group.section === "own"}
                  onClick={() => openViewer(index, [group.preview], 0)}
                />
              </SwiperSlide>
            ))}
      </Swiper>

      {!isEnd && groups.length > 0 ? (
        <button
          type="button"
          onClick={() => swiper?.slideNext()}
          className="absolute right-0 top-1/2 z-20 -mr-4 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 shadow-lg transition-all hover:bg-black/80 group-hover/storybar:opacity-100 md:flex"
          aria-label="เลื่อนสตอรี่ไปทางขวา"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      ) : null}
    </section>
  );
};

export default StoryBar;
