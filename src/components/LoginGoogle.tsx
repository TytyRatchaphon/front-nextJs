'use client';

import React, { useState, useEffect } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import Image from 'next/image';
import axios from 'axios';

declare global {
  interface Window {
    google: any;
  }
}

const LoginGoogle = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();
  const { closeLoginModal } = useUIStore();

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '639784580623-vcqnb3bqkkt04s4597u6hqmdbmhv0vie.apps.googleusercontent.com';
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.194:3331';

  useEffect(() => {
    // Load Google Sign-In SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleLogin = () => {
    setLoading(true);

    if (typeof window === 'undefined' || !window.google) {
      message.error('Google Sign-In SDK ยังไม่โหลด กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
      return;
    }

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
        // Fallback: Show error if One Tap doesn't work
        setLoading(false);
        message.info('กรุณาอนุญาตการเข้าสู่ระบบผ่าน Google');
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
        console.log('Google ID Token:', idToken);
        
        // Send to Backend
        await sendToBackend(idToken);
      } else {
        setLoading(false);
        message.error('ไม่พบข้อมูลจาก Google');
      }
    } catch (error) {
      console.error('Google Response Error:', error);
      setLoading(false);
      message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Google');
    }
  };

  const sendToBackend = async (idToken: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login/google`, {
        idToken: idToken,
      });

      console.log('✅ Backend Response:', response.data);
      console.log('📋 Response Headers:', response.headers);

      if (response.data && response.data.data) {
        const userData = response.data.data;

        // Backend ส่ง userProfile มา
        const userInfo = {
          fullname: userData.fullname || userData.name || 'Google User',
          email: userData.email || 'user@google.com',
          role: userData.role || 'user',
          userId: userData.user_id || userData.userID
        };

        // ตรวจสอบ token จากหลายแหล่ง
        const token = userData.token || 
                     userData.pws || 
                     response.headers?.authorization || 
                     response.headers?.['x-auth-token'];

        console.log('🔑 Token found:', token ? 'Yes' : 'No');

        if (token) {
          login(userInfo, token);
          message.success('เข้าสู่ระบบผ่าน Google สำเร็จ!');

          // ปิด Modal
          closeLoginModal();

          // Redirect ไปหน้า profile
          setTimeout(() => {
            router.push('/sprofile');
          }, 500);
        } else {
          console.error('❌ No token in response');
          console.log('Full userData:', userData);
          message.error('ไม่พบ token จาก Backend - กรุณาติดต่อผู้ดูแลระบบ');
        }
      }
    } catch (error: any) {
      console.error('Backend Error:', error);
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
      className={`border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-blue-50 transition-colors ${
        loading ? 'opacity-50 cursor-wait' : ''
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
