"use client";
import * as React from "react";
import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { DownloadOutlined, AppleOutlined, AndroidOutlined } from '@ant-design/icons';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import {
    DEFAULT_APP_STORE_URL,
    DEFAULT_PLAY_STORE_URL,
    normalizeAppStoreUrl,
    normalizePlayStoreUrl,
} from '@/utils/storeLinkUtils';
import { openSafeExternalInNewTab } from '@/utils/navigationUtils';

interface SmartDownloadButtonProps {
    className?: string;
    label?: string;
    children?: React.ReactNode;
}

const SmartDownloadButton: React.FC<SmartDownloadButtonProps> = ({ className, label = 'Download App', children }) => {
    const { settings } = useWebsiteSettings();
    const [os, setOs] = useState<'ios' | 'android' | 'other' | null>(null);

    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

        if (/android/i.test(userAgent)) {
            setOs('android');
        } else if (/iPad|iPhone|iPod|Macintosh|Mac OS X/i.test(userAgent) && !(window as any).MSStream) {
            setOs('ios');
        } else {
            setOs('other');
        }
    }, []);

    const handleClick = () => {
        const iosLink = normalizeAppStoreUrl(settings?.app_store, DEFAULT_APP_STORE_URL);
        const androidLink = normalizePlayStoreUrl(settings?.play_store, DEFAULT_PLAY_STORE_URL);

        if (os === 'ios') {
            openSafeExternalInNewTab(iosLink);
        } else if (os === 'android') {
            openSafeExternalInNewTab(androidLink);
        } else {
            // Fallback for Desktop: Open both or just Play Store?
            // User request implies just "Download App", usually Play Store is a safe default for web
            openSafeExternalInNewTab(androidLink);
        }
    };

    if (children) {
        return (
            <div
                onClick={handleClick}
                className={`cursor-pointer ${className}`}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleClick();
                    }
                }}
            >
                {children}
            </div>
        );
    }

    // Default rendering if no children
    if (os === null) return null;

    let Icon = DownloadOutlined;
    if (os === 'ios') Icon = AppleOutlined;
    if (os === 'android') Icon = AndroidOutlined;

    return (
        <Button
            type="primary"
            shape="round"
            icon={<Icon />}
            size="large"
            onClick={handleClick}
            className={`${className} bg-red-600 border-red-600 hover:bg-red-500 hover:border-red-500 text-white font-bold shadow-md flex items-center justify-center`}
        >
            {label}
        </Button>
    );
};

export default SmartDownloadButton;
