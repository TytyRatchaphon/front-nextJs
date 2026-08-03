'use client';
import { useEffect, useRef, useState } from 'react';
import { App, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import apiClient from '@/services/apiClient';
import { useLogger } from '@/hooks/useLogger';
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

const FacebookCallbackContent = () => {
  const router = useRouter();
  const { notification } = App.useApp();
  const { login } = useAuthStore();
  const { closeLoginModal } = useUIStore();
  const { log: logActivity } = useLogger();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const hasRun = useRef(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const setCookie = (name: string, value: string, days: number = 365) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "") + ";" + expires + ";path=/";
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        const hash = window.location.hash.substring(1); // remove '#'
        const hashParams = new URLSearchParams(hash);
        const searchParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const errorParam = hashParams.get('error') || searchParams.get('error');
        if (accessToken || errorParam) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        if (errorParam) {
          setStatus('error');
          notification.error({
            message: 'เข้าสู่ระบบไม่สำเร็จ',
            description: 'ผู้ใช้ยกเลิกการเข้าสู่ระบบ',
            placement: 'topRight',
          });
          router.replace('/');
          return;
        }

        if (!accessToken) {
          setStatus('error');
          // ปิดการแจ้งเตือนตามที่ผู้ใช้ต้องการ (เด้งกลับหน้าหลักเงียบๆ)
          // notification.error({
          //   message: 'เข้าสู่ระบบไม่สำเร็จ',
          //   description: 'ไม่พบ access token จาก Facebook',
          //   placement: 'topRight',
          // });
          router.replace('/');
          return;
        }

        // ทำ login ใน callback page เลย
        await processLogin(accessToken);
      } catch (error: any) {
        console.error('[FACEBOOK_CALLBACK] Login failed');
        setStatus('error');
        notification.error({
          message: 'เข้าสู่ระบบไม่สำเร็จ',
          description: error?.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
          placement: 'topRight',
        });
        router.replace('/');
      }
    };

    const processLogin = async (accessToken: string) => {
      const response = await apiClient.post(`${API_BASE_URL}/login/facebook`, {
        accessToken,
      }, PUBLIC_AUTH_REQUEST_CONFIG);

      if (response.data && response.data.data) {
        const userData = response.data.data as UserData | string;
        let token = '';
        let userInfo = {
          fullname: 'Facebook User',
          email: 'user@facebook.local',
          role: 'user',
          userId: '',
        };

        if (typeof userData === 'string') {
          token = userData;
        } else {
          const dataObj = userData as UserData;
          userInfo = {
            fullname: dataObj.fullname || dataObj.name || 'Facebook User',
            email: dataObj.email || 'user@facebook.local',
            role: dataObj.role || 'user',
            userId: String(dataObj.user_id || dataObj.userID || ''),
          };
          token =
            dataObj.token ||
            dataObj.pws ||
            response.headers?.authorization ||
            response.headers?.['x-auth-token'] ||
            '';
        }

        if (token) {
          setCookie('closePopupPolicy', '', 365);
          await completeProviderSession(login, userInfo, token, 'FACEBOOK');
          logActivity('login', 'user', userInfo.userId || '', { method: 'facebook' });

          setStatus('success');

          closeLoginModal();
          router.replace('/');
        } else {
          setStatus('error');
          notification.error({
            message: 'เข้าสู่ระบบไม่สำเร็จ',
            description: 'ไม่พบ token จาก Backend',
            placement: 'topRight',
          });
          router.replace('/');
        }
      }
    };

    handleCallback();
  }, [API_BASE_URL, closeLoginModal, logActivity, login, notification, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-500 font-primary">
          {status === 'processing' && 'กำลังยืนยันตัวตนผ่าน Facebook...'}
          {status === 'success' && 'เข้าสู่ระบบสำเร็จ กำลังพาคุณกลับไปยังหน้าหลัก...'}
          {status === 'error' && 'เกิดข้อผิดพลาด กำลังพากลับไปยังหน้าหลัก...'}
        </p>
      </div>
    </div>
  );
};

export default FacebookCallbackContent;
