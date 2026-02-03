'use client';

import React, { useState, useEffect } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import Image from 'next/image';
import apiClient from '@/services/apiClient';

declare global {
  interface Window {
    google: any;
  }
}

const LoginGoogle = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, updateToken } = useAuthStore();
  const { closeLoginModal } = useUIStore();

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
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

  useEffect(() => {
    // Load Google Sign-In SDK
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleLogin = () => {
    setLoading(true);

    if (typeof window === 'undefined' || !window.google) {
      message.error('Google Sign-In SDK ยังไม่โหลด กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
      return;
    }

    // Reset One Tap cooldown (Clear g_state cookie)
    document.cookie = `g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT`;

    // Initialize Google Sign-In with callback
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render Google Sign-In button and trigger click
    const googleButtonDiv = document.createElement('div');
    googleButtonDiv.style.display = 'none';
    document.body.appendChild(googleButtonDiv);

    window.google.accounts.id.renderButton(googleButtonDiv, {
      theme: 'outline',
      size: 'large',
    });

    // Trigger the Google Sign-In prompt
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('Google Prompt Error:', {
          notDisplayedReason: notification.getNotDisplayedReason(),
          skippedReason: notification.getSkippedReason()
        });

        // Fallback: Show error if One Tap doesn't work
        setLoading(false);
        message.info(`กรุณาอนุญาตการเข้าสู่ระบบผ่าน Google (${notification.getNotDisplayedReason()})`);
      }
    });

    // Cleanup
    setTimeout(() => {
      if (document.body.contains(googleButtonDiv)) {
        document.body.removeChild(googleButtonDiv);
      }
    }, 1000);
  };

  const handleGoogleResponse = async (response: any) => {
    try {
      if (response.credential) {
        const idToken = response.credential;

        // Send to Backend
        await sendToBackend(idToken);
      } else {
        setLoading(false);
        message.error('ไม่พบข้อมูลจาก Google');
      }
    } catch (error) {
      setLoading(false);
      message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Google');
    }
  };

  const sendToBackend = async (idToken: string) => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/login/google`, {
        idToken: idToken,
      });


      if (response.data && response.data.data) {
        const userData = response.data.data;

        let token = '';
        let userInfo = {
          fullname: 'Google User',
          email: 'user@google.com',
          role: 'user',
          userId: ''
        };

        // Check if userData is the token string itself
        if (typeof userData === 'string') {
          token = userData;
        } else {
          // Backend ส่ง userProfile มา
          userInfo = {
            fullname: userData.fullname || userData.name || 'Google User',
            email: userData.email || 'user@google.com',
            role: userData.role || 'user',
            userId: userData.user_id || userData.userID
          };

          // ตรวจสอบ token จากหลายแหล่ง
          token = userData.token ||
            userData.pws ||
            response.headers?.authorization ||
            response.headers?.['x-auth-token'];
        }


        if (token) {
          // Set cookies
          setCookie('token', token, 365);
          setCookie('closePopupPolicy', '', 365);

          login(userInfo, token);

          // Update user data from token payload immediately
          updateToken(token);

          message.success('เข้าสู่ระบบผ่าน Google สำเร็จ!');

          // ปิด Modal
          closeLoginModal();

          // Redirect Logic
          const navi = checkBeforeLogin(token);
          if (navi) {
            window.location.href = '/';
          } else {
            window.location.reload();
          }
        } else {
          message.error('ไม่พบ token จาก Backend - กรุณาติดต่อผู้ดูแลระบบ');
        }
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={!loading ? handleGoogleLogin : undefined}
      className={`border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-blue-50 transition-colors ${loading ? 'opacity-50 cursor-wait' : ''
        }`}
    >
      <Image
        className="inline-block h-[23px] w-[23px] rounded-full"
        src="/images/Google.png"
        alt="Google Login"
        width={23}
        height={23}
      />
    </div>
  );
};

export default LoginGoogle;
