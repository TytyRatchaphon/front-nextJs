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
import SmartDownloadButton from '@/components/utility/SmartDownloadButton';
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
      <style jsx global>{`
          .banner-scale-context .swiper-slide {
            transition: transform 0.3s;
            transform: scale(0.8) !important;
          }
          @media (min-width: 1024px) {
            .banner-scale-context .swiper-slide {
              width: 976px !important;
            }
          }
          .banner-scale-context .swiper-slide-active {
            transform: scale(1) !important;
            z-index: 10;
          }
        `}</style>
      <div className="w-full flex flex-col relative">
        <div className="h-auto lg:h-[446px] flex justify-center items-center mt-4 lg:mt-8 mb-2 lg:mb-4 relative">
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
                    slidesPerView: 'auto',
                    spaceBetween: -80,
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
                      <div className="relative w-full h-full cursor-pointer" onClick={() => {
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
                          width={976}
                          height={446}
                          className="object-fill w-full h-full rounded-2xl"
                          priority
                          loader={imageLoader}
                          sizes="(max-width: 1024px) 100vw, 976px"
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
        <div className="relative w-full lg:w-[976px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 z-20 px-1 lg:px-0 mt-2 lg:-mt-2">
          <SmartDownloadButton className="w-full lg:w-[232px] h-auto lg:h-[61px]">
            {/* Mobile Image */}
            <div className="w-full block lg:hidden">
              <Image
                src={settings?.home_howtouse_mobile || "/images/howtomobile.png"}
                alt="Howto Mobile"
                className="w-full h-auto rounded-lg hover:opacity-90 transition object-contain"
                width={232}
                height={61}
                loader={imageLoader}
                sizes="100vw"
                quality={100}
              />
            </div>
            {/* Desktop Image */}
            <div className="w-full h-full hidden lg:block">
              <Image
                src={settings?.home_howtouse || "/images/HowtoUse.png"}
                alt="Howto"
                className="w-full h-full rounded-lg hover:opacity-90 transition object-fill lg:object-cover"
                width={232}
                height={61}
                loader={imageLoader}
              />
            </div>
          </SmartDownloadButton>
          <Link href="/campaign-discount" className="w-full lg:w-[232px] h-auto lg:h-[61px]">
            {/* Mobile Image */}
            <div className="w-full block lg:hidden">
              <Image
                src={settings?.home_discount_mobile || "/images/discountmobile.png"}
                alt="Promotion Mobile"
                className="w-full h-auto rounded-lg hover:opacity-90 transition object-contain"
                width={232}
                height={61}
                loader={imageLoader}
              />
            </div>
            {/* Desktop Image */}
            <div className="w-full h-full hidden lg:block">
              <Image
                src={settings?.home_discount || "/images/Discount.png"}
                alt="Promotion"
                className="w-full h-full rounded-lg hover:opacity-90 transition object-fill lg:object-cover"
                width={232}
                height={61}
                loader={imageLoader}
                sizes="232px"
                quality={100}
              />
            </div>
          </Link>
          <div onClick={() => {
            if (isLoggedIn) {
              const targetUrl = "https://coinenjoy.enjoybook.co";
              const finalUrl = token ? `${targetUrl}?tk=${token}` : targetUrl;
              window.location.href = finalUrl;
            } else {
              openLoginModal();
              setLoginAnimation('fade-in');
            }
          }} className="w-full lg:w-[232px] h-auto lg:h-[61px] cursor-pointer">
            {/* Mobile Image */}
            <div className="w-full block lg:hidden">
              <Image
                src={settings?.home_review_mobile || "/images/topupmobile.png"}
                alt="Blog Mobile"
                className="w-full h-auto rounded-lg hover:opacity-90 transition object-contain"
                width={232}
                height={61}
                loader={imageLoader}
                quality={100}
              />
            </div>
            {/* Desktop Image */}
            <div className="w-full h-full hidden lg:block">
              <Image
                src={settings?.home_review || "/images/Review.png"}
                alt="Blog"
                className="w-full h-full rounded-lg hover:opacity-90 transition object-fill lg:object-cover"
                width={232}
                height={61}
                loader={imageLoader}
                sizes="232px"
                quality={100}
              />
            </div>
          </div>
          <Link href="/campaign" className="w-full lg:w-[232px] h-auto lg:h-[61px]">
            {/* Mobile Image */}
            <div className="w-full block lg:hidden">
              <Image
                src={settings?.home_event_mobile || "/images/eventmobile.png"}
                alt="Campaign Mobile"
                className="w-full h-auto rounded-lg hover:opacity-90 transition object-contain"
                width={232}
                height={61}
                loader={imageLoader}
                quality={100}
              />
            </div>
            {/* Desktop Image */}
            <div className="w-full h-full hidden lg:block">
              <Image
                src={settings?.home_event || "/images/Event.png"}
                alt="Campaign"
                className="w-full h-full rounded-lg hover:opacity-90 transition object-fill lg:object-cover"
                width={232}
                height={61}
                loader={imageLoader}
                sizes="232px"
                quality={100}
              />
            </div>
          </Link>
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