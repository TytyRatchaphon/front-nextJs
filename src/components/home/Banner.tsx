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

interface BannerProps {
  slides?: Slide[];
}

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
}

function Banner({ slides = [] }: BannerProps) {
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);

  return (
      <div className="w-full flex justify-center bg-white group/banner banner-scale-context">
        <style jsx global>{`
          .banner-scale-context .swiper-slide {
            transition: transform 0.3s;
            transform: scale(0.8) !important;
          }
          @media (min-width: 1024px) {
            .banner-scale-context .swiper-slide {
              width: 1128px !important;
            }
          }
          .banner-scale-context .swiper-slide-active {
            transform: scale(1) !important;
            z-index: 10;
          }
        `}</style>
        <div className="w-full flex flex-col relative">
            <div className="h-auto lg:h-[446px] flex justify-center items-center mt-4 lg:mt-8 mb-4 lg:mb-12 relative">
              <div className="w-full h-auto lg:h-[446px] relative group/banner-inner">
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
                    loop={true}
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
                        slidesPerView: 'auto',
                        spaceBetween: -80,
                      },
                    }}
                    autoplay={{
                      delay: 3000,
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
                    {slides.map((slide) => {
                      const imageUrl = slide.img.startsWith('https') 
                        ? slide.img 
                        : `https://img.enjoybook.co/img/banner/${slide.img}`;
                        console.log('Banner Image URL:', imageUrl);
                      return (
                      
                      <SwiperSlide key={slide.banner_id} className="overflow-hidden">
                        <div className="relative w-full h-full cursor-pointer" onClick={() => {
                            postBannerClick(slide.banner_id);
                            window.location.href = `/book/${slide.ref_id}`;
                        }} data-swiper-parallax="-1%">
                          <Image
                            src={imageUrl}
                            alt={slide.name}
                            width={1128}
                            height={385}
                            className="object-fill w-full h-full rounded-2xl"
                            priority
                            loader={imageLoader}
                          />
                        </div>
                      </SwiperSlide>
                    )})}
                  </Swiper>

                ) : (
                  <Image 
                    src="/images/hero-banner.png"
                    alt="GET APP NOW Banner"
                    className="w-full h-full object-contain"
                    width={1128}
                    height={385}
                  />
                )}
              </div>
            </div>
          <div className="relative lg:absolute lg:bottom-[-35px] lg:left-1/2 lg:transform lg:-translate-x-1/2 flex justify-center gap-1 lg:gap-4 z-20 px-1 lg:px-0 mt-[-10px] lg:mt-0 w-full lg:w-auto">
            <Link href="/howto/regis" className="flex-1 lg:flex-none lg:w-[270px] h-auto lg:h-[71px]">
              <Image 
                src="/images/how-to.png" 
                alt="Howto"
                className="w-full h-full rounded-lg hover:opacity-90 transition object-contain"
                width={270}
                height={71}
              />
            </Link>
            <Link href="/howto/novelevent" className="flex-1 lg:flex-none lg:w-[270px] h-auto lg:h-[71px]">
              <Image 
                src="/images/promotion.png" 
                alt="Promotion"
                className="w-full h-full rounded-lg hover:opacity-90 transition object-contain"
                width={270}
                height={71}
              />
            </Link>
            <Link href="/thread" className="flex-1 lg:flex-none lg:w-[270px] h-auto lg:h-[71px]">
              <Image 
                src="/images/blog.png" 
                alt="Blog"
                className="w-full h-full rounded-lg hover:opacity-90 transition object-contain"
                width={270}
                height={71}
              />
            </Link>
            <Link href="/campaign" className="flex-1 lg:flex-none lg:w-[270px] h-auto lg:h-[71px]">
              <Image 
                src="/images/campaign.png" 
                alt="Campaign"
                className="w-full h-full rounded-lg hover:opacity-90 transition object-contain"
                width={270}
                height={71}
              />
            </Link>
          </div>
        </div>
      </div>
  )
}

export default Banner

function AllNovelBanner() {
  return (
    <div className='w-full flex justify-center'>
      <div className='w-full flex flex-col relative'>
          <div className="w-full flex justify-center items-center mt-4 mb-6">
            <div className="w-full h-[120px] sm:h-[160px] lg:h-auto lg:aspect-[1116/207] relative rounded-xl overflow-hidden">
              <Image 
                src="/images/allNovelFrame.png"
                alt="All Novel Banner"
                className="w-full h-full object-cover lg:object-contain"
                width={1116}
                height={207}
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
              />
            </div>
          </div>
      </div>
    </div>
  )
}

function SearchBanner() {
  return(
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
              />
            </div>
          </div>
      </div>
    </div>
  )
}
export { AllNovelBanner, StoreBanner, SearchBanner };