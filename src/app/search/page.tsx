"use client";

import React, { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import { Pagination } from 'antd';
import Image from 'next/image';

function page() {

    const [currentPage, setCurrentPage] = useState<number>(1); // เริ่มที่หน้า 1
    const [pageSize, setPageSize] = useState<number>(10); // เริ่มที่ 10 รายการต่อหน้า
    const totalItems = 500; // ตัวอย่าง: จำนวนข้อมูลทั้งหมด
  
    // ===== 4. (NEW) Handlers สำหรับ Pagination =====
    const handlePageChange = (page: number, pageSize?: number) => {
      console.log('Page changed:', page, pageSize);
      setCurrentPage(page);
      if (pageSize) {
        setPageSize(pageSize);
      }
      // TODO: Fetch ข้อมูลสำหรับหน้าใหม่ (page) และขนาด (pageSize) ที่นี่
    };
  
    const handleSizeChange = (current: number, size: number) => {
      console.log('Size changed:', current, size);
      setCurrentPage(1); // กลับไปหน้า 1 เมื่อเปลี่ยนขนาด
      setPageSize(size);
      // TODO: Fetch ข้อมูลสำหรับหน้า 1 และขนาดใหม่ (size) ที่นี่
    };

  return (
    <div className='bg-white'>
        <div className='relative w-[100vw] items-center flex flex-col'>
            <div className='flex flex-col min-h-[70vh] w-[100vw] relative mb-10'>
                <div className='bg-white select-none'>
                    <div className='flex flex-col  min-h-[70vh] w-[100vw] relative mb-10 '>
                        <SearchBar/>
                        <div className='w-full flex flex-col justify-center items-center'>
                            <div className='min-h-[450px] py-10 px-4'>
                                <div className='w-full flex flex-col justify-center items-center'>
                                    <div className='flex flex-col px-3 lg:max-w-[1000px] w-full lg:w-full max-w-full relative '>
                                        <div className='mb-8 w-full flex justify-center'>
                                            <Pagination
                                                current={currentPage}
                                                pageSize={pageSize}
                                                total={totalItems} 
                                                showSizeChanger // แสดงตัวเลือกขนาดหน้า
                                                onChange={handlePageChange} // เมื่อเปลี่ยนหน้า
                                                onShowSizeChange={handleSizeChange} // เมื่อเปลี่ยนขนาดหน้า
                                                // defaultCurrent={6} // ถ้าอยากเริ่มที่หน้าที่ 6 เหมือนในรูป
                                                // pageSizeOptions={['10', '20', '50']} // ตัวเลือกขนาดหน้า (Default คือ 10, 20, 50, 100)
                                                />
                                        </div>
                                        <div className='grid grid-cols-1 lg:grid-cols-2 lg:px-4 gap-0 '>
                                            <a className='grid grid-cols-8 gap-1 mb-2' href="/book/B2025lpW4lt9hrY1013150138">
                                                <div className='py-1 col-span-3 md:col-span-2 relative items-start' style={{ width: "100%", height: "auto", aspectRatio: "1/1.454"}}>
                                                    <Image src="" alt="" />
                                                </div>
                                            </a>
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

export default page