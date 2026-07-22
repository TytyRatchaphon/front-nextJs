"use client";
import Image from 'next/image'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Slide } from '@/services/apiServices';

interface BannerProps {
  slides?: Slide[];
}

function Banner({ slides = [] }: BannerProps) {
  return (
      <div className="w-full flex justify-center bg-white">
        <div className="max-w-[1440px] w-full flex flex-col relative">
            <div className="h-[500px] flex justify-center items-center mt-8 mb-12">
            <div className="w-[1128px] h-[500px] relative">
              {slides.length > 0 ? (
                <Swiper
                  spaceBetween={30}
                  centeredSlides={true}
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                  }}
                  pagination={{
                    clickable: true,
                  }}
                  navigation={true}
                  modules={[Autoplay, Pagination, Navigation]}
                  className="w-full h-full rounded-2xl overflow-hidden"
                >
                  {slides.map((slide) => {
                    const imageUrl = slide.img.startsWith('http') 
                      ? slide.img 
                      : `https://img.enjoybook.co/img/${slide.img}`;
                      
                    return (
                    <SwiperSlide key={slide.banner_id}>
                      <div className="relative w-full h-full cursor-pointer" onClick={() => {
                           window.location.href = `/book/${slide.ref_id}`;
                      }}>
                        <Image
                          src={imageUrl}
                          alt={slide.name}
                          fill
                          className="object-cover"
                          priority
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
          <div className="absolute bottom-[-35px] left-1/2 transform -translate-x-1/2 flex justify-center gap-4 z-20">
            <Link href="#" className="w-[270px] h-[71px]">
              <Image 
                src="/images/how-to.png" 
                alt="Howto"
                className="w-full h-full rounded-lg hover:opacity-90 transition"
                width={270}
                height={71}
              />
            </Link>
            <Link href="#" className="w-[270px] h-[71px]">
              <Image 
                src="/images/promotion.png" 
                alt="Promotion"
                className="w-full h-full rounded-lg hover:opacity-90 transition"
                width={270}
                height={71}
              />
            </Link>
            <Link href="#" className="w-[270px] h-[71px]">
              <Image 
                src="/images/blog.png" 
                alt="Blog"
                className="w-full h-full rounded-lg hover:opacity-90 transition"
                width={270}
                height={71}
              />
            </Link>
            <Link href="#" className="w-[270px] h-[71px]">
              <Image 
                src="/images/campaign.png" 
                alt="Campaign"
                className="w-full h-full rounded-lg hover:opacity-90 transition"
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
    <div className='w-full flex justify-center bg-white'>
      <div className='max-w-[1440px] w-full flex flex-col relative'>
          <div className="h-[271px] flex justify-center items-center mt-[-32] mb-[-24]">
            <div className="w-[1116px] h-[207px] relative">
              <Image 
                src="/images/allNovelFrame.png"
                alt="GET APP NOW Banner"
                className="w-full h-full object-contain"
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
