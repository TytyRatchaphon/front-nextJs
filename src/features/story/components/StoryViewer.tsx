import React, { useState, useEffect } from 'react';
import { useStoryViewer } from '../hooks/useStoryViewer';
import { useStoryBar } from '../hooks/useStoryBar';
import { useStoryStore } from '../stores/storyStore';
import StorySidebar from './StorySidebar';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import StoryManageLinksModal from './StoryManageLinksModal';
import StoryGroupSlide from './StoryGroupSlide';
import { StoryLink } from '../types/storyTypes';
import { storyApi } from '../services/storyApi';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCube } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cube';
import type { Swiper as SwiperType } from 'swiper';

const StoryViewer = () => {
  const {
    isViewerOpen,
    currentGroup,
    currentItem,
    currentItemIndex,
    isLoadingItems,
  } = useStoryViewer();
  const {
    closeViewer,
    nextItem,
    prevItem,
    nextGroup,
    prevGroup,
    groups,
    currentGroupIndex,
    setCurrentGroupIndex,
    setViewerItems,
    updateItemLinks,
  } = useStoryStore();
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = useStoryBar();

  const [isManageLinksModalOpen, setIsManageLinksModalOpen] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync external changes (like clicks on sidebar or desktop arrows) to Swiper
  useEffect(() => {
    if (swiperInstance && swiperInstance.activeIndex !== currentGroupIndex) {
      swiperInstance.slideTo(currentGroupIndex);
    }
  }, [currentGroupIndex, swiperInstance]);

  // Infinite scroll while viewing
  useEffect(() => {
    if (isViewerOpen && hasNextPage && !isFetchingNextPage) {
      // Fetch next page when we are 2 stories away from the end
      if (currentGroupIndex >= groups.length - 2) {
        fetchNextPage();
      }
    }
  }, [currentGroupIndex, groups.length, hasNextPage, isFetchingNextPage, fetchNextPage, isViewerOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isViewerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowRight') nextItem();
      if (e.key === 'ArrowLeft') prevItem();
      if (e.key === 'ArrowDown') nextGroup();
      if (e.key === 'ArrowUp') prevGroup();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, closeViewer, nextItem, prevItem, nextGroup, prevGroup]);

  // Prevent background scroll when modal open
  useEffect(() => {
    if (isViewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isViewerOpen]);

  const handleLinksUpdated = async (links: StoryLink[]) => {
    if (!currentItem || !currentGroup) return;

    updateItemLinks(currentItem.ref_id, currentItem.type, links);

    try {
      const response = await storyApi.fetchGroupItems(
        currentGroup.groupType,
        currentGroup.groupId,
        currentItem.ref_id
      );
      setViewerItems(response.items, response.startIndex);
    } catch {
      // Keep the saved links visible from the local update if refreshing fails.
    }
  };

  if (!isViewerOpen || !currentGroup) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex">
      {/* Sidebar (Hidden on mobile) */}
      <div className="hidden md:block w-[360px] h-full shrink-0">
        <StorySidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative">

        {/* Exterior Desktop Navigation */}
        <div className="absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 z-20 hidden md:flex pointer-events-auto">
          <button onClick={(e) => { e.stopPropagation(); prevItem(); }} className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-colors">
            <LeftOutlined className="text-xl" />
          </button>
        </div>
        <div className="absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 z-20 hidden md:flex pointer-events-auto">
          <button onClick={(e) => { e.stopPropagation(); nextItem(); }} className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-colors">
            <RightOutlined className="text-xl" />
          </button>
        </div>

        {/* Container 9:16 */}
        <div className="relative w-full h-[100dvh] md:h-[90vh] md:max-w-[calc(90vh*9/16)] md:aspect-[9/16] md:rounded-xl md:overflow-hidden bg-zinc-900 md:shadow-2xl block">
          {isMobile ? (
            <div className="absolute inset-0">
              <Swiper
                modules={[EffectCube]}
                effect="cube"
                cubeEffect={{
                  shadow: false,
                  slideShadows: false,
                }}
                initialSlide={currentGroupIndex}
                onSwiper={setSwiperInstance}
                onSlideChange={(swiper) => {
                  setCurrentGroupIndex(swiper.activeIndex);
                }}
                className="w-full h-full"
                speed={400}
                threshold={10}
                touchRatio={1.5}
                resistance={true}
                resistanceRatio={0.5}
                touchStartPreventDefault={false}
                allowTouchMove={true}
                cssMode={false}
                followFinger={true}
                shortSwipes={true}
                longSwipes={true}
                longSwipesRatio={0.3}
              >
                {groups.map((group, index) => (
                  <SwiperSlide key={`${group.groupType}-${group.groupId}`}>
                    <StoryGroupSlide
                      group={group}
                      isActive={index === currentGroupIndex}
                      onManageLinks={() => setIsManageLinksModalOpen(true)}
                      isMobileSwiper={true}
                      currentItem={currentItem}
                      currentItemIndex={currentItemIndex}
                      isLoadingItems={isLoadingItems}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <div className="w-full h-full" key={`${currentGroup.groupType}-${currentGroup.groupId}`}>
              <StoryGroupSlide
                group={currentGroup}
                isActive={true}
                onManageLinks={() => setIsManageLinksModalOpen(true)}
                currentItem={currentItem}
                currentItemIndex={currentItemIndex}
                isLoadingItems={isLoadingItems}
              />
            </div>
          )}
        </div>
      </div>

      <StoryManageLinksModal
        open={isManageLinksModalOpen}
        onCancel={() => setIsManageLinksModalOpen(false)}
        storyItemId={currentItem?.ref_id ?? 0}
        onSuccess={handleLinksUpdated}
      />
    </div>
  );
};

export default StoryViewer;
