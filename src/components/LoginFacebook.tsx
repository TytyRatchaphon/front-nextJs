'use client';

import React, { useState } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import axios from 'axios';
import Image from 'next/image';

const LoginFacebook = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();
  const { closeLoginModal } = useUIStore();

  const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_ID || '1223450826239717';
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.194:3331';

  const handleFacebookLogin = () => {
    setLoading(true);

    // Load Facebook SDK
    if (typeof window !== 'undefined' && (window as any).FB) {
      (window as any).FB.login(
        (response: any) => {
          if (response.authResponse) {
            const { accessToken } = response.authResponse;
            fetchFacebookProfile(accessToken);
          } else {
            setLoading(false);
            // message.error('การเข้าสู่ระบบผ่าน Facebook ถูกยกเลิก');
          }
        },
        { scope: 'public_profile,email' }
      );
    } else {
      // Initialize Facebook SDK if not loaded
      initFacebookSDK().then(() => {
        handleFacebookLogin();
      });
    }
  };

  const initFacebookSDK = (): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      // Load Facebook SDK script
      if (!(window as any).FB) {
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/th_TH/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          (window as any).FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
          resolve();
        };

        document.body.appendChild(script);
      } else {
        resolve();
      }
    });
  };

  const fetchFacebookProfile = async (accessToken: string) => {
    try {
      // ส่ง accessToken ไปให้ Backend ตรวจสอบเอง
      await sendToBackend(accessToken);
    } catch (error) {
      console.error('Error with Facebook login:', error);
      message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Facebook');
      setLoading(false);
    }
  };

  const sendToBackend = async (accessToken: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login/facebook`, {
        accessToken: accessToken
      });

      console.log('✅ Backend Response:', response.data);
      console.log('📋 Response Headers:', response.headers);

      if (response.data && response.data.data) {
        const userData = response.data.data;
        
        // Backend ส่ง userProfile มา
        const userInfo = {
          fullname: userData.fullname || userData.name || 'Facebook User',
          email: userData.email || 'user@facebook.local',
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
          message.success('เข้าสู่ระบบผ่าน Facebook สำเร็จ!');
          
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
      onClick={!loading ? handleFacebookLogin : undefined}
      className={`border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-blue-50 transition-colors ${loading ? 'opacity-50 cursor-wait' : ''}`}
    >
      <Image
        className="inline-block h-[23px] w-[23px] rounded-full"
        src="https://img.enjoybook.co/img/icon-img/social-1.png"
        alt="Facebook Login"
        width={23}
        height={23}
      />
    </div>
  );
};

export default LoginFacebook;
