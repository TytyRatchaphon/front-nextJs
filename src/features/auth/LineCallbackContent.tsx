'use client';
import { useEffect } from 'react';
import { App, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import { useLineLogin } from '@/hooks/useLineLogin';
import { useAuthStore } from '@/stores/authStore';

const wait = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const waitForLineLoginFinalState = async (): Promise<boolean> => {
  const started = Date.now();
  const maxWaitMs = 5000;

  while (Date.now() - started < maxWaitMs) {
    if (useAuthStore.getState().isLoggedIn) return true;

    const inFlight = localStorage.getItem('is_line_login_in_flight');
    const processing = localStorage.getItem('is_line_login_processing');
    const stillProcessing = Boolean(inFlight) || processing === 'true' || processing === 'processing';

    if (!stillProcessing) break;
    await wait(120);
  }

  return useAuthStore.getState().isLoggedIn;
};

const LineCallbackContent = () => {
  const { initLIFF } = useLineLogin();
  const router = useRouter();
  const { notification } = App.useApp();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await initLIFF({ allowBackendLogin: true });

        const loginCompleted = await waitForLineLoginFinalState();
        if (loginCompleted) {
          notification.success({
            message: 'Login Successful',
            description: 'เข้าสู่ระบบเรียบร้อยแล้ว',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            placement: 'topRight',
          });
          router.replace('/');
          return;
        }

        notification.error({
          message: 'Login Failed',
          description: 'ไม่สามารถเข้าสู่ระบบผ่าน LINE ได้',
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
          placement: 'topRight',
        });
        router.replace('/');
      } catch (error) {
        console.error('[LINE_CALLBACK] init/login failed', error);
        notification.error({
          message: 'Login Failed',
          description: 'เกิดข้อผิดพลาดในการเชื่อมต่อ LINE',
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
          placement: 'topRight',
        });
        router.replace('/');
      }
    };

    handleCallback();
  }, [initLIFF, notification, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-500 font-primary">กำลังยืนยันตัวตนผ่าน LINE...</p>
      </div>
    </div>
  );
};

export default LineCallbackContent;

