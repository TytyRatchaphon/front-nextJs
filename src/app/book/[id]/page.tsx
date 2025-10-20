'use client'

import Navbar from '@/components/navbar'
import React from 'react'
// import PhotoPreview from '@/components/PhotoPreview'
import { Image } from 'antd';
import { CategoryTag } from '@/components/ImageSlider';
import { useGetNodeBookById } from '@/hooks/useContents';
import { useParams } from 'next/navigation'

// ฟังก์ชันสำหรับจัดรูปแบบตัวเลข
const formatViews = (num: number | undefined | null): string => {
    if (!num) {
        return '0';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

function BookDetailPage() {
    const params = useParams<{ id: string }>()
    const id = params?.id // string | undefined
    const { data: novel, isLoading, error } = useGetNodeBookById(id as string);
  return (
    <div className='bg-white font-primary font-medium'>
        <div className='relative w-[100vw] items-center flex flex-col'>
            <div className='mb-[-10px] w-full'>
                <div>
                    <Navbar/>
                </div>
            </div>
            <div className='flex flex-col min-h-[60vh] w-[100vw] relative'>
                <div className='body flex flex-col gap-4 w-full bg-gray-100'>
                    <div className='w-full flex flex-col justify-center items-center'>
                        <div className='flex flex-col px-3 lg:max-w-[1000px] w-full lg:w-full max-w-full relative '>
                            <div className='bg-white rounded-xl p-5 my-5'>
                                <div className='select-none'>
                                    <div className='grid p-0 md:p-6 '>
                                        <div className='grid md:grid-cols-4 grid-cols-1 mt-6 lg:mt-0'>
                                            <div className='flex justify-center'>
                                                <div className='flex justify-center items-start max-w-[200px]'>
                                                    <div className='flex items-center justify-center rounded-lg shadow-md cursor-pointer'>
                                                        <div className='ant-image css-zg0ahe'>
                                                            <Image 
                                                                className='ant-image-img rounded-lg z-0 undefined css-zg0ahe'
                                                                src={novel?.img} 
                                                                style={{ height: "auto", width: "100%", aspectRatio: "1 / 1.454"}}>
                                                            </Image>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='md:col-span-3 p-3 md:px-6 text-wrap text-center md:text-start flex flex-col justify-between'>
                                                <div>
                                                    <a href="/book">
                                                        <p className='text-2xl font-bold mb-2'>
                                                            {novel?.title}
                                                        </p>
                                                    </a>
                                                    <p className='text-md mb-2'>
                                                        โดย
                                                        <a className='text-black font-bold ml-1' href="/book">{novel?.by}</a>
                                                    </p>
                                                    <a className='text-md text-primary mr-2 focus:outline-none' href=""></a>
                                                    <a className='text-md text-primary mr-2 focus:outline-none' href=""></a>
                                                    <div 
                                                        className='book-description text-md my-2 lg:my-4 line-clamp-4 text-wrap text-base' 
                                                        style={{overflow: 'hidden',display: '-webkit-box',WebkitLineClamp: 4 }}
                                                        dangerouslySetInnerHTML={{ __html: novel?.description || 'ไม่มีคำอธิบาย' }}
                                                    />
                                                </div>
                                                <div>
                                                    <div>
                                                        <div className='rounded-lg flex flex-row gap-5 md:gap-20 p-2 py-4 text-md items-center justify-center md:justify-start'>
                                                            <div className='flex flex-col text-center'>
                                                                <span>ยอดวิว</span>
                                                                <span className='font-bold text-xl'>{formatViews(novel?.view)}</span>
                                                            </div>
                                                            <div className='flex flex-col text-center'>
                                                                <span>จำนวนตอน</span>
                                                                <span className='font-bold text-xl'>{novel?.id}</span>
                                                            </div>
                                                            <div className='flex flex-col text-center'>
                                                                <span>ความคิดเห็น</span>
                                                                <span className='font-bold text-xl'>{novel?.tag}</span>
                                                            </div>
                                                        </div> 
                                                    </div>
                                                    <div className='mt-5 flex flex-row gap-2 md:gap-4 items-center justify-center md:justify-start'>
                                                        <a className='border border-primary bg-primary p-2 flex flex-row justify-center items-center rounded-lg text-white bg-rose-600 hover:text-white cursor-pointer w-[120px] text-nowrap' href="">
                                                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="mr-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path></svg>
                                                            <span>อ่านเลย</span>
                                                        </a>
                                                        <div className="border border-gray-300 p-2 flex flex-row justify-center items-center rounded-lg  hover:text-primary hover:border-primary cursor-pointer w-[120px] text-nowrap"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"></path></svg><span className="ml-2 text-nowrap">เพิ่มเข้าชั้น</span></div>
                                                        <div className="border border-gray-300 py-2 flex flex-row justify-center items-center rounded-lg hover:text-primary hover:border-primary cursor-pointer w-[120px]"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"></path></svg><span className="ml-2">แชร์</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='my-1 p-0 font-medium -mx-2 overflow-hidden' style={{ width: 888, height: 45 }}>
                                            <CategoryTag tags={novel?.tag} />
                                        </div>
                                        <div className='py-3'></div>
                                        <div className='flex flex-1 lg:p-3 flex-col justify-start text-left mb-10 overflow-x-hidden scrollbar-hide'>
                                            <div className=''>
                                                <span className='font-bold text-xl my-10 px-11'>แนะนำเรื่อง</span>
                                                <div className='mt-5 px-2 md:px-11 text-wrap text-lg'>
                                                    <div className='text-center mb-4'>
                                                        <span className='font-bold'>
                                                            *** ลิขสิทธิ์ถูกต้องภายใต้หจก. EnJoyBook ***
                                                        </span>
                                                    </div>
                                                    <div className='text-center mb-2'>
                                                        <span className='font-bold'>
                                                            ได้รับลิขสิทธิ์ออนไลน์ (Digital license) สำหรับแปลขายลงบนเว็บไซต์ได้อย่างถูกลิขสิทธิ์ 100%
                                                        </span>
                                                    </div>
                                                    <div className='text-center mb-2'>
                                                        <span className='font-bold'>
                                                            เจ้าของลิขสิทธิ์ต้นฉบับ : Alibaba Literature
                                                        </span>
                                                    </div>
                                                    <div className='text-center mb-2'>
                                                        <span className='font-bold'>
                                                            ---------------------------------------
                                                        </span>
                                                    </div>
                                                    <div className='text-center mb-2'>
                                                        <span className='font-bold'>
                                                            ทะลุมิติไปเป็นชาวสวนแม่ลูกสาม[นิยายแปล]
                                                        </span>
                                                    </div>
                                                    <div className='text-center mb-2'>
                                                        <span className='font-bold'>
                                                            ชื่อจีน : 重回六零：种田发家养崽崽  ผู้แต่ง : 南方荔枝
                                                        </span>
                                                    </div>
                                                    <div className='text-center mb-2'>
                                                        <span className='font-bold'>
                                                            จำนวนตอนทั้งสิ้น 701 ตอน(จบ)
                                                        </span>
                                                    </div>
                                                    <div className='mb-2'>
                                                        <span className='font-bold'>
                                                            *นิยายเรื่องนี้อยู่ในยุค 1960 เทียบกับ พ.ศ. คือ 2503 เป็นยุคที่ประเทศจีนอยู่ในช่วงปฏิรูปการปกครองโดยมีพรรคคอมมิวนิสต์จีนเป็นผู้นำ ดังนั้นสรรพนาม ฉากเรื่อง ตัวละคร จะไม่เหมือนกับภาพในนิยายจอมยุทธ์กำลังภายใน
                                                        </span>
                                                    </div>
                                                    <div className='mb-2' />
                                                    <div className='mb-2'>
                                                        จู่ ๆ ก็ทะลุมิติมาเป็นคุณแม่ลูกสามในยุคปฏิรูปการปกครองปี 60 ...
                                                    </div>
                                                    <div className='mb-2'>
                                                        ใครจะไปคิดว่าชีวิตธรรมดาของ หลินชิงเหอ ผู้จัดการฝ่ายขายสาวจะเผชิญกับความไม่ธรรมดา หลังทะลุมิติเข้าไปเป็นตัวประกอบในนิยายที่เธออ่าน ซึ่งต้องเผชิญกับความยากลำบากของสถานการณ์ในช่วงเวลานั้น ไม่มีอะไรจะกินและไม่มีแม้แต่เสื้อผ้าจะสวมใส่ แต่โชคยังดีที่เธอได้พื้นที่มิติส่วนตัวไว้เก็บของ ทำให้เธอรอดตายไปได้ชั่วคราว แต่สิ่งที่น่ากังวลมากกว่านั้นก็คือ บุตรชายทั้งสามของเธอดันเป็นตัวร้ายในอนาคตของนิยายเรื่องนี้น่ะสิ แถมสามีในมิตินี้ของเธอยังต้องพบกับจุดจบน่าอนาถอีกด้วย
                                                    </div>
                                                    <div className='mb-2'>
                                                        ตัวประกอบแม่ลูกสามอย่างเธอจะเปลี่ยนแปลงเนื้อเรื่องและเอาตัวให้รอดอย่างไรดีเนี่ย...
                                                    </div>
                                                    <div className='text-center mt-4 mb-2'>
                                                        <span className='font-bold'>
                                                            ---------------------------------------
                                                        </span>
                                                    </div>
                                                    <div className='text-center mb-2'>
                                                        <span className='font-bold'>
                                                            เนื้อหาภายในเรื่อง ทะลุมิติไปเป็นชาวสวนแม่ลูกสาม[นิยายแปล] ฉบับ E-Book และ รูปเล่ม
                                                        </span>
                                                    </div>
                                                    <div className='text-center mb-2'>
                                                        <span className='font-bold'>
                                                            เล่ม 1 : บทที่ 1-60 &nbsp;&nbsp;&nbsp; เล่ม 2 : บทที่ 61-120
                                                        </span>
                                                    </div>
                                                    <div className='text-center mb-2'>
                                                        <span className='font-bold'>
                                                            ---------------------------------------
                                                        </span>
                                                    </div>
                                                    <div className='text-center mb-2'>
                                                        <span className='font-bold'>
                                                            อัปเดตทุกวัน วันละ 2 ตอน
                                                        </span>
                                                    </div>
                                                    <div className='text-center'>
                                                        <span className='font-bold'>
                                                            ติดตามผลงานของเราได้ที่ เพจ EnJoyBook
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
  )
}

export default BookDetailPage