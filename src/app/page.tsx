import { NewNovelSlider, } from "@/components/ImageSlider";
import DailyPopup from "@/components/DailyPopup";
import { BackToTopButton } from "@/components/BackToTopButton";
import { LoggedInContent } from "@/components/LoggedInContent";

export default function Home() {

  return (
    
    <div className="bg-white font-primary font-medium">
        <div className="relative w-[100vw] items-center flex flex-col">
          <div className="mb-[-10px] w-full">
          </div>
          <div className="flex flex-col min-h-[60vh] w-[100vw] relative">
            <div className="">
              <div className="flex flex-col gap-4 w-full relative ">
                <div style={{ 
                    position: 'fixed', width: '100vw',  height: '100vh',  overflow: 'hidden', backgroundColor: 'transparent' }}>
                  <video autoPlay loop  playsInline disableRemotePlayback preload="auto" style={{position: "absolute",width: "100%", height: "100%",objectFit: "cover",top: "0px",left: "0px",display: "block"}}>
                    <source src="https://img.enjoybook.co/img/bgHome20258VoIkwzBIo0507164310.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="px-1">
                        <DailyPopup />
                    <div className="w-full flex flex-col justify-center items-center">
                      <div className="flex flex-col px-3 lg:max-w-[1000px] w-full lg:w-full max-w-full relative ">
                        <div className=" lg:mt-10 w-full">
                          <div className="swiper swiper-initialized swiper-horizontal swiper-autoheight rounded-[15px] w-full" style={{width: "100%"}}>
                            <div className="swiper-wrapper">
                               {/* <ImageSlider /> */}
                            </div>
                          </div>
                        </div>
                        <div className=" bg-white/90 rounded-xl md:px-2 px-1">
                        <LoggedInContent />
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
                                    {/* <ImageButtonSlider /> */}
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
                                      <a className="text-black flex flex-row justify-between items-center font-bold text-nowrap hover-link" href="">ดูทั้งหมด
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
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 my-10">
                              <a className="flex flex-col text-center gap-2 cursor-pointer md:px-0" target="_blank"  href="">
                                <img className="w-full rounded-xl cursor-pointer" loading="lazy" width={1500} height={1500} decoding="async" data-nimg="1" style={{color: "transparent"}} src="https://img.enjoybook.co/img/img_home12025dBsHZnZL4k0507164310.png?w=3840&q=75" alt="" />
                                <p className="font-bold text-black hover-link">วิธีสมัครสมาชิก</p>
                              </a>
                              <a className="flex flex-col text-center gap-2 cursor-pointer md:px-0" target="_blank"  href="">
                                <img className="w-full rounded-xl cursor-pointer" loading="lazy" width={1500} height={1500} decoding="async" data-nimg="1" style={{color: "transparent"}} src="https://img.enjoybook.co/img/img_home22025M3fB9K90It0507164310.png?w=3840&q=75" alt="" />
                                <p className="font-bold text-black hover-link">โปรโมชั่น</p>
                              </a>
                              <a className="flex flex-col text-center gap-2 cursor-pointer md:px-0" target="_blank"  href="">
                                <img className="w-full rounded-xl cursor-pointer" loading="lazy" width={1500} height={1500} decoding="async" data-nimg="1" style={{color: "transparent"}} src="https://img.enjoybook.co/img/img_home32025EcVGV1HDNh0507164310.png?w=3840&q=75" alt="" />
                                <p className="font-bold text-black hover-link">กระทู้</p>
                              </a>
                              <a className="flex flex-col text-center gap-2 cursor-pointer md:px-0" target="_blank"  href="">
                                <img className="w-full rounded-xl cursor-pointer" loading="lazy" width={1500} height={1500} decoding="async" data-nimg="1" style={{color: "transparent"}} src="https://img.enjoybook.co/img/img_home42025Hvs3f6Jd0b0507164310.png?w=3840&q=75" alt="" />
                                <p className="font-bold text-black hover-link">แคมเปญ</p>
                              </a>
                            </div>
                            <div>
                              <div className="mx-0 lg:mx-3 mb-1">
                                <div className="hidden lg:grid grid-cols-2 justify-between items-center mt-4 mt2">
                                  <div className="flex flex-row items-center">
                                      <div className="ant-image css-zg0ahe">
                                          <img className="ant-image-img css-zg0ahe" style={{height:"60px",width:"60px"}} src="https://img.enjoybook.co/img/icon-img/2025VJu3WJHazK0808115848.png" alt="" />
                                      </div>
                                      <span className="text-xl font-bold text-black">
                                        <p>
                                          <span className="mr-2" style={{ color: "#ba372a" }}>
                                            <strong>Exclusive</strong>
                                          </span>
                                            เฉพาะ enjoybook
                                        </p>
                                      </span>
                                  </div>
                                </div>
                              </div>
                              <div className="relative container-box">
                                  <div className="swiper swiper-initialized swiper-horizontal swiper-autoheight z-0 swiper-backface-hidden">
                                    <div id="swiper-wrapper-a655f9431976cfda" className="swiper-wrapper" style={{height: "201px"}} aria-live="polite">
                                        {/* <ExclusiveNovelSlider/> */}
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
        <BackToTopButton />
    </div>
    );
}