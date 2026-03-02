"use client";
import Image from 'next/image'
import 'next/link';
import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Parallax } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/parallax';
import { Slide, postBannerClick } from '@/services/apiServices';
import { useWebsiteStore } from '@/stores/websiteStore';

import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import TopUpBanner from '@/components/home/TopUpBanner';
import '@/utils/imageUtils';

interface BannerProps {
  slides?: Slide[];
}


function Banner({ slides = [] }: BannerProps) {
  useWebsiteStore();
  const { isLoggedIn } = useAuthStore();
  useUIStore();
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);

  // Create a looped set of slides if there are few items to ensure infinite loop works visually
  const displaySlides = React.useMemo(() => {
    if (slides.length > 1 && slides.length < 6) {
      return [...slides, ...slides, ...slides];
    }
    return slides;
  }, [slides]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [swiperInstance, setSwiperInstance] = React.useState<any>(null);

  return (
    <div className="w-full flex justify-center bg-white group/banner banner-scale-context">
      <div className="w-full flex flex-col relative">
        <div className="w-full flex justify-center items-center mb-0 relative">
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
              <>
              <Swiper
                onSwiper={(swiper) => setSwiperInstance(swiper)}
                spaceBetween={0}
                centeredSlides={true}
                loop={true}
                speed={600}
                parallax={true}
                slidesPerView={1}
                autoHeight={true} 
                breakpoints={{
                  320: {
                    slidesPerView: 1,
                    spaceBetween: 0,
                  },
                  640: {
                    slidesPerView: 1,
                    spaceBetween: 0,
                  },
                  1024: {
                    slidesPerView: 'auto',
                    spaceBetween: 0,
                  },
                }}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                }}
                navigation={{
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                }}
                onBeforeInit={(swiper) => {
                  // @ts-expect-error - Swiper navigation refs are assigned during init
                  swiper.params.navigation.prevEl = prevRef.current;
                  // @ts-expect-error - Swiper navigation refs are assigned during init
                  swiper.params.navigation.nextEl = nextRef.current;
                }}
                onSlideChange={(swiper) => {
                   setActiveIndex(swiper.realIndex % slides.length);
                }}
                modules={[Autoplay, Navigation, Parallax]}
                className="w-full rounded-2xl overflow-hidden"
              >
                {displaySlides.map((slide, index) => {
                  const imageUrl = slide.img.startsWith('http')
                    ? slide.img
                    : `https://img.enjoybook.co/img/banner/${slide.img}`;
                  return (
                    <SwiperSlide key={`${slide.banner_id}-${index}`} className="w-full lg:!w-auto overflow-hidden">
                      <div className="relative w-full max-w-[680px] cursor-pointer mx-auto" onClick={() => {
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
                          width={680}
                          height={310}
                          sizes="(max-width: 680px) 100vw, 680px"
                          style={{ width: '100%', height: 'auto' }}
                          className="object-contain rounded-lg"
                          priority
                          unoptimized
                          quality={100}
                        />
                      </div>
                    </SwiperSlide>
                  )
                })}
              </Swiper>
              
              {/* Custom Pagination - Changed to relative and mt-4 to sit below Swiper */}
               <div className="flex justify-center gap-2 mt-4 relative w-full z-10">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                        swiperInstance?.slideToLoop(index);
                    }}
                    className={`block h-2 rounded-full transition-all duration-300 ${
                      activeIndex === index ? 'w-6 bg-red-600' : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              </>

            ) : (
              <Image
                src="/images/hero-banner.png"
                alt="GET APP NOW Banner"
                className="w-full h-full object-contain"
                width={976}
                height={446}
              />
            )}
            {isLoggedIn && (
              <div className="mt-4 w-full max-w-[680px] mx-auto px-4 md:px-0 flex justify-start">
                 <TopUpBanner />
              </div>
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
