'use client';

import React, { useState, useEffect } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import axios from 'axios';
import Image from 'next/image';

const LoginFacebook = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  // เพิ่ม state เพื่อเช็คว่า SDK พร้อมใช้งานหรือยัง
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const router = useRouter();
  const { login, updateToken } = useAuthStore();
  const { closeLoginModal } = useUIStore();

  const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_ID || '1967780540282892';
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.214:4005';

  // 1. ย้ายการ Initialize SDK มาไว้ใน useEffect ทำงานทันทีที่ Mount
  useEffect(() => {
    initFacebookSDK();
  }, []);

  const initFacebookSDK = () => {
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
      script.crossOrigin = 'anonymous';
      document.body.appendChild(script);
    }
  };

  const handleFacebookLogin = () => {
    // ถ้า SDK ยังไม่มา ให้ return หรือแจ้งเตือน (แต่ปกติปุ่มจะ disable หรือรอโหลดอยู่แล้ว)
    if (!isSdkLoaded || !(window as any).FB) {
      console.warn('Facebook SDK not ready yet');
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
          setLoading(false);
          // message.warning('ยกเลิกการเชื่อมต่อ Facebook');
        }
      },
      { scope: 'public_profile,email' }
    );
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
      const response = await axios.post(`${API_BASE_URL}/login/facebook`, {
        accessToken: accessToken
      });

      if (response.data && response.data.data) {
        const userData = response.data.data;
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
          userInfo = {
            fullname: userData.fullname || userData.name || 'Facebook User',
            email: userData.email || 'user@facebook.local',
            role: userData.role || 'user',
            userId: userData.user_id || userData.userID
          };
          token = userData.token || userData.pws || response.headers?.authorization || response.headers?.['x-auth-token'];
        }

        if (token) {
          login(userInfo, token);
          updateToken(token);
          message.success('เข้าสู่ระบบผ่าน Facebook สำเร็จ!');
          closeLoginModal();
          setTimeout(() => {
            router.push('/');
          }, 500);
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