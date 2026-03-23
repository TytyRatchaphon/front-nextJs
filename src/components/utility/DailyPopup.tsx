"use client";

import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useUIStore } from '@/stores/uiStore';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { fetchHomeData, PopupItem } from '@/services/apiServices';

import 'swiper/css';
import 'swiper/css/pagination';

// Helper: Check if dates are same day
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
  const { isDailyPopupOpen, openDailyPopup, closeDailyPopup, setDailyPopupProcessComplete } = useUIStore();
  const [promoItems, setPromoItems] = useState<PromoItem[]>([]);

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
            // Don't set complete yet, waiting for user to close
          } else {
            // Suppressed by local storage
            setDailyPopupProcessComplete(true);
          }
        } else {
             // No popup data found
             setDailyPopupProcessComplete(true);
        }
      } catch {
        // Error fetching
        setDailyPopupProcessComplete(true);
      }
    };
    initPopup();
  }, [openDailyPopup, setDailyPopupProcessComplete]);

  const handleNormalClose = () => {
    closeDailyPopup();
  };

  const handleDisableToday = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    closeDailyPopup();
  };

  if (promoItems.length === 0) return null;

  return (
    <Modal
      open={isDailyPopupOpen}
      onCancel={handleNormalClose}
      centered
      footer={null}
      width={400}
      zIndex={5000}
      closeIcon={null}
      styles={{
        content: { padding: 0, borderRadius: '16px', overflow: 'hidden', background: 'transparent', boxShadow: 'none' },
        mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.6)' }
      }}
      className="custom-daily-popup"
    >
      <div className="relative w-full max-w-[400px] flex flex-col items-center">

        {/* Main Card Content */}
        <div className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl relative">

          {/* Close Button - Floating top right */}
          <button
            onClick={handleNormalClose}
            className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200"
            aria-label="Close"
          >
            <CloseOutlined style={{ fontSize: '14px' }} />
          </button>

          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            loop={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            className="w-full aspect-[3/4]"
          >
            {promoItems.map((item) => (
              <SwiperSlide key={item.id} className="relative w-full h-full group">
                <a href={item.linkUrl} className="block w-full h-full relative overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={`Promotion`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 400px) 100vw, 400px"
                  />
                  {/* Interactive Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <span className="text-white font-medium px-4 py-1.5 border border-white/50 rounded-full text-sm backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-colors">
                      ดูรายละเอียด
                    </span>
                  </div>
                </a>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Footer Action */}
          <div className="bg-white py-3 px-4 flex justify-between items-center border-t border-gray-100">
            <span className="text-gray-500 text-sm font-primary">แนะนำวันนี้</span>
            <button
              onClick={handleDisableToday}
              className="text-xs text-gray-400 hover:!text-red-500 transition-colors flex items-center gap-1 font-primary underline decoration-dotted"
            >
              ไม่ต้องแสดงวันนี้
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default DailyPromoPopup;
