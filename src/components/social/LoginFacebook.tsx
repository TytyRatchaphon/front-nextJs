'use client';

import React, { useState, useEffect } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import apiClient from '@/services/apiClient';
import { logActivity } from '@/services/apiServices';
import Image from 'next/image';

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

const LoginFacebook = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  
  const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_ID;
  // console.log('[FB-DEBUG] Render LoginFacebook, ID from env:', FACEBOOK_APP_ID);
  // เพิ่ม state เพื่อเช็คว่า SDK พร้อมใช้งานหรือยัง
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const router = useRouter();
  const { login, updateToken } = useAuthStore();
  const { closeLoginModal } = useUIStore();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Helper to set cookies
  const setCookie = (name: string, value: string, days: number = 365) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "") + ";" + expires + ";path=/";
  };

  const checkBeforeLogin = (token: string): boolean => {
    try {
      if (!token) return false;
      return false;
    } catch (e) {
      return false;
    }
  };

  // 1. ย้ายการ Initialize SDK มาไว้ใน useEffect ทำงานทันทีที่ Mount
  useEffect(() => {
    initFacebookSDK();
  }, []);

  const initFacebookSDK = () => {
    // console.log('[FB-DEBUG] initFacebookSDK called, APP_ID:', FACEBOOK_APP_ID);
    if (typeof window === 'undefined') return;

    // ฟังก์ชันช่วยสำหรับการทำ init FB 
    const initFB = () => {
      if ((window as any).FB && !(window as any).isFbInitialized) {
        try {
          (window as any).FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
          (window as any).isFbInitialized = true;
        } catch (e) {
          console.error("Facebook SDK init error", e);
        }
      }
      setIsSdkLoaded(true);
    };

    // 1. ถ้า FB โหลดเสร็จและพร้อมใช้งานแล้ว เช็คว่าถูก init ไปหรือยัง
    if ((window as any).FB) {
      initFB();
      return;
    }

    // 2. ตั้งค่า Callback ให้ FB เรียกเมื่อ Script โหลดเสร็จ (Official way)
    (window as any).fbAsyncInit = initFB;

    // 3. ป้องกันการแทรก Script ซ้ำซ้อน
    if (document.getElementById('facebook-jssdk')) {
      return;
    }

    // 4. แทรก Script FB SDK
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/th_TH/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    // สั่งให้ Cloudflare Rocket Loader ปล่อยผ่าน (ไม่ต้องมายุ่งกับไฟล์นี้)
    script.setAttribute('data-cfasync', 'false');
    
    // Fallback: ถ้า script โหลดเสร็จแต่ fbAsyncInit ไม่ถูกเรียก (เช่น Cached)
    script.onload = () => {
       initFB();
    };

    document.body.appendChild(script);
  };

  const handleFacebookLogin = () => {
    console.log('[FB-DEBUG] handleFacebookLogin clicked (Redirect Mode)');
    
    // แทนที่จะใช้ FB.login (Popup) เราจะใช้ Manual OAuth Redirect
    // เพื่อหลีกเลี่ยงปัญหา Popup Blocked และ SDK โหลดไม่ขึ้นในบางเบราว์เซอร์
    const redirectUri = `${window.location.origin}/facebook-callback`;
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=public_profile,email`;
    
    setLoading(true);
    window.location.href = oauthUrl;
  };

  const fetchFacebookProfile = async (accessToken: string) => {
    try {
      await sendToBackend(accessToken);
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Facebook');
      setLoading(false);
    }
  };

  const sendToBackend = async (accessToken: string) => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/login/facebook`, {
        accessToken: accessToken
      });

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
          // Set cookies as per legacy requirement
          setCookie('token', token, 365);
          setCookie('closePopupPolicy', '', 365);

          login(userInfo, token);
          updateToken(token);

          // Log login event
          console.log('[LOG] login =>', { method: 'facebook' });
          logActivity({ action: 'login', target_type: 'user', target_id: userInfo.userId || '', metadata: { method: 'facebook' } });

          message.success('เข้าสู่ระบบผ่าน Facebook สำเร็จ!');
          closeLoginModal();

          // Check logical flow (replaces legacy checkBeforeLogin)
          const navi = checkBeforeLogin(token);
          if (navi) {
            window.location.href = '/';
          } else {
            window.location.reload();
          }
        } else {
          message.error('ไม่พบ token จาก Backend');
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(!loading && isSdkLoaded) ? handleFacebookLogin : undefined}
      className={`border border-gray-200 rounded-md py-2 flex justify-center items-center w-full hover:bg-blue-50 transition-colors ${(loading || !isSdkLoaded) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={loading || !isSdkLoaded}
    >
      <Image
        className="inline-block h-[23px] w-[23px] rounded-full"
        src="/images/social-1.png"
        alt="Facebook Login"
        width={23}
        height={23}
        unoptimized
      />
    </button>
  );
};

export default LoginFacebook;