'use client';

import React, { useState, useEffect } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import apiClient from '@/services/apiClient';
import Image from 'next/image';
import { useLogger } from '@/hooks/useLogger';

import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

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
  const { message, notification } = App.useApp();
  const [loading, setLoading] = useState(false);
  // เพิ่ม state เพื่อเช็คว่า SDK พร้อมใช้งานหรือยัง
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const router = useRouter();
  const { login, updateToken } = useAuthStore();
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
    } catch (e) {
      return false;
    }
  };

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
      notification.error({
        message: 'เข้าสู่ระบบไม่สำเร็จ',
        description: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Facebook',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
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
          logActivity('login', 'user', userInfo.userId || '', { method: 'facebook' });
          notification.success({
            message: 'เข้าสู่ระบบสำเร็จ',
            description: 'เข้าสู่ระบบผ่าน Facebook เรียบร้อยแล้ว',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
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
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
            placement: 'topRight',
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: 'เข้าสู่ระบบไม่สำเร็จ',
        description: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
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