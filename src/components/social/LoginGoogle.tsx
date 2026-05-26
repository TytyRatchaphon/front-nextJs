'use client';
import { useState, useEffect, useRef } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import apiClient from '@/services/apiClient';
import { useLogger } from '@/hooks/useLogger';

declare global {
  interface Window {
    google: any;
  }
}

const LoginGoogle = () => {
  const { notification } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  useRouter();
  const { login, updateToken } = useAuthStore();
  const { closeLoginModal } = useUIStore();
  const { log: logActivity } = useLogger();

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
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setIsSdkReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    const script = existingScript ?? document.createElement('script');
    const handleLoad = () => setIsSdkReady(true);

    script.addEventListener('load', handleLoad);

    if (!existingScript) {
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    return () => {
      script.removeEventListener('load', handleLoad);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      if (response.credential) {
        setLoading(true);
        const idToken = response.credential;

        // Send to Backend
        await sendToBackend(idToken);
      } else {
        setLoading(false);
        notification.error({
            message: 'เกิดข้อผิดพลาด',
            description: 'ไม่พบข้อมูลจาก Google',
            placement: 'topRight',
        });
      }
    } catch {
      setLoading(false);
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Google',
        placement: 'topRight',
    });
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
          // Set non-auth cookies only (auth token is managed centrally in authStore)
          setCookie('closePopupPolicy', '', 365);

          login(userInfo, token);

          // Update user data from token payload immediately
          updateToken(token);

          logActivity('login', 'user', userInfo.userId || '', { method: 'google' });

          notification.success({
            message: 'เข้าสู่ระบบสำเร็จ',
            description: 'เข้าสู่ระบบผ่าน Google เรียบร้อยแล้ว',
            placement: 'topRight',
          });

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
          notification.error({
            message: 'เข้าสู่ระบบไม่สำเร็จ',
            description: 'ไม่พบ token จาก Backend - กรุณาติดต่อผู้ดูแลระบบ',
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

  useEffect(() => {
    if (!isSdkReady || !GOOGLE_CLIENT_ID || !googleButtonRef.current || !window.google?.accounts?.id) {
      return;
    }

    const buttonContainer = googleButtonRef.current;
    buttonContainer.replaceChildren();

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
      ux_mode: 'popup',
    });

    window.google.accounts.id.renderButton(buttonContainer, {
      type: 'icon',
      theme: 'outline',
      size: 'medium',
      shape: 'circle',
    });

    return () => {
      buttonContainer.replaceChildren();
    };
  }, [GOOGLE_CLIENT_ID, isSdkReady]);

  return (
    <div
      className={`border border-gray-200 rounded-md py-2 flex min-h-[41px] w-full items-center justify-center transition-colors hover:bg-blue-50 ${
        loading ? 'pointer-events-none opacity-50 cursor-wait' : 'cursor-pointer'
      }`}
    >
      <div ref={googleButtonRef} aria-label="Google Login" />
    </div>
  );
};

export default LoginGoogle;
