'use client';

import React, { useState } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import axios from 'axios';
import Image from 'next/image';

// Declare LIFF type for Window
declare global {
  interface Window {
    liff: any;
  }
}

const LoginLine = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();
  const { closeLoginModal } = useUIStore();

  const LIFF_ID = process.env.NEXT_PUBLIC_LINE_LIFF_ID || '2008384593-5BLnp8gx';
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.194:3331';

  const handleLineLogin = async () => {
    setLoading(true);

    try {
      // Load LIFF SDK if not loaded
      if (!window.liff) {
        await loadLIFFScript();
      }

      // Initialize LIFF
      if (!window.liff.isInClient()) {
        await window.liff.init({ liffId: LIFF_ID });
      }

      // Check if already logged in
      if (!window.liff.isLoggedIn()) {
        // Redirect to LINE login
        window.liff.login();
        return;
      }

      // Get LINE profile
      const profile = await window.liff.getProfile();
      const decoded = window.liff.getDecodedIDToken();
      
      console.log('LINE Profile:', profile);
      console.log('LINE Decoded Token:', decoded);

      // Send to backend
      await sendToBackend(profile, decoded);
    } catch (error) {
      console.error('LINE Login Error:', error);
      message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน LINE');
      setLoading(false);
    }
  };

  const loadLIFFScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.liff) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load LIFF SDK'));
      
      document.head.appendChild(script);
    });
  };

  const sendToBackend = async (profile: any, decoded: any) => {
    try {
      const linePayload = {
        name: profile.displayName,
        email: decoded?.email || '',
        userId: profile.userId,
        picture: profile.pictureUrl,
      };

      console.log('📤 LINE Payload:', linePayload);

      const response = await axios.post(`${API_BASE_URL}/login/line`, linePayload);

      console.log('✅ Backend Response:', response.data);
      console.log('📋 Response Headers:', response.headers);

      if (response.data && response.data.data) {
        const userData = response.data.data;

        // Backend ส่ง userProfile มา
        const userInfo = {
          fullname: userData.fullname || userData.name || profile.displayName || 'LINE User',
          email: userData.email || decoded?.email || 'user@line.local',
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
          message.success('เข้าสู่ระบบผ่าน LINE สำเร็จ!');

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
      message.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={!loading ? handleLineLogin : undefined}
      className={`border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-green-50 transition-colors ${
        loading ? 'opacity-50 cursor-wait' : ''
      }`}
    >
      <Image
        className="inline-block h-[23px] w-[23px] rounded-full"
        src="https://img.enjoybook.co/img/icon-img/social-2.png"
        alt="LINE Login"
        width={23}
        height={23}
      />
    </div>
  );
};

export default LoginLine;
