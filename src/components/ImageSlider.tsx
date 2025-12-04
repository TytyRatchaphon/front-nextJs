"use client";

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, A11y, FreeMode, Scrollbar, Mousewheel } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';  

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/scrollbar';

import{
    useGetBookTrans
} from "@/hooks/useContents"

import type { BookTrans } from '@/types/api';

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

    // const handleClick = (item: string) => {
    //     const q = item.replace('#', '');
    //     // navigate via window to keep it simple in this component
    //     window.location.href = `/search/${encodeURIComponent(q)}`;
    // }

    return (
        <div className='w-full my-1 overflow-auto no-scrollbar py-1'>
            <Swiper
                slidesPerView={'auto'}
                freeMode={true}
                mousewheel={true}
                modules={[FreeMode, Scrollbar, Mousewheel]}
                className="mySwiper swiper ps-10" 
                direction={'horizontal'} 
                width={100}
            >
                {tags.map((item, i) => (
                    <SwiperSlide key={i} className='w-[auto] mx-1'>
                        <span className={classImport}>
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


