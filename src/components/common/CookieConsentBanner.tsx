'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Switch } from 'antd';
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
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check if user has already made a choice
    const storedConsent = localStorage.getItem('enjoybook-cookie-consent');
    if (!storedConsent) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsAnimatedIn(true), 150);
      return () => clearTimeout(timer);
    } else {
      try {
        setPreferences(JSON.parse(storedConsent));
      } catch (e) {
        setIsRendered(true);
        const timer = setTimeout(() => setIsAnimatedIn(true), 150);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const savePreferences = (newPrefs: CookieConsentPreferences) => {
    localStorage.setItem('enjoybook-cookie-consent', JSON.stringify(newPrefs));
    setPreferences(newPrefs);
    
    setIsAnimatedIn(false);
    setIsSettingsOpen(false);
    
    setTimeout(() => {
      setIsRendered(false);
    }, 400);
    
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

  if (!isRendered) return null;

  return (
    <>
      {/* Centered Wide Floating Consent Card - White and Red Theme */}
      <div 
        data-nosnippet
        className={`fixed z-[2000] left-1/2 bottom-4 -translate-x-1/2
          w-[calc(100%-2rem)] md:w-[760px] lg:w-[860px] max-w-6xl
          bg-white border border-stone-200 
          shadow-[0_20px_50px_rgba(185,28,28,0.14)]
          rounded-2xl p-4 md:p-5
          transition-all duration-400 ease-out transform
          ${isAnimatedIn ? 'opacity-100 translate-y-0 -translate-x-1/2 scale-100' : 'opacity-0 translate-y-12 -translate-x-1/2 scale-95 pointer-events-none'}
        `}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          {/* Left part: Icon & Text */}
          <div className="flex items-start md:items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-50 text-red-650 shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S9 9.33 9 8.5 9.67 7 10.5 7zm-3 6c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S6 15.33 6 14.5 6.67 13 7.5 13zm5.5 5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S13 13.33 13 12.5 13.67 11 14.5 11zm3.5-3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-slate-900 leading-snug font-primary md:inline mr-2">
                เราใช้คุกกี้เพื่อประสบการณ์ที่ดีของคุณ
              </h3>
              <p className="mt-1 md:mt-0 text-xs text-slate-600 leading-relaxed font-primary font-normal md:inline">
                เว็บไซต์นี้ใช้คุกกี้เพื่อเพิ่มประสิทธิภาพ และมอบประสบการณ์การใช้งานที่ดีที่สุดสำหรับคุณ คุณสามารถเลือกตั้งค่าความยินยอมการใช้คุกกี้ได้ หรืออ่านรายละเอียดเพิ่มเติมได้ที่{' '}
                <Link href="/policy-privacy" target="_blank" className="text-red-650 font-bold hover:text-red-700 underline underline-offset-2 transition-colors whitespace-nowrap">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </p>
            </div>
          </div>

          {/* Right part: Action Buttons */}
          <div className="flex gap-2.5 shrink-0 justify-end w-full md:w-auto">
            <button 
              type="button"
              className="flex-1 md:flex-none py-2 px-5 border border-stone-300 bg-white text-slate-800 hover:bg-stone-50 active:bg-stone-100 font-bold text-xs md:text-sm rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-100 font-primary cursor-pointer text-center whitespace-nowrap" 
              onClick={() => setIsSettingsOpen(true)}
            >
              ตั้งค่าคุกกี้
            </button>
            <button 
              type="button" 
              className="flex-1 md:flex-none py-2 px-6 bg-red-600 hover:bg-red-700 !text-white font-extrabold text-xs md:text-sm rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-primary cursor-pointer text-center whitespace-nowrap"
              onClick={handleAcceptAll}
            >
              ยอมรับทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal - Light Theme styled */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S9 9.33 9 8.5 9.67 7 10.5 7zm-3 6c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S6 15.33 6 14.5 6.67 13 7.5 13zm5.5 5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S13 13.33 13 12.5 13.67 11 14.5 11zm3.5-3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
            </svg>
            <span className="text-lg font-extrabold text-slate-900 font-primary">ตั้งค่าคุกกี้</span>
          </div>
        }
        open={isSettingsOpen}
        onCancel={() => setIsSettingsOpen(false)}
        footer={
          <div className="flex justify-between items-center w-full mt-4 pt-3 border-t border-stone-100 font-primary">
            <button 
              type="button" 
              className="py-2 px-5 border border-stone-250 hover:bg-stone-50 text-slate-800 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer bg-white"
              onClick={handleAcceptAll}
            >
              ยอมรับทั้งหมด
            </button>
            <button 
              type="button" 
              className="py-2 px-6 bg-red-600 hover:bg-red-700 !text-white text-sm font-bold rounded-full shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer"
              onClick={handleSaveSettings}
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        }
        centered
        width={600}
        zIndex={2100}
        className="cookie-consent-modal font-primary"
      >
        <div className="flex flex-col gap-4 py-4 font-primary">
          <p className="text-sm text-slate-655">
            คุณสามารถเลือกปรับเปลี่ยนการตั้งค่าคุกกี้ได้ตามความต้องการ ยกเว้นคุกกี้ที่จำเป็นอย่างยิ่ง ซึ่งไม่สามารถปิดการใช้งานได้
          </p>

          {/* Necessary Cookies */}
          <div className="flex items-start justify-between bg-stone-50 p-4 rounded-xl border border-stone-100 transition-colors">
            <div className="pr-4">
              <h4 className="font-bold text-slate-800 text-sm md:text-base mb-1">คุกกี้ที่จำเป็น (Strictly Necessary Cookies)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                คุกกี้ประเภทนี้มีความจำเป็นต่อการทำงานของเว็บไซต์ เพื่อให้เว็บไซต์สามารถทำงานได้ตามปกติ มีความปลอดภัย และให้บริการได้ตามที่คุณร้องขอ ไม่สามารถปิดการใช้งานได้
              </p>
            </div>
            <Switch checked={true} disabled className="mt-1" />
          </div>

          {/* Functional Cookies */}
          <div className="flex items-start justify-between p-4 rounded-xl border border-stone-100 hover:border-red-100 transition-colors bg-white">
            <div className="pr-4">
              <h4 className="font-bold text-slate-800 text-sm md:text-base mb-1">คุกกี้เพื่อการทำงานของเว็บไซต์ (Functionality Cookies)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                คุกกี้ประเภทนี้จะช่วยให้เว็บไซต์จดจำตัวเลือกต่างๆ ที่คุณได้ตั้งค่าไว้ (เช่น ภาษา, รูปแบบการแสดงผล) เพื่อมอบประสบการณ์การใช้งานที่เหมาะสมกับคุณมากที่สุด
              </p>
            </div>
            <Switch 
              checked={preferences.functional} 
              onChange={(checked) => setPreferences({...preferences, functional: checked})}
              className="mt-1 [&.ant-switch-checked]:!bg-red-600 bg-stone-300" 
            />
          </div>

          {/* Analytical Cookies */}
          <div className="flex items-start justify-between p-4 rounded-xl border border-stone-100 hover:border-red-100 transition-colors bg-white">
            <div className="pr-4">
              <h4 className="font-bold text-slate-800 text-sm md:text-base mb-1">คุกกี้เพื่อการวิเคราะห์ (Analytical/Performance Cookies)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                คุกกี้ประเภทนี้ช่วยให้เราเข้าใจรูปแบบการใช้งานเว็บไซต์ จำนวนผู้เข้าชม และพฤติกรรมการใช้งาน เพื่อนำไปปรับปรุงและพัฒนาประสิทธิภาพของเว็บไซต์ให้ดียิ่งขึ้น
              </p>
            </div>
            <Switch 
              checked={preferences.analytical} 
              onChange={(checked) => setPreferences({...preferences, analytical: checked})}
              className="mt-1 [&.ant-switch-checked]:!bg-red-600 bg-stone-300" 
            />
          </div>

          {/* Advertising Cookies */}
          <div className="flex items-start justify-between p-4 rounded-xl border border-stone-100 hover:border-red-100 transition-colors bg-white">
            <div className="pr-4">
              <h4 className="font-bold text-slate-800 text-sm md:text-base mb-1">คุกกี้เพื่อการโฆษณา (Advertising Cookies)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                คุกกี้ประเภทนี้จะจดจำสิ่งที่คุณเคยเข้าชม เพื่อนำไปวิเคราะห์และนำเสนอสินค้า บริการ หรือโฆษณาให้ตรงกับความสนใจของคุณมากที่สุด
              </p>
            </div>
            <Switch 
              checked={preferences.advertising} 
              onChange={(checked) => setPreferences({...preferences, advertising: checked})}
              className="mt-1 [&.ant-switch-checked]:!bg-red-600 bg-stone-300" 
            />
          </div>

        </div>
      </Modal>
    </>
  );
}
