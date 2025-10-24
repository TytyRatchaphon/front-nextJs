"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, A11y, FreeMode } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';  

import 'swiper/css';
import 'swiper/css/free-mode';

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

// export default function ImageSlider() {
  
//   const { data:banners, isLoading, error } = useGetBanners();
  
//   if(isLoading){
//     return <div
//         className="w-full bg-white rounded-lg flex justify-center items-center"
//         style={{ aspectRatio: "2.18695 / 1" }} 
//       >
        
//         <img
//           src="https://img.enjoybook.co/img/user/ejb-profile.png?1760604894709"  
//           alt="Loading..."
//           className="w-32 h-32 animate-pulse"  
//         />
//       </div>
//   }
//   if(error){
//     return <div className='text-red'>Error Loading Banner:{error.message}</div>
//   }

//   return (
//     <Swiper
//        modules={[Navigation, Pagination, Autoplay, A11y]}
//        spaceBetween={50}
//        slidesPerView={1}
//        pagination={{ clickable: true, }}
//        loop={true}
//        speed={1000}
//        autoplay={{ delay: 3000, disableOnInteraction: false }}
//        onSlideChange={() => console.log('slide change')}
//        onSwiper={(swiper) => console.log(swiper)}
//        className="w-full rounded-lg">
//         {banners?.map((banner: Banner) => (        
//             <SwiperSlide>
// <div
//             className="w-full relative rounded-lg overflow-hidden shadow-md cursor-pointer"
//             style={{ aspectRatio: "2.18695 / 1" }}
//           >
//             <img
//               className="absolute w-full h-full top-0 left-0 object-cover"
//               src={banner.banner_cover}
//               alt="Banner"
//             />
//           </div>
//        </SwiperSlide>))}

//     </Swiper>);
// }

// export  function ImageButtonSlider() {
//     const { data:recNovels, isLoading, error } = useGetRecNovels();
  
//   if(isLoading){
//     return <div
//         className="w-full bg-white rounded-lg flex justify-center items-center"
//         style={{ aspectRatio: "2.18695 / 1" }} 
//       >
        
//         <img
//           src="https://img.enjoybook.co/img/user/ejb-profile.png?1760604894709"  
//           alt="Loading..."
//           className="w-32 h-32 animate-pulse"  
//         />
//       </div>
//   }
//   if(error){
//     return <div className='text-red'>Error Loading Banner:{error.message}</div>
//   }
//     return (
//         <Swiper
//             modules={[Navigation, Pagination, Autoplay, A11y]}
//             spaceBetween={50}
//             slidesPerView={2}
//             speed={1000}
//         >
//         {recNovels?.map((recNovel: RecNovel) => (
//             <SwiperSlide>
//             <div className="swiper-slide swiper-slide-active items-start SwiperSlide" style={{width: "470px", marginRight: "20px"}} role="group" aria-label="1 / 3"> 
//                 <a className="flex flex-col cursor-pointer text-start  hover:text-primary" style={{width: "100%"}} href="/">
//                     <div className='max-h-[250px] px-2 rounded-lg relative'>
//                         <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer' style={{width: "100%", height: "100%", aspectRatio: "2.18695 / 1"}}>
//                             <div className='ant-image css-zg0ahe'>
//                                 <img alt="ทะลุมิติมาเป็นสตรีมเมอร์เครือข่ายดวงดาว" className="ant-image-img rounded-lg css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src={recNovel.rec_novel_cover} />
//                             </div>
//                         </div>
//                     </div>
//                     <div className='px-2'>
//                         <span className=" font-semibold mt-3 hover:text-primary line-clamp-1 text-black">{recNovel.rec_novel_name}</span>
//                         <div className='flex flex-row items-center'>
//                             <span className='text-gray-600 text-sm font-bold my-1'>{recNovel.rec_novel_author}</span>
//                             <span className="mx-3 text-gray-500">|</span>
//                             <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg>{formatViews(recNovel.rec_novel_view)}</span>
//                             <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>{recNovel.rec_novel_chapter}</span>
//                             <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path><path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"></path></svg>{recNovel.rec_novel_comment}</span>
//                         </div>
//                     </div>
//                 </a>
//             </div>
//         </SwiperSlide>
//         ))}

//         </Swiper>);
// }
export function NewNovelSlider() {
    const { data:novels, isLoading, error } = useGetBookTrans();
  
  if(isLoading){
    return <div
        className="w-full bg-white rounded-lg flex justify-center items-center"
        style={{ aspectRatio: "2.18695 / 1" }} 
      >
        
        <img
          src="https://img.enjoybook.co/img/user/ejb-profile.png?1760604894709"  
          alt="Loading..."
          className="w-32 h-32 animate-pulse"  
        />
      </div>
  }
  if(error){
    return <div className='text-red'>Error Loading Banner:{error.message}</div>
  }

    return(
        <Swiper
            modules={[Navigation, Pagination, Autoplay, A11y, FreeMode

            ]}
            spaceBetween={50}
            slidesPerView={6}
            speed={1000}
            allowTouchMove={true}
            freeMode={true}
        >
        {novels?.map((novel: BookTrans) => (
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <Link className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href={`/book/${novel.bookID}`} style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <Image alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}}   src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </Image>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <Image alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" fill={true} sizes="400px" src={novel.img}></Image>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black novel-name'>{novel.name}</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden author-name'>{novel.user_id}</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg>{formatViews(novel.view)}</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>{novel.type}</span>
                   </div>  
                </Link> 
            </div>
        </SwiperSlide>
        ))}
        </Swiper>
    );
}

