"use client";
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, Parallax } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/parallax';
import { Slide, postBannerClick } from '@/services/apiServices';
import { useWebsiteStore } from '@/stores/websiteStore';

import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

interface BannerProps {
  slides?: Slide[];
}

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 100}`
}

function Banner({ slides = [] }: BannerProps) {
  const { settings } = useWebsiteStore();
  const { isLoggedIn, token } = useAuthStore();
  const { openLoginModal, setLoginAnimation } = useUIStore();
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className="w-full flex justify-center bg-white group/banner banner-scale-context">
      <div className="w-full flex flex-col relative">
        <div className="w-full flex justify-center items-center mt-4 lg:mt-8 mb-2 lg:mb-4 relative">
          <div className="w-full relative group/banner-inner">
            {/* Navigation Buttons */}
            <button
              ref={prevRef}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-3 rounded-full shadow-lg opacity-0 group-hover/banner-inner:opacity-100 transition-all duration-300 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed hidden lg:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              ref={nextRef}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-3 rounded-full shadow-lg opacity-0 group-hover/banner-inner:opacity-100 transition-all duration-300 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed hidden lg:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            {slides.length > 0 ? (
              <Swiper
                spaceBetween={10}
                centeredSlides={true}
                loop={slides.length > 1}
                speed={600}
                parallax={true}
                slidesPerView={1}
                breakpoints={{
                  640: {
                    slidesPerView: 1,
                    spaceBetween: 10,
                  },
                  768: {
                    slidesPerView: 2,
                    spaceBetween: 10,
                  },
                  1024: {
                    slidesPerView: 3,
                    spaceBetween: 12,
                  },
                }}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                }}
                pagination={{
                  clickable: true,
                }}
                navigation={{
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                }}
                onBeforeInit={(swiper) => {
                  // @ts-ignore
                  swiper.params.navigation.prevEl = prevRef.current;
                  // @ts-ignore
                  swiper.params.navigation.nextEl = nextRef.current;
                }}
                modules={[Autoplay, Pagination, Navigation, Parallax]}
                className="w-full h-full rounded-2xl overflow-hidden"
              >
                {(slides.length > 1 && slides.length < 6 ? [...slides, ...slides, ...slides] : slides).map((slide, index) => {
                  const imageUrl = slide.img.startsWith('http')
                    ? slide.img
                    : `https://img.enjoybook.co/img/banner/${slide.img}`;
                  return (

                    <SwiperSlide key={`${slide.banner_id}-${index}`} className="overflow-hidden">
                      <div className="relative w-full aspect-[680/310] cursor-pointer" onClick={() => {
                        postBannerClick(slide.banner_id);
                        if (slide.type_link === 'novel') {
                          window.location.href = `/book/${slide.ref_id}`;
                        } else if (slide.type_link === 'link') {
                          window.location.href = slide.ref_id;
                        } else if (slide.type_link === 'campaign') {
                          window.location.href = `/campaign/${slide.ref_id}`;
                        } else if (slide.type_link === 'article') {
                          window.location.href = `/article/${slide.ref_id}`;
                        } else if (slide.type_link === 'store') {
                          window.location.href = `/store`;
                        } else if (slide.type_link === 'pack_campaign') {
                          window.location.href = `/pack-campaign/${slide.ref_id}`;
                        } else if (slide.type_link === `campaign-discount`) {
                          window.location.href = `/campaign-discount`;
                        }
                      }} data-swiper-parallax="-1%">
                        <Image
                          src={imageUrl}
                          alt={slide.name}
                          width={0}
                          height={0}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="w-full h-full object-cover rounded-2xl"
                          priority
                          loader={imageLoader}
                          quality={100}
                        />
                      </div>
                    </SwiperSlide>
                  )
                })}
              </Swiper>

            ) : (
              <Image
                src="/images/hero-banner.png"
                alt="GET APP NOW Banner"
                className="w-full h-full object-contain"
                width={976}
                height={446}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Banner

function AllNovelBanner() {
  const { settings } = useWebsiteStore();

  if (!settings?.allNovelBanner) return null;

  return (
    <div className='w-full flex justify-center'>
      <div className='w-full flex flex-col relative'>
        <div className="w-full flex justify-center items-center mt-4 mb-6">
          <div className="w-full h-[120px] sm:h-[160px] lg:h-auto lg:aspect-[1116/207] relative rounded-xl overflow-hidden">
            <Image
              src={settings.allNovelBanner}
              alt="All Novel Banner"
              className="w-full h-full object-cover lg:object-contain"
              width={1116}
              height={207}
              quality={100}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StoreBanner() {
  return (
    <div className='w-full flex justify-center bg-white'>
      <div className='max-w-[1440px] w-full flex flex-col relative'>
        <div className="h-[449px] flex justify-center items-center mt-[-32] mb-[-24]">
          <div className="w-[1128px] h-[385px] relative">
            <Image
              src="/images/storeBanner.png"
              alt="GET APP NOW Banner"
              className="w-full h-full object-contain"
              width={1128}
              height={385}
              quality={100}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SearchBanner() {
  return (
    <div className='w-full flex justify-center bg-white'>
      <div className='max-w-[1440px] w-full flex flex-col relative'>
        {/* Removed negative margin so banner doesn't overlap Navbar */}
        <div className="h-[113px] flex justify-center items-center mt-6 mb-4">
          <div className="w-[1128px] h-[113px] relative">
            <Image
              src="/images/searchBanner.png"
              alt="GET APP NOW Banner"
              className="w-full h-full object-contain"
              width={1128}
              height={113}
              quality={100}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
export { AllNovelBanner, StoreBanner, SearchBanner };