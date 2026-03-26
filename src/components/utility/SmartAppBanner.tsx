"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { CloseOutlined } from '@ant-design/icons';
import { useWebsiteStore } from '@/stores/websiteStore';
import { resolveSettingsImageSrc } from '@/utils/imageUtils';
import {
    DEFAULT_APP_STORE_URL,
    DEFAULT_PLAY_STORE_URL,
    normalizeAppStoreUrl,
    normalizePlayStoreUrl,
} from '@/utils/storeLinkUtils';

const SmartAppBanner = () => {
    const { settings } = useWebsiteStore();
    const [isVisible, setIsVisible] = useState(true);
    const [os, setOs] = useState<'ios' | 'android' | 'other'>('other');

    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        if (/android/i.test(userAgent)) {
            setOs('android');
        } else if (/iPad|iPhone|iPod/i.test(userAgent) && !(window as any).MSStream) {
            setOs('ios');
        } 
        
        const closedAt = localStorage.getItem('smart_app_banner_closed_at');
        if (closedAt) {
            const date = new Date(parseInt(closedAt, 10));
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays < 30) {
                setIsVisible(false);
            }
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('smart_app_banner_closed_at', Date.now().toString());
    };

    const targetUrl = os === 'ios' 
        ? normalizeAppStoreUrl(settings?.app_store, DEFAULT_APP_STORE_URL) 
        : normalizePlayStoreUrl(settings?.play_store, DEFAULT_PLAY_STORE_URL);

    if (!isVisible) return null;

    return (
        // Hidden on large screens (lg:hidden), visible on mobile/tablet
        <div className="w-full bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between shadow-sm relative z-[1300] lg:hidden">
            <div className="flex items-center gap-3">
                <button 
                    onClick={handleClose} 
                    className="text-gray-400 hover:text-gray-600 p-1"
                >
                    <CloseOutlined className="text-sm" />
                </button>
                
                <div className="relative w-10 h-10 bg-white rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                     <Image 
                        src={resolveSettingsImageSrc(settings?.logo, '/images/default-avatar.png')} 
                        alt="App Icon"
                        fill
                        className="object-contain p-1"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }}
                     />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800 leading-tight">EnjoyBook Application</span>
                    <span className="text-xs text-gray-500">เปิดอ่านแอปเพื่อการใช้งานเต็มรูปแบบ</span>
                </div>
            </div>

            <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="!bg-black !text-white text-xs font-bold px-4 py-1.5 rounded-lg whitespace-nowrap shadow-md active:scale-95 transition-transform no-underline hover:!text-white"
            >
                เปิดแอป
            </a>
        </div>
    );
};

export default SmartAppBanner;
