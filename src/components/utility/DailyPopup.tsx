"use client";

import React, { useEffect } from 'react';
import { Modal} from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { useUIStore } from '@/stores/uiStore';
import Image from 'next/image';

// --- 1. Import Swiper ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { fetchHomeData, PopupItem } from '@/services/apiServices';

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

interface PromoItem {
  id: number;
  imageUrl: string;
  linkUrl: string;
}

const DailyPromoPopup: React.FC = () => {
  const { isDailyPopupOpen, openDailyPopup, closeDailyPopup } = useUIStore();
  const [promoItems, setPromoItems] = React.useState<PromoItem[]>([]);

  useEffect(() => {
    const initPopup = async () => {
      try {
        const homeData = await fetchHomeData();
        if (homeData?.data?.popup && homeData.data.popup.length > 0) {
          const mappedItems = homeData.data.popup.map((item: PopupItem) => {
             let link = '#';
             if (item.type_link === 'novel') {
                link = item.ref_id ? `/book/${item.ref_id}` : `/book/${item.popup_id}`; 
             } else if (item.txt && (item.txt.startsWith('http') || item.txt.startsWith('/'))) {
                link = item.txt;
             }
             return {
                id: item.popup_id,
                imageUrl: item.img,
                linkUrl: link
             };
          });
          setPromoItems(mappedItems);

          const lastCloseDate = localStorage.getItem(STORAGE_KEY);
          if (!lastCloseDate || !isSameDay(parseInt(lastCloseDate, 10), Date.now())) {
            openDailyPopup();
          }
        }
      } catch (error) {
        console.error("Failed to fetch daily popup", error);
      }
    };
    initPopup();
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

  if (promoItems.length === 0) return null;

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
              <a href={item.linkUrl} className="w-full flex flex-col bg-white">
                {/* ===== MODIFIED: ลดความสูงของรูปภาพลง 18px ===== */}
                <div className="relative h-[452px] w-[370px]">
                  <div className="bg-gradient-to-b from-black opacity-70 h-20 absolute w-full top-0 z-10 ml-1.5 mt-1 rounded-lg"></div>
                  <Image
                    src={item.imageUrl}
                    alt={`Promotion ${item.id}`}
                    className="w-full h-full object-cover ml-1 rounded-lg mt-1"
                    width={392}
                    height={490}
                    unoptimized
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

