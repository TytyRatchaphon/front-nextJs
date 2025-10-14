'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, A11y } from 'swiper/modules';


export default function ImageSlider() {
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
        <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025gAOLv1YMHQ1007115307.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
       <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025VJVcUMeFuv1007113250.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
       <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025nvircZGiI01001160941.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
       <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/20252WVsOJzWCC1007113457.png" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
       <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/202575TmmnbrF91002133348.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
       <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025W50H0Dul5l1010093057.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
       <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025tmPzOABsAj1007113231.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
       <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025INFxs0ZzfQ1002170432.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
       <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/202568nzQQHCfp1002170501.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
       <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025VKISHDqqLA1007135442.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
       <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025DMmF9x8bUp0916153942.png" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
          <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025KcYgxIQmY51007140106.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
          <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025GqsU4wyGix0808104330.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
          <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025DFNCmRDme10915143211.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
          <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025ukZjPPh4Yc0923141455.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
          <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025G9vs1Z3tai0908175123.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
          <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025pFWG6xzd9G0923142145.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
          <SwiperSlide>
            <div className="swiper-slide" style={{width: "976px"}}>
                <div style={{width: "100%", height: "auto", aspectRatio: "2.18695 / 1"}} className="flex items-center justify-center rounded-lg shadow-md cursor-pointer w-full">
                    <div className="ant-image css-zg0ahe">
                        <img className="ant-image-img rounded-lg  css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/banner/2025VvKLdDKpaX1002133317.jpeg" />
                    </div>
                </div>
            </div>
       </SwiperSlide>
    </Swiper>);
}

