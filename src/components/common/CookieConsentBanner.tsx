'use client';

import React, { useState, useEffect } from 'react';
import { Button, Modal, Switch } from 'antd';
import Link from 'next/link';

export interface CookieConsentPreferences {
  necessary: boolean;
  functional: boolean;
  advertising: boolean;
  analytical: boolean;
}

const DEFAULT_PREFERENCES: CookieConsentPreferences = {
  necessary: true,
  functional: true,
  advertising: true,
  analytical: true,
};

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check if user has already made a choice
    const storedConsent = localStorage.getItem('enjoybook-cookie-consent');
    if (!storedConsent) {
      setIsVisible(true);
    } else {
      try {
        setPreferences(JSON.parse(storedConsent));
      } catch (e) {
        setIsVisible(true);
      }
    }
  }, []);

  const savePreferences = (newPrefs: CookieConsentPreferences) => {
    localStorage.setItem('enjoybook-cookie-consent', JSON.stringify(newPrefs));
    setPreferences(newPrefs);
    setIsVisible(false);
    setIsSettingsOpen(false);
    
    // Optional: trigger a custom event so other components (like Google Analytics) can know preferences changed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: newPrefs }));
    }
  };

  const handleAcceptAll = () => {
    savePreferences({
      necessary: true,
      functional: true,
      advertising: true,
      analytical: true,
    });
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Banner at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-[2000] bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] p-2.5 pb-3 md:p-3 transition-transform duration-500 transform translate-y-0">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-2 md:gap-3">
          <div className="flex-1 text-[10px] md:text-xs text-gray-600 font-primary leading-snug md:leading-normal">
            <p className="mb-0.5 text-xs md:text-sm font-bold text-gray-900">เราใช้คุกกี้เพื่อประสบการณ์ที่ดีของคุณ</p>
            <span className="hidden md:inline">เว็บไซต์นี้ใช้คุกกี้เพื่อเพิ่มประสิทธิภาพ และประสบการณ์ที่ดีในการใช้งานเว็บไซต์ คุณสามารถเลือกตั้งค่าความยินยอมการใช้คุกกี้ได้ โดยคลิก <strong>&quot;ตั้งค่าคุกกี้&quot;</strong> หรืออ่านรายละเอียดเพิ่มเติมได้ที่{' '}</span>
            <span className="md:hidden">เราใช้คุกกี้เพื่อมอบประสบการณ์การใช้งานที่ดีที่สุดบนเว็บไซต์ของเรา อ่านรายละเอียดเพิ่มเติมได้ที่{' '}</span>
            <Link href="/policy-privacy" target="_blank" className="text-red-600 underline font-semibold hover:text-red-700">
              นโยบายความเป็นส่วนตัว
            </Link>
          </div>
          
          <div className="flex flex-row gap-2 w-full md:w-auto justify-end mt-1.5 md:mt-0">
            <Button 
              className="flex-1 md:flex-none border-gray-300 font-primary text-xs" 
              size="middle"
              onClick={() => setIsSettingsOpen(true)}
            >
              ตั้งค่าคุกกี้
            </Button>
            <Button 
              type="primary" 
              danger 
              size="middle" 
              className="flex-1 md:flex-none font-primary text-xs"
              onClick={handleAcceptAll}
            >
              ยอมรับทั้งหมด
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        title={<div className="text-xl font-bold font-primary text-gray-900 border-b pb-3">ตั้งค่าคุกกี้</div>}
        open={isSettingsOpen}
        onCancel={() => setIsSettingsOpen(false)}
        footer={
          <div className="flex justify-between items-center w-full mt-4">
            <Button type="default" danger onClick={handleAcceptAll} className="font-primary">
              ยอมรับทั้งหมด
            </Button>
            <Button type="primary" danger onClick={handleSaveSettings} className="font-primary">
              บันทึกการตั้งค่า
            </Button>
          </div>
        }
        centered
        width={600}
        zIndex={2100}
      >
        <div className="flex flex-col gap-5 py-2 font-primary">
          <p className="text-sm text-gray-600">
            คุณสามารถเลือกปรับเปลี่ยนการตั้งค่าคุกกี้ได้ตามความต้องการ ยกเว้นคุกกี้ที่จำเป็นอย่างยิ่ง ซึ่งไม่สามารถปิดการใช้งานได้
          </p>

          {/* Necessary Cookies */}
          <div className="flex items-start justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="pr-4">
              <h4 className="font-bold text-gray-900 text-base mb-1">คุกกี้ที่จำเป็น (Strictly Necessary Cookies)</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                คุกกี้ประเภทนี้มีความจำเป็นต่อการทำงานของเว็บไซต์ เพื่อให้เว็บไซต์สามารถทำงานได้ตามปกติ มีความปลอดภัย และให้บริการได้ตามที่คุณร้องขอ ไม่สามารถปิดการใช้งานได้
              </p>
            </div>
            <Switch checked={true} disabled className="mt-1" />
          </div>

          {/* Functional Cookies */}
          <div className="flex items-start justify-between p-4 rounded-lg border border-gray-100">
            <div className="pr-4">
              <h4 className="font-bold text-gray-900 text-base mb-1">คุกกี้เพื่อการทำงานของเว็บไซต์ (Functionality Cookies)</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                คุกกี้ประเภทนี้จะช่วยให้เว็บไซต์จดจำตัวเลือกต่างๆ ที่คุณได้ตั้งค่าไว้ (เช่น ภาษา, รูปแบบการแสดงผล) เพื่อมอบประสบการณ์การใช้งานที่เหมาะสมกับคุณมากที่สุด
              </p>
            </div>
            <Switch 
              checked={preferences.functional} 
              onChange={(checked) => setPreferences({...preferences, functional: checked})}
              className="mt-1 bg-gray-300" 
            />
          </div>

          {/* Analytical Cookies */}
          <div className="flex items-start justify-between p-4 rounded-lg border border-gray-100">
            <div className="pr-4">
              <h4 className="font-bold text-gray-900 text-base mb-1">คุกกี้เพื่อการวิเคราะห์ (Analytical/Performance Cookies)</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                คุกกี้ประเภทนี้ช่วยให้เราเข้าใจรูปแบบการใช้งานเว็บไซต์ จำนวนผู้เข้าชม และพฤติกรรมการใช้งาน เพื่อนำไปปรับปรุงและพัฒนาประสิทธิภาพของเว็บไซต์ให้ดียิ่งขึ้น
              </p>
            </div>
            <Switch 
              checked={preferences.analytical} 
              onChange={(checked) => setPreferences({...preferences, analytical: checked})}
              className="mt-1 bg-gray-300" 
            />
          </div>

          {/* Advertising Cookies */}
          <div className="flex items-start justify-between p-4 rounded-lg border border-gray-100">
            <div className="pr-4">
              <h4 className="font-bold text-gray-900 text-base mb-1">คุกกี้เพื่อการโฆษณา (Advertising Cookies)</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                คุกกี้ประเภทนี้จะจดจำสิ่งที่คุณเคยเข้าชม เพื่อนำไปวิเคราะห์และนำเสนอสินค้า บริการ หรือโฆษณาให้ตรงกับความสนใจของคุณมากที่สุด
              </p>
            </div>
            <Switch 
              checked={preferences.advertising} 
              onChange={(checked) => setPreferences({...preferences, advertising: checked})}
              className="mt-1 bg-gray-300" 
            />
          </div>

        </div>
      </Modal>
    </>
  );
}
