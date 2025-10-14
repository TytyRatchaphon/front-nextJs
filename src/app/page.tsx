'use client';

import ImageSlider from "./components/ImageSlider";
import { ImageButtonSlider, NewNovelSlider } from "./components/ImageSlider";
import { useEffect, useState, Fragment } from "react";

export default function Home() {

  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
      
      <div className="bg-white">
        <div className="relative w-[100vw] items-center flex flex-col">
          <div className="mb-[-10px] w-full">
            <div
              className="select-none inset-x-0 top-0 z-[1000] flex justify-center items-center h-[80px] header bg-white text-gray-700 "
              id="navbar"
              style={{
                width: "100%",
                backgroundImage: "url('https://img.enjoybook.co/img/')",
                backgroundSize: "auto",
                backgroundPosition: "center bottom",
                backgroundRepeat: "repeat-x",
                bottom: "0px",
                alignItems: "flex-end"
              }}
            >
              <div className="flex flex-row items-center justify-between p-3 md:px-5 lg:px-0 gap-3 max-w-[1000px] w-full h-[80px]">
                <div className="flex flex-row items-center justify-center ">
                  <a className="w-10 lg:w-12 md:ms-[10px]" href="/">
                    <img className="w-full h-auto" src="https://img.enjoybook.co/img/logo2025omxesk8HIC0602112905.png?w=3840&q=75" alt="" loading="lazy" width="1500" height="1500" decoding="async" data-nimg="1" style={{ color: "transparent" }} srcSet="https://img.enjoybook.co/img/logo2025omxesk8HIC0602112905.png?w=1920&q=75 1x, https://img.enjoybook.co/img/logo2025omxesk8HIC0602112905.png?w=3840&q=75 2x" />
                  </a>
                </div>
                <div className="hidden lg:flex justify-center w-full lg:gap-x-10 items-center ">
                      <div className="group/main ">
                        <a className="text-[15px] lg:text-[17px] leading-6 flex items-center text-nowrap " href="/">หน้าแรก</a>
                      </div>
                      <div className="group/main "><a className="text-[15px] lg:text-[17px] leading-6 flex items-center text-nowrap " href="/cat/dHJhbiwyLG5ldw%3D%3D">เลือกหมวดหมู่<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2 " height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M1.553 6.776a.5.5 0 0 1 .67-.223L8 9.44l5.776-2.888a.5.5 0 1 1 .448.894l-6 3a.5.5 0 0 1-.448 0l-6-3a.5.5 0 0 1-.223-.67"></path></svg></a><div className="hidden group-hover/main:block absolute z-10 pt-10 rounded-md ms-[-20px] bg-white"><div className="group/item flex flex-col  shadow-lg"><a className="px-4 py-4 text-sm rounded-md w-[200px] flex flex-row justify-between bg-white hover:bg-gray-100" href="#">นิยายแปล<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2 " height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"></path></svg></a><div className="hidden group-hover/item:block ms-[200px] absolute shadow-lg rounded-md bg-white"><div className="grid grid-cols-4 gap-1 min-w-[800px]"><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwyMyxuZXc%3D">นิยายแปลจีน</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwyNCxuZXc%3D">นิยายแปลเกาหลี</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwyNSxuZXc%3D">นิยายแปลญี่ปุ่น</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwyNixuZXc%3D">นิยายแปลอังกฤษ</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwyNyxuZXc%3D">นิยายแปลอื่นๆ</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwyLG5ldw%3D%3D">โรแมนติก</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiw4LG5ldw%3D%3D">แฟนตาซี</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiw3LG5ldw%3D%3D">ย้อนเวลา</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiw1LG5ldw%3D%3D">กีฬา</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwyMCxuZXc%3D">Boylove โรมานซ์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwxOCxuZXc%3D">ระบบ</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwxOSxuZXc%3D">รักโรมานซ์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwyMSxuZXc%3D">Girl love โรมานซ์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwyMixuZXc%3D">เรื่องสั้น</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwxNixuZXc%3D">ย้อนยุค / วินเทจ / โบราณ</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiw2LG5ldw%3D%3D">ผจญภัย</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwxNCxuZXc%3D">Boyslove(BL)</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiw0LG5ldw%3D%3D">สืบสวนสอบสวน</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwzLG5ldw%3D%3D">รักวัยรุ่น</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwxNyxuZXc%3D">เกมออนไลน์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwxMyxuZXc%3D">กำลังภายใน</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/dHJhbiwxNSxuZXc%3D">GirlsLove(GL)</a></div></div></div><div className="group/item flex flex-col  shadow-lg"><a className="px-4 py-4 text-sm rounded-md w-[200px] flex flex-row justify-between bg-white hover:bg-gray-100" href="#">นิยายแต่ง<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2 " height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"></path></svg></a><div className="hidden group-hover/item:block ms-[200px] absolute shadow-lg rounded-md bg-white"><div className="grid grid-cols-4 gap-1 min-w-[800px]"><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsOCxuZXc%3D">แฟนตาซี</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsNyxuZXc%3D">ย้อนเวลา</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsNSxuZXc%3D">กีฬา</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsMjAsbmV3">Boylove โรมานซ์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsMTgsbmV3">ระบบ</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsMTksbmV3">รักโรมานซ์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsMjEsbmV3">Girl love โรมานซ์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsMjIsbmV3">เรื่องสั้น</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsNCxuZXc%3D">สืบสวนสอบสวน</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsMyxuZXc%3D">รักวัยรุ่น</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsMTcsbmV3">เกมออนไลน์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsMTMsbmV3">กำลังภายใน</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/d3JpdGUsMTUsbmV3">GirlsLove(GL)</a></div></div></div><div className="group/item flex flex-col  shadow-lg"><a className="px-4 py-4 text-sm rounded-md w-[200px] flex flex-row justify-between bg-white hover:bg-gray-100" href="#">แฟนฟิค<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mx-2 " height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"></path></svg></a><div className="hidden group-hover/item:block ms-[200px] absolute shadow-lg rounded-md bg-white"><div className="grid grid-cols-4 gap-1 min-w-[800px]"><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDgsbmV3">แฟนตาซี</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDcsbmV3">ย้อนเวลา</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDUsbmV3">กีฬา</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDIwLG5ldw%3D%3D">Boylove โรมานซ์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDE4LG5ldw%3D%3D">ระบบ</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDE5LG5ldw%3D%3D">รักโรมานซ์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDIxLG5ldw%3D%3D">Girl love โรมานซ์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDIyLG5ldw%3D%3D">เรื่องสั้น</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDQsbmV3">สืบสวนสอบสวน</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDMsbmV3">รักวัยรุ่น</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDE3LG5ldw%3D%3D">เกมออนไลน์</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDEzLG5ldw%3D%3D">กำลังภายใน</a><a className=" px-4 py-4 text-sm rounded-md hover:bg-gray-100" href="/cat/ZmFuZmljLDE1LG5ldw%3D%3D">GirlsLove(GL)</a></div></div></div></div>
                      </div>
                      <div className="group/main "><a className="text-[15px] lg:text-[17px] leading-6 flex items-center text-nowrap " href="/campaign">แคมเปญ</a>
                      </div>
                      <div className="group/main "><a className="text-[15px] lg:text-[17px] leading-6 flex items-center text-nowrap " href="/review">รีวิว</a>
                      </div>
                      <div className="group/main "><a className="text-[15px] lg:text-[17px] leading-6 flex items-center text-nowrap " href="/article">บทความ</a></div>
                </div>
                <div className="hidden lg:flex lg:justify-end items-center ">
                  <div className="relative rounded-md mx-4 ms-14  justify-center items-center hidden lg:flex">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
                      <span className=" text-sm">
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"></path></svg>
                      </span>
                    </div>
                    <input type="text" className="input block rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 lg:w-[180px] bg-white" name="search" value=""></input>
                  </div>
                  <div className="mx-0 flex justify-center items-center "><div className="text-nowrap text-[15px] lg:text-[17px] leading-6 flex justify-end items-center hover:text-primary cursor-pointer"><span>เข้าสู่ระบบ</span></div></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col pt-[80px] min-h-[60vh] w-[100vw] relative">
            <div className="">
              <div className="flex flex-col gap-4 w-full relative ">
                <div style={{ 
                    position: 'fixed', 
                    width: '100vw', 
                    height: '100vh', 
                    overflow: 'hidden', 
                    backgroundColor: 'transparent' 
                  }}>
                  <video
                    autoPlay
                    loop
                    playsInline
                    disableRemotePlayback
                    preload="auto"
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      top: "0px",
                      left: "0px",
                      display: "block"
                    }}
                  >
                    <source src="https://img.enjoybook.co/img/bgHome20258VoIkwzBIo0507164310.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="px-1">
                    <div className="w-full flex flex-col justify-center items-center">
                      <div className="flex flex-col px-3 lg:max-w-[1000px] w-full lg:w-full max-w-full relative ">
                        <div className="lg:mt-10 w-full">
                          <div className="swiper swiper-initialized swiper-horizontal swiper-autoheight rounded-[15px] w-full" style={{width: "100%"}}>
                            <div className="swiper-wrapper">
                               <ImageSlider />
                            </div>
                          </div>
                        </div>
                        <div className=" bg-white/90 rounded-xl md:px-2 px-1">
                          <div className="mx-0 lg:mx-3 mb-1">
                            <div className="hidden lg:grid grid-cols-2 justify-between items-center mt-4 mb-2">
                              <div className="flex flex-row items-center ">
                                <div className="ant-image css-zg0ahe">
                                  <img src="https://img.enjoybook.co/img/icon-img/icon_recomment2025knpzwECpuD0701145322.png" alt="New Icon" className="ant-image-img css-zg0ahe" style={{height: '60px', width: '60px'}} />
                                </div>
                                <span className="text-xl font-bold text-black">นิยายแนะนำ</span>
                              </div>
                              <div className="flex flex-row justify-end items-end gap-3">
                                <span className="w-full lg:w-auto"></span>
                              </div>
                            </div>
                            <div className="lg:hidden grid grid-cols-2 justify-between items-center mt-4 mb-2">
                              <div className="flex flex-row justify-between items-center col-span-2">
                                <div className="flex flex-row items-center">
                                  <div className="ant-image css-zg0ahe">
                                    <img src="https://img.enjoybook.co/img/icon-img/icon_recomment2025knpzwECpuD0701145322.png" alt="New Icon" className="ant-image-img css-zg0ahe" style={{height: '60px', width: '60px'}} />
                                  </div>
                                  <span className="text-xl font-bold">นิยายแนะนำ</span>
                                </div>
                                <div className="flex flex-row justify-end items-end gap-3">
                                </div>
                              </div>
                              <div className="col-span-2">
                                <span className="w-full lg:w-auto"></span>
                              </div>
                            </div>
                            <div className="relative container-box">
                            <div className="swiper swiper-initialized swiper-horizontal swiper-autoheight z-0 swiper-backface-hidden">
                               <div className="swiper-wrapper">
                                  <ImageButtonSlider />
                               </div>
                            </div>
                            <div className="mx-0 lg:mx-3 mb-1">
                                <div className="hidden lg:grid grid-cols-2 justify-between items-center mt-4 mb-2">
                                  <div className="flex flex-row items-center ">
                                    <div className="">
                                      <img className="ant-image-img css-zg0ahe" style={{height: '60px', width: '60px'}} src="https://img.enjoybook.co/img/icon-img/new-icon.png" alt="New Icon" />
                                    </div>
                                    <span className="text-black text-xl font-bold">นิยายมาใหม่</span>
                                  </div>
                                  <div className="flex flex-row justify-end items-end gap-3">
                                    <span className="w-full lg:w-auto"></span>
                                    <a className="text-black flex flex-row justify-between items-center font-bold text-nowrap" href="">ดูทั้งหมด
                                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="ml-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"></path></svg>
                                    </a>
                                  </div>
                                </div>
                            </div>
                            <div className="relative container-box">
                               <div className="swiper swiper-initialized swiper-horizontal swiper-free-mode swiper-autoheight z-0">
                                  <div className="swiper-wrapper-c1e34af77c2ad33a">
                                      <NewNovelSlider />
                                  </div>
                               </div>
                            </div>
                          </div>                            
                          </div>
                        </div>
                        
                      </div>
                    </div>
                </div>
                <div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="css-zg0ahe ant-float-btn custom-back-top ant-float-btn-default ant-float-btn-circle" type="button"><div class="ant-float-btn-body"><div class="ant-float-btn-content"><div class="ant-float-btn-icon"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h12v2H6zm.707 11.707L11 11.414V20h2v-8.586l4.293 4.293 1.414-1.414L12 7.586l-6.707 6.707z"></path></svg></div></div></div></button>
      </div>
  );
}
