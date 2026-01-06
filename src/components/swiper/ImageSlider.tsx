"use client";

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, A11y, FreeMode, Scrollbar, Mousewheel } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';  

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/scrollbar';

const formatViews = (num: number | undefined | null): string => {
    if (!num) {
        return '0';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
};


export function TagSwiper({ tags, classImport = 'inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm' }: { tags: string[]; classImport?: string }) {
    if (!tags || tags.length === 0) return null;

    const handleClick = (item: string) => {
        const q = item.replace('#', '');
        window.location.href = `/search?q=${encodeURIComponent(q)}`;
    }

    return (
        <div className='w-full'>
            <Swiper
                slidesPerView={'auto'}
                spaceBetween={8}
                centeredSlides={false}
                freeMode={true}
                mousewheel={true}
                modules={[FreeMode, Scrollbar, Mousewheel]}
                className="swiper !mx-0 !w-full !px-0 !py-4" 
                direction={'horizontal'} 
            >
                {tags.map((item, i) => (
                    <SwiperSlide key={i} className='!w-auto'>
                        <span className={`${classImport} select-none cursor-pointer`} onClick={() => handleClick(item)}>
                            {item}
                        </span>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}

export function BannerSwiper(){
    
}