// export function ExclusiveNovelSlider() {
//     const { data:exclusiveNovels, isLoading, error } = useGetExclusiveNovels();
  
//   if(isLoading){
//     return <div
//         className="w-full bg-white rounded-lg flex justify-center items-center"
//         style={{ aspectRatio: "2.18695 / 1" }} 
//       >
        
//         <img
//           src="https://img.enjoybook.co/img/user/ejb-profile.png?1760604894709"  
//           alt="Loading..."
//           className="w-32 h-32 animate-pulse"  
//         />
//       </div>
//   }
//   if(error){
//     return <div className='text-red'>Error Loading Banner:{error.message}</div>
//   }

//     return(
//         <Swiper
//             modules={[Navigation, Pagination, Autoplay, A11y]}
//             spaceBetween={50}
//             slidesPerView={2}
//             speed={1000}
//         >
//         {exclusiveNovels?.map((exclusiveNovel: ExclusiveNovel) => (
//         <SwiperSlide>
//             <div className='swiper-slide swiper-slide-active items-start SwiperSlide' style={{width: "470px",marginRight: "20px"  }} role="group" >
//                 <a className='grid grid-flow-row-dense grid-cols-3 gap-1 lg:gap-4 text-start cursor-pointer hover:text-primary text-black'  href="#">
//                     <div className='flex flex-1 lg:p-3 px-2'>
//                         <div className='relative' style={{width: "100%", height: "auto",aspectRatio: "1 / 1.454" }}>
//                             <img className='rounded-lg undefined' loading="lazy" decoding="async" data-nimg="fill" style={{position: 'absolute', height: '100%', width: '100%', inset: '0px', color: 'transparent'}} src={exclusiveNovel.exclusive_novel_cover} alt="" />
//                         </div>
//                     </div>
//                     <div className='col-span-2 p-0 lg:p-3 px-2 flex flex-col justify-between'>
//                         <div className='flex flex-col '>
//                             <span className=' text-lg font-semibold line-clamp-1'>{exclusiveNovel.exclusive_novel_name}</span>
//                             <span className='text-black text-sm my-1'>{exclusiveNovel.exclusive_novel_author}</span>
//                             <span className='text-black text-sm line-clamp-3 lg:line-clamp-4'>{exclusiveNovel.exclusive_novel_description}</span>
//                         </div>
//                         <div className='flex flex-row '>
//                             <span className='text-sm text-black flex flex-row items-center'>
//                                 <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg>
//                                 {formatViews(exclusiveNovel.exclusive_novel_view)}
//                             </span>
//                             <span className='text-sm text-black flex flex-row items-center'>
//                                 <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>
//                                 {exclusiveNovel.exclusive_novel_chapter}
//                             </span>
//                             <span className='text-sm text-black flex flex-row items-center '>
//                                 <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path><path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"></path></svg>
//                                 {exclusiveNovel.exclusive_novel_comment}
//                             </span>
//                         </div>
//                     </div>
//                 </a>
//             </div>
//         </SwiperSlide>
//         ))}
//         </Swiper>
//     );
// }


// ฟังก์ชันสำหรับแยก tags จาก string
const parseTags = (tagString: string | null | undefined): string[] => {
    if (!tagString) return [];
    
    // แยกด้วย comma หรือ semicolon หรือ pipe
    return tagString
        .split(/[,;|]/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
};

export function CategoryTag({ tags }: { tags?: string | null }) {
    const tagList = parseTags(tags);
    
    // ถ้าไม่มี tags หรือ tags เป็น null/undefined ให้แสดง default
    if (!tags || tagList.length === 0) {
        return (
            <Swiper
            modules={[FreeMode]}
            slidesPerView={1.5}
            spaceBetween={-2}
            freeMode={true}
            allowTouchMove={true}
            grabCursor={true}
            className="mySwiper ps-10"
            >
                <SwiperSlide style={{ width: 'auto' }}>
                        <span className='text-[14px] text-black bg-tag px-4 py-1 rounded-full lg:my-2'>
                            ไม่มีหมวดหมู่
                        </span>
                </SwiperSlide>
            </Swiper>
        );
    }
    
    return (
        <Swiper
            modules={[FreeMode]}
            slidesPerView="auto"
            spaceBetween={8}
            freeMode={true}
            allowTouchMove={true}
            grabCursor={true}
            resistance={false}
            resistanceRatio={0}
            watchSlidesProgress={true}
            slidesOffsetBefore={8}
            slidesOffsetAfter={8}
            simulateTouch={true}
            touchStartPreventDefault={false}
            passiveListeners={false}
            touchMoveStopPropagation={false}
            touchReleaseOnEdges={false}
            threshold={5}
            longSwipes={true}
            longSwipesRatio={0.5}
            longSwipesMs={300}
            centeredSlides={false}
            centeredSlidesBounds={false}
            slidesPerGroup={1}
            slidesPerGroupSkip={0}
            slidesPerGroupAuto={false}
            className="mySwiper ps-10"
            >
            {tagList.map((tag, index) => (
                <SwiperSlide key={index} style={{ width: 'auto' }}>
                      <span className='text-[14px] text-black bg-tag px-4 py-1 rounded-full lg:my-2'>
                          {tag}
                            </span>
        </SwiperSlide>
        ))}
        </Swiper>
    );
}