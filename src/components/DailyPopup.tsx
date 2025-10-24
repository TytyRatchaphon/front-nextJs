"use client";

import React, { useEffect } from 'react';
import { Modal, Button } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { useUIStore } from '@/stores/uiStore';

// --- 1. Import Swiper ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';

// --- 2. Import CSS ของ Swiper ---
import 'swiper/css';
import 'swiper/css/pagination';

// --- ฟังก์ชันและ Key สำหรับจัดการ "วันละครั้ง" (เหมือนเดิม) ---
const isSameDay = (timestamp1: number, timestamp2: number): boolean => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};
const STORAGE_KEY = 'enjoybook_promo_popup_closed_date';

// --- (ตัวอย่าง) ข้อมูลโปรโมชั่น ---
const promoItems = [
  {
    id: 1,
    imageUrl: 'https://img.enjoybook.co/img/book/Pop2025cxkrqGokKh1001215333.png',
    linkUrl: 'https://www.enjoybook.co/book/B20250pkVIWcfLV1001120651',
  },
];

const DailyPromoPopup: React.FC = () => {
  const { isDailyPopupOpen, openDailyPopup, closeDailyPopup } = useUIStore();

  useEffect(() => {
    const lastCloseDate = localStorage.getItem(STORAGE_KEY);
    if (!lastCloseDate || !isSameDay(parseInt(lastCloseDate, 10), Date.now())) {
      openDailyPopup();
    }
  }, [openDailyPopup]);

  const handleNormalClose = () => {
    closeDailyPopup();
  };

  const handleDisableToday = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    closeDailyPopup();
  };

  const customCloseIcon = (
    <span className="custom-close-icon" style={{ color: 'white', fontSize: '24px', position: 'absolute', top: '10px', right: '10px', zIndex: 20 }}>
      <CloseCircleFilled />
    </span>
  );

  return (
    <Modal
      open={isDailyPopupOpen}
      onCancel={handleNormalClose}
      centered
      footer={null}
      width={400}
      closeIcon={customCloseIcon}
      styles={{
        content: { padding: 0, borderRadius: '8px', overflow: 'hidden' },
        body: { padding: '4px', paddingBottom: '0' } // Padding นี้จะทำให้เนื้อหากว้าง 392px
      }}
    >
      <div className="relative w-full">
        
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true }}
          autoHeight={true}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          className="mySwiper"
        >
          {promoItems.map((item) => (
            <SwiperSlide key={item.id}>
              <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="w-full flex flex-col bg-white">
                {/* ===== MODIFIED: ลดความสูงของรูปภาพลง 18px ===== */}
                <div className="relative h-[472px]">
                  <div className="bg-gradient-to-b from-black opacity-70 h-20 absolute w-full top-0 z-10 ml-1.5 mt-1 rounded-lg"></div>
                  <img 
                    src={item.imageUrl}
                    alt={`Promotion ${item.id}`}
                    className="w-full h-full object-cover ml-1 rounded-lg mt-1"
                  />
                </div>
                
                <p className="py-2 text-lg text-center text-gray-700 font-primary hover-link">ตามไปอ่านกัน</p>
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
        
        <button 
          onClick={handleDisableToday}
          className="bg-white opacity-80 absolute z-20 py-1 px-2 top-2 left-2 text-sm hover:text-primary hover:opacity-90 text-black rounded-md hover-link"
        >
          ปิดการแจ้งเตือนทั้งหมด
        </button>

      </div>
    </Modal>
  );
};

export default DailyPromoPopup;

