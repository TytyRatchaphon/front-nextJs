"use client";

import React, { useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveTypes } from '@/services/apiServices';

export default function CategoryTypeSwiper() {
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type') || 'all';
  const currentTab = searchParams.get('tab') || 'bestseller';
  const currentPeriod = searchParams.get('period') || ((currentTab === 'bestseller' || currentTab === 'topchart') ? '30' : '');
  const [swiper, setSwiper] = React.useState<any>(null);

  const buildTypeHref = (typeValue: string) => {
    const params = new URLSearchParams({
      type: typeValue,
      categoryId: 'all',
      tab: currentTab,
      limit: '10',
      page: '1',
    });

    if (currentTab === 'bestseller' || currentTab === 'topchart') {
      params.set('period', currentPeriod || '30');
    }

    return `/cat/list?${params.toString()}`;
  };

  const { data: categoryTypes = [] } = useQuery({
    queryKey: ['activeTypes'],
    queryFn: fetchActiveTypes,
    staleTime: 5 * 60 * 1000, 
  });

  useEffect(() => {
    if (swiper && categoryTypes.length > 0) {
      const index = categoryTypes.findIndex((t) => t.type === currentType);
      if (index !== -1) {
        swiper.slideTo(index);
      }
    }
  }, [swiper, currentType, categoryTypes]);

  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="px-4 lg:px-8 py-0 transition-opacity duration-300 max-w-[1200px] mx-auto">
        <Swiper
          spaceBetween={4}
          slidesPerView="auto"
          className="w-full"
          freeMode={true}
          onSwiper={setSwiper}
        >
          {categoryTypes.map((type) => (
            <SwiperSlide key={type.type} className="!w-auto">
              <Link
                href={buildTypeHref(type.type)}
                className={`block px-6 py-2 text-[15px] whitespace-nowrap rounded-t-lg border transition-all ${
                  currentType === type.type
                    ? 'bg-white text-red-600 border-gray-200 border-b-white font-bold relative z-10 -mb-[1px]'
                    : 'bg-gray-50 text-gray-600 border-transparent hover:text-red-600'
                }`}
              >
                {type.label}
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
