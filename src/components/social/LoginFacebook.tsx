'use client';
import { useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import apiClient from '@/services/apiClient';
import Image from 'next/image';
import { useLogger } from '@/hooks/useLogger';
import { getAuthSession } from '@/services/authPersistence';
import { completeProviderSession, PUBLIC_AUTH_REQUEST_CONFIG } from '@/features/auth/providerSession';

interface UserData {
  fullname?: string;
  name?: string;
  email?: string;
  role?: string;
  user_id?: string | number;
  userID?: string | number;
  token?: string;
  pws?: string;
}

/**
 * ตรวจสอบว่าเป็น mobile browser หรือ in-app browser หรือไม่
 */
const isMobileBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  return /android|iphone|ipad|ipod|mobile|phone|webos|opera mini|opera mobi|iemobile|windows phone|blackberry|bb10|fban|fbav|instagram|line\//i.test(ua);
};

const LoginFacebook = () => {
  const { notification } = App.useApp();
  const [loading, setLoading] = useState(false);
  // เพิ่ม state เพื่อเช็คว่า SDK พร้อมใช้งานหรือยัง
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { login } = useAuthStore();
  const { closeLoginModal } = useUIStore();
  const { log: logActivity } = useLogger();

  const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_ID;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Helper to set cookies
  const setCookie = (name: string, value: string, days: number = 365) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "") + ";" + expires + ";path=/";
  };

  // Helper to check token status before login
  const checkBeforeLogin = (token: string): boolean => {
    try {
      if (!token) return false;
      return false;
    } catch {
      return false;
    }
  };

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(isMobileBrowser());
  }, []);

  // 1. ย้ายการ Initialize SDK มาไว้ใน useEffect ทำงานทันทีที่ Mount
  const initFacebookSDK = useCallback(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).FB) {
      setIsSdkLoaded(true);
      return;
    }

    // Setup function ที่ FB จะเรียกเมื่อโหลด script เสร็จ
    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      setIsSdkLoaded(true);
    };

    // Load Script
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/th_TH/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    // Mobile: ไม่ต้องรอ SDK เพราะใช้ window.open redirect แทน
    if (isMobileBrowser()) {
      setIsSdkLoaded(true);
    }
  }, [FACEBOOK_APP_ID]);

  useEffect(() => {
    initFacebookSDK();
  }, [initFacebookSDK]);

  useEffect(() => {
    // 1. ฟัง Storage Event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'fb_login_success' && e.newValue) {
        try { localStorage.removeItem('fb_login_success'); } catch {}
        closeLoginModal();
        window.location.reload();
      }
    };
    
    // 2. ฟัง Message Event
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'FACEBOOK_LOGIN_SUCCESS') {
        try { localStorage.removeItem('fb_login_success'); } catch {}
        closeLoginModal();
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleMessage);
    };
  }, [closeLoginModal]);

  /**
   * Mobile: เปิด Facebook OAuth ใน new tab
   * ใช้ window.open จาก user gesture โดยตรง → mobile browser อนุญาต
   */
  const handleMobileLogin = () => {
    if (!FACEBOOK_APP_ID) return;
    setLoading(true);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    // ปรับ URI เป็น /facebook/callback ตามที่คุณตั้งไว้ใน console
    const redirectUri = `${baseUrl}/facebook/callback`;
    const scope = 'public_profile,email';

    const fbOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=token`;

    // รีไดเรกต์ไป Facebook ทันที (ไม่ใช้ Popup)
    window.location.href = fbOAuthUrl;
  };

  const handleFacebookLogin = () => {
    if (loading) return;

    // Mobile → เปิด new tab
    if (isMobile) {
      handleMobileLogin();
      return;
    }

    // Desktop → FB.login popup เหมือนเดิม
    if (!isSdkLoaded || !(window as any).FB) {
      return;
    }

    setLoading(true);

    // 2. เรียก FB.login โดยตรงทันที ไม่มีการ await หรือ promise คั่นก่อนหน้า
    (window as any).FB.login(
      (response: any) => {
        if (response.authResponse) {
          const { accessToken } = response.authResponse;
          fetchFacebookProfile(accessToken);
        } else {
          // Popup ถูกปิด/redirect โดย FB SDK ไม่ได้ authResponse
          // เช็คว่า callback page ทำ login สำเร็จแล้วหรือยัง (ผ่าน localStorage)
          setTimeout(() => {
            try {
              if (localStorage.getItem('fb_login_success')) {
                localStorage.removeItem('fb_login_success');
                closeLoginModal();
                window.location.reload();
                return;
              }
            } catch {}
            setLoading(false);
          }, 1500);
        }
      },
      { scope: 'public_profile,email' }
    );
  };

  const fetchFacebookProfile = async (accessToken: string) => {
    try {
      await sendToBackend(accessToken);
    } catch {
      notification.error({
        message: 'เข้าสู่ระบบไม่สำเร็จ',
        description: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Facebook',
        placement: 'topRight',
      });
      setLoading(false);
    }
  };

  const sendToBackend = async (accessToken: string) => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/login/facebook`, {
        accessToken: accessToken
      }, PUBLIC_AUTH_REQUEST_CONFIG);

      if (response.data && response.data.data) {
        const userData = response.data.data as UserData | string;
        let token = '';
        let userInfo = {
          fullname: 'Facebook User',
          email: 'user@facebook.local',
          role: 'user',
          userId: ''
        };

        if (typeof userData === 'string') {
          token = userData;
        } else {
          const dataObj = userData as UserData;
          userInfo = {
            fullname: dataObj.fullname || dataObj.name || 'Facebook User',
            email: dataObj.email || 'user@facebook.local',
            role: dataObj.role || 'user',
            userId: String(dataObj.user_id || dataObj.userID || '')
          };
          token = dataObj.token || dataObj.pws || response.headers?.authorization || response.headers?.['x-auth-token'] || '';
        }

        if (token) {
          // Set non-auth cookies only (auth token is managed centrally in authStore)
          setCookie('closePopupPolicy', '', 365);

          await completeProviderSession(login, userInfo, token, 'FACEBOOK');

          logActivity('login', 'user', userInfo.userId || '', { method: 'facebook' });
          notification.success({
            message: 'เข้าสู่ระบบสำเร็จ',
            description: 'เข้าสู่ระบบผ่าน Facebook เรียบร้อยแล้ว',
            placement: 'topRight',
          });
          closeLoginModal();

          // Check logical flow (replaces legacy checkBeforeLogin)
          const navi = checkBeforeLogin(token);
          if (navi) {
            window.location.href = '/';
          } else {
            window.location.reload();
          }
        } else {
          notification.error({
            message: 'เข้าสู่ระบบไม่สำเร็จ',
            description: 'ไม่พบ token จาก Backend',
            placement: 'topRight',
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: 'เข้าสู่ระบบไม่สำเร็จ',
        description: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  // บน mobile ปุ่มพร้อมกดเสมอ (ไม่ต้องรอ SDK)
  const isReady = isMobile || isSdkLoaded;

  return (
    <button
      type="button"
      onClick={isReady && !loading ? handleFacebookLogin : undefined}
      className={`border border-gray-200 rounded-md py-2 flex justify-center items-center w-full hover:bg-blue-50 transition-colors ${(loading || !isReady) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={loading || !isReady}
    >
      <Image
        className="inline-block h-[23px] w-[23px] rounded-full"
        src="/images/social-1.png"
        alt="Facebook Login"
        width={23}
        height={23}
      />
    </button>
  );
};

export default LoginFacebook;