export  function ImageButtonSlider() {
    return (
        <Swiper
            modules={[Navigation, Pagination, Autoplay, A11y]}
            spaceBetween={50}
            slidesPerView={2}
            speed={1000}
        >
        <SwiperSlide>
            <div className="swiper-slide swiper-slide-active items-start SwiperSlide" style={{width: "470px", marginRight: "20px"}} role="group" aria-label="1 / 3"> 
                <a className="flex flex-col cursor-pointer text-start  hover:text-primary" style={{width: "100%"}} href="/">
                    <div className='max-h-[250px] px-2 rounded-lg relative'>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer' style={{width: "100%", height: "100%", aspectRatio: "2.18695 / 1"}}>
                            <div className='ant-image css-zg0ahe'>
                                <img alt="ทะลุมิติมาเป็นสตรีมเมอร์เครือข่ายดวงดาว" className="ant-image-img rounded-lg css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/recomment/2025uUBVjfx58y0808104448.png" />
                            </div>
                        </div>
                    </div>
                    <div className='px-2'>
                        <span className=" font-semibold mt-3 hover:text-primary line-clamp-1 text-black">ทะลุมิติมาเป็นสตรีมเมอร์เครือข่ายดวงดาว</span>
                        <div className='flex flex-row items-center'>
                            <span className='text-gray-600 text-sm font-bold my-1'>816/ฮัตโตะ</span>
                            <span className="mx-3 text-gray-500">|</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 2k</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>103</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path><path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"></path></svg>0</span>
                        </div>
                    </div>
                </a>
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className="swiper-slide swiper-slide-active items-start SwiperSlide" style={{width: "470px", marginRight: "20px"}} role="group" aria-label="1 / 3"> 
                <a className="flex flex-col cursor-pointer text-start  hover:text-primary" style={{width: "100%"}} href="/">
                    <div className='max-h-[250px] px-2 rounded-lg relative'>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer' style={{width: "100%", height: "100%", aspectRatio: "2.18695 / 1"}}>
                            <div className='ant-image css-zg0ahe'>
                                <img alt="ทะลุมิติมาเป็นสตรีมเมอร์เครือข่ายดวงดาว" className="ant-image-img rounded-lg css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/recomment/2025uUBVjfx58y0808104448.png" />
                            </div>
                        </div>
                    </div>
                    <div className='px-2'>
                        <span className=" font-semibold mt-3 hover:text-primary line-clamp-1 text-black">ทะลุมิติมาเป็นสตรีมเมอร์เครือข่ายดวงดาว</span>
                        <div className='flex flex-row items-center'>
                            <span className='text-gray-600 text-sm font-bold my-1'>816/ฮัตโตะ</span>
                            <span className="mx-3 text-gray-500">|</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 2k</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>103</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path><path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"></path></svg>0</span>
                        </div>
                    </div>
                </a>
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className="swiper-slide swiper-slide-active items-start SwiperSlide" style={{width: "470px", marginRight: "20px"}} role="group" aria-label="1 / 3"> 
                <a className="flex flex-col cursor-pointer text-start  hover:text-primary" style={{width: "100%"}} href="/">
                    <div className='max-h-[250px] px-2 rounded-lg relative'>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer' style={{width: "100%", height: "100%", aspectRatio: "2.18695 / 1"}}>
                            <div className='ant-image css-zg0ahe'>
                                <img alt="ทะลุมิติมาเป็นสตรีมเมอร์เครือข่ายดวงดาว" className="ant-image-img rounded-lg css-zg0ahe" style={{height: "auto", width: "100%", aspectRatio: "2.18695 / 1"}} src="https://img.enjoybook.co/img/recomment/2025uUBVjfx58y0808104448.png" />
                            </div>
                        </div>
                    </div>
                    <div className='px-2'>
                        <span className=" font-semibold mt-3 hover:text-primary line-clamp-1">ทะลุมิติมาเป็นสตรีมเมอร์เครือข่ายดวงดาว</span>
                        <div className='flex flex-row items-center'>
                            <span className='text-gray-600 text-sm font-bold my-1'>816/ฮัตโตะ</span>
                            <span className="mx-3 text-gray-500">|</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 2k</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>103</span>
                            <span className="text-sm text-gray-800 flex flex-row items-center"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" className="mx-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path><path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"></path></svg>0</span>
                        </div>
                    </div>
                </a>
            </div>
        </SwiperSlide>
        </Swiper>);
}
export function NewNovelSlider() {
    return(
        <Swiper
            modules={[Navigation, Pagination, Autoplay, A11y]}
            spaceBetween={50}
            slidesPerView={6}
            speed={1000}
        >
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <a className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href="" style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <img alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}} srcSet="https://img.enjoybook.co/img/tag/newTag.png?w=128&amp;q=75 1x, https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75 2x" src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </img>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <img alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" style={{position: "absolute", height: "100%", width: "100%", inset: "0px", color: "transparent"}} sizes="400px" src="https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=16&amp;q=75 16w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=32&amp;q=75 32w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=48&amp;q=75 48w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=64&amp;q=75 64w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=96&amp;q=75 96w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=128&amp;q=75 128w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=256&amp;q=75 256w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=384&amp;q=75 384w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=640&amp;q=75 640w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=750&amp;q=75 750w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=828&amp;q=75 828w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1080&amp;q=75 1080w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1200&amp;q=75 1200w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1920&amp;q=75 1920w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=2048&amp;q=75 2048w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=3840&amp;q=75 3840w"></img>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black'>ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden'>Office Onlybook</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 699</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>60</span>
                   </div>  
                </a> 
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <a className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href="" style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <img alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}} srcSet="https://img.enjoybook.co/img/tag/newTag.png?w=128&amp;q=75 1x, https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75 2x" src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </img>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <img alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" style={{position: "absolute", height: "100%", width: "100%", inset: "0px", color: "transparent"}} sizes="400px" src="https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=16&amp;q=75 16w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=32&amp;q=75 32w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=48&amp;q=75 48w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=64&amp;q=75 64w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=96&amp;q=75 96w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=128&amp;q=75 128w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=256&amp;q=75 256w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=384&amp;q=75 384w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=640&amp;q=75 640w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=750&amp;q=75 750w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=828&amp;q=75 828w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1080&amp;q=75 1080w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1200&amp;q=75 1200w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1920&amp;q=75 1920w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=2048&amp;q=75 2048w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=3840&amp;q=75 3840w"></img>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black'>ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden'>Office Onlybook</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 699</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>60</span>
                   </div>  
                </a> 
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <a className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href="" style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <img alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}} srcSet="https://img.enjoybook.co/img/tag/newTag.png?w=128&amp;q=75 1x, https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75 2x" src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </img>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <img alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" style={{position: "absolute", height: "100%", width: "100%", inset: "0px", color: "transparent"}} sizes="400px" src="https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=16&amp;q=75 16w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=32&amp;q=75 32w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=48&amp;q=75 48w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=64&amp;q=75 64w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=96&amp;q=75 96w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=128&amp;q=75 128w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=256&amp;q=75 256w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=384&amp;q=75 384w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=640&amp;q=75 640w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=750&amp;q=75 750w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=828&amp;q=75 828w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1080&amp;q=75 1080w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1200&amp;q=75 1200w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1920&amp;q=75 1920w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=2048&amp;q=75 2048w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=3840&amp;q=75 3840w"></img>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black'>ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden'>Office Onlybook</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 699</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>60</span>
                   </div>  
                </a> 
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <a className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href="" style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <img alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}} srcSet="https://img.enjoybook.co/img/tag/newTag.png?w=128&amp;q=75 1x, https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75 2x" src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </img>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <img alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" style={{position: "absolute", height: "100%", width: "100%", inset: "0px", color: "transparent"}} sizes="400px" src="https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=16&amp;q=75 16w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=32&amp;q=75 32w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=48&amp;q=75 48w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=64&amp;q=75 64w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=96&amp;q=75 96w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=128&amp;q=75 128w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=256&amp;q=75 256w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=384&amp;q=75 384w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=640&amp;q=75 640w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=750&amp;q=75 750w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=828&amp;q=75 828w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1080&amp;q=75 1080w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1200&amp;q=75 1200w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1920&amp;q=75 1920w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=2048&amp;q=75 2048w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=3840&amp;q=75 3840w"></img>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black'>ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden'>Office Onlybook</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 699</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>60</span>
                   </div>  
                </a> 
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <a className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href="" style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <img alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}} srcSet="https://img.enjoybook.co/img/tag/newTag.png?w=128&amp;q=75 1x, https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75 2x" src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </img>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <img alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" style={{position: "absolute", height: "100%", width: "100%", inset: "0px", color: "transparent"}} sizes="400px" src="https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=16&amp;q=75 16w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=32&amp;q=75 32w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=48&amp;q=75 48w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=64&amp;q=75 64w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=96&amp;q=75 96w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=128&amp;q=75 128w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=256&amp;q=75 256w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=384&amp;q=75 384w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=640&amp;q=75 640w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=750&amp;q=75 750w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=828&amp;q=75 828w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1080&amp;q=75 1080w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1200&amp;q=75 1200w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1920&amp;q=75 1920w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=2048&amp;q=75 2048w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=3840&amp;q=75 3840w"></img>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black'>ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden'>Office Onlybook</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 699</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>60</span>
                   </div>  
                </a> 
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <a className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href="" style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <img alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}} srcSet="https://img.enjoybook.co/img/tag/newTag.png?w=128&amp;q=75 1x, https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75 2x" src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </img>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <img alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" style={{position: "absolute", height: "100%", width: "100%", inset: "0px", color: "transparent"}} sizes="400px" src="https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=16&amp;q=75 16w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=32&amp;q=75 32w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=48&amp;q=75 48w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=64&amp;q=75 64w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=96&amp;q=75 96w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=128&amp;q=75 128w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=256&amp;q=75 256w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=384&amp;q=75 384w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=640&amp;q=75 640w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=750&amp;q=75 750w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=828&amp;q=75 828w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1080&amp;q=75 1080w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1200&amp;q=75 1200w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1920&amp;q=75 1920w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=2048&amp;q=75 2048w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=3840&amp;q=75 3840w"></img>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black'>ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden'>Office Onlybook</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 699</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>60</span>
                   </div>  
                </a> 
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <a className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href="" style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <img alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}} srcSet="https://img.enjoybook.co/img/tag/newTag.png?w=128&amp;q=75 1x, https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75 2x" src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </img>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <img alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" style={{position: "absolute", height: "100%", width: "100%", inset: "0px", color: "transparent"}} sizes="400px" src="https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=16&amp;q=75 16w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=32&amp;q=75 32w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=48&amp;q=75 48w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=64&amp;q=75 64w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=96&amp;q=75 96w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=128&amp;q=75 128w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=256&amp;q=75 256w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=384&amp;q=75 384w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=640&amp;q=75 640w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=750&amp;q=75 750w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=828&amp;q=75 828w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1080&amp;q=75 1080w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1200&amp;q=75 1200w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1920&amp;q=75 1920w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=2048&amp;q=75 2048w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=3840&amp;q=75 3840w"></img>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black'>ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden'>Office Onlybook</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 699</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>60</span>
                   </div>  
                </a> 
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <a className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href="" style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <img alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}} srcSet="https://img.enjoybook.co/img/tag/newTag.png?w=128&amp;q=75 1x, https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75 2x" src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </img>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <img alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" style={{position: "absolute", height: "100%", width: "100%", inset: "0px", color: "transparent"}} sizes="400px" src="https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=16&amp;q=75 16w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=32&amp;q=75 32w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=48&amp;q=75 48w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=64&amp;q=75 64w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=96&amp;q=75 96w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=128&amp;q=75 128w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=256&amp;q=75 256w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=384&amp;q=75 384w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=640&amp;q=75 640w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=750&amp;q=75 750w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=828&amp;q=75 828w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1080&amp;q=75 1080w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1200&amp;q=75 1200w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1920&amp;q=75 1920w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=2048&amp;q=75 2048w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=3840&amp;q=75 3840w"></img>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black'>ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden'>Office Onlybook</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 699</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>60</span>
                   </div>  
                </a> 
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className='swiper-slide items-start SwiperSlide' style={{width: "151.667px", marginRight: "10px"}}>
                <a className='flex flex-col cursor-pointer p-2 text-start  hover:text-primary bg-transparent' href="" style={{width: "100%", height: "auto"}}>
                   <div className='relative' style={{width: "100%", overflow: "visible"}}>
                        <div className='relative' style={{width: "100%"}}>
                            <img alt="enjoybook" loading="lazy" width="100" height="100" decoding="async" data-nimg="1" style={{color: "transparent", width: "2.5rem", height: "auto", position: "absolute", left: "-6px", top: "0.7rem", zIndex: 10}} srcSet="https://img.enjoybook.co/img/tag/newTag.png?w=128&amp;q=75 1x, https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75 2x" src="https://img.enjoybook.co/img/tag/newTag.png?w=256&amp;q=75">
                            </img>                          
                        </div>
                        <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer relative' style={{width: "100%", height: "auto", aspectRatio: "1 / 1.454"}}>
                            <img alt="ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน" loading="lazy" decoding="async" data-nimg="fill" className="rounded-lg undefined" style={{position: "absolute", height: "100%", width: "100%", inset: "0px", color: "transparent"}} sizes="400px" src="https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=16&amp;q=75 16w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=32&amp;q=75 32w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=48&amp;q=75 48w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=64&amp;q=75 64w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=96&amp;q=75 96w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=128&amp;q=75 128w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=256&amp;q=75 256w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=384&amp;q=75 384w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=640&amp;q=75 640w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=750&amp;q=75 750w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=828&amp;q=75 828w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1080&amp;q=75 1080w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1200&amp;q=75 1200w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=1920&amp;q=75 1920w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=2048&amp;q=75 2048w, https://img.enjoybook.co/img/book/tn/B2025SNx469KhbCSIVBD1ZSiK1013094726.jpeg?w=3840&amp;q=75 3840w"></img>
                        </div>
                   </div>
                   <div className=''>
                    <span className=' font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black'>ข้ามมิติเป็นนักฝึกสัตว์วิเศษ ปลุกพลังนกสายฟ้าสะกดชะตาแผ่นดิน</span>
                    <span className='text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden'>Office Onlybook</span>
                   </div>
                   <div className='flex flex-row justify-start gap-2'>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg> 699</span>
                       <span className="text-sm text-black flex flex-row items-center lg:gap-2 gap-1"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path></svg>60</span>
                   </div>  
                </a> 
            </div>
        </SwiperSlide>
        </Swiper>
    );
}