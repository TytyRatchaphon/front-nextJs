'use client';

import { useState,useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, A11y } from 'swiper/modules';


type Novel = {
    id: number;
    name    : string;
    author  : string;
    view   : number;
    chapter: number;
    novel_cover: string;
    novel_link: string;
    created_at: string;
    updated_at: string;
    deleated_at: string | null;

}
type RecNovel = {
    ID : number
    rec_novel_cover : string
    rec_novel_link : string
    rec_novel_name : string
    rec_novel_author : string
    rec_novel_view : number
    rec_novel_chapter : number
    rec_novel_comment : number
    CreatedAt : string
    UpdatedAt : string
    DeletedAt : string | null
}

type Banner = {
    ID : number
    banner_cover : string
    banner_link : string
    CreatedAt : string
    UpdatedAt : string
    DeletedAt : string | null

}
const formatViews = (num: number | undefined | null): string => {
    if (!num) {
        return '0';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000) + 'K';
    }
    return num.toString();
};

export default function ImageSlider() {

    const [banners, setBanners] = useState<Banner[]>([]);

    useEffect(() => {
        // Fetch banners from API or any other source
        const fetchBanners = async () => {
            const response = await fetch('http://localhost:8080/api/banners');
            const data = await response.json();
            setBanners(data);
        };

        fetchBanners();
    }, []);


  return (
    <Swiper
       modules={[Navigation, Pagination, Autoplay, A11y]}
       spaceBetween={50}
       slidesPerView={1}
       pagination={{ clickable: true, }}
       loop={true}
       speed={1000}
       autoplay={{ delay: 3000, disableOnInteraction: false }}
       onSlideChange={() => console.log('slide change')}
       onSwiper={(swiper) => console.log(swiper)}
       className="w-full rounded-lg">
        {banners.map((banner) => (        
            <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src={banner.banner_cover} />
                    </div>
                </div>
            </div>
       </SwiperSlide>))}

    </Swiper>);
}

export  function ImageButtonSlider() {
    const[recNovels, setRecNovels] = useState<RecNovel[]>([]);
    useEffect(() => {
        async function fetchRecNovels() {
            try {
                const response = await fetch('http://localhost:8080/api/recNovels');
                const data = await response.json();
                setRecNovels(data);
            } catch (error) {
                console.error('Error fetching recommended novels:', error);
            }
        }

        fetchRecNovels();
    }, []);

    return (
        <Swiper
            modules={[Navigation, Pagination, Autoplay, A11y]}
            spaceBetween={50}
            slidesPerView={2}
            speed={1000}
        >
        {recNovels.map((recNovel) => (
            <SwiperSlide>
            <div className="swiper-slide swiper-slide-active items-start SwiperSlide" style={{width: "470px", marginRight: "20px"}} role="group" aria-label="1 / 3"> 
                <a className="flex flex-col cursor-pointer text-start  hover:text-primary" style={{width: "100%"}} href="/">
                    <div className='max-h-[250px] px-2 rounded-lg relative'>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer' style={{width: "100%", height: "100%", aspectRatio: "2.18695 / 1"}}>
                            <div className='ant-image css-zg0ahe'>
                                <img alt="ทะลุมิติมาเป็นสตรีมเมอร์เครือข่ายดวงดาว" className="ant-image-img rounded-lg css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src={recNovel.rec_novel_cover} />
                            </div>
                        </div>
                    </div>
                    <div className='px-2'>
                        <span className=" font-semibold mt-3 hover:text-primary line-clamp-1 text-black">{recNovel.rec_novel_name}</span>
                        <div className='flex flex-row items-center'>
                            <span className='text-gray-600 text-sm font-bold my-1'>{recNovel.rec_novel_author}</span>
                            <span className="mx-3 text-gray-500">|</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg>{formatViews(recNovel.rec_novel_view)}</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>{recNovel.rec_novel_chapter}</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path><path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"></path></svg>{recNovel.rec_novel_comment}</span>
                        </div>
                    </div>
                </a>
            </div>
        </SwiperSlide>
        ))}

        </Swiper>);
}
export function NewNovelSlider() {
    const[novels, setNovels] = useState<Novel[]>([]);

    useEffect(() => {
        async function fetchNovels() {
            try {
                const response = await fetch('http://localhost:8080/api/novels');
                const data = await response.json();
                setNovels(data);
            } catch (error) {
                console.error('Error fetching novels:', error);
            }
        }

        fetchNovels();
    }, []);

    return(
        <Swiper
            modules={[Navigation, Pagination, Autoplay, A11y]}
            spaceBetween={50}
            slidesPerView={6}
            speed={1000}
        >
        {novels.map((novel) => (
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <a className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href="" style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <img alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}}   src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </img>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <img alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" style={{position: "absolute", height: "100%", width: "100%", inset: "0px", color: "transparent"}} sizes="400px" src={novel.novel_cover}></img>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black'>{novel.name}</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden'>{novel.author}</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg>{formatViews(novel.view)}</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>{novel.chapter}</span>
                   </div>  
                </a> 
            </div>
        </SwiperSlide>
        ))}
        </Swiper>
    );
}