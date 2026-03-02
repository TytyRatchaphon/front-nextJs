'use client';

import React from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import Image from 'next/image';
import { useLineLogin } from '@/hooks/useLineLogin';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useLogger } from '@/hooks/useLogger';

const LoginLine = () => {
  const { notification } = App.useApp();
  const router = useRouter();
  const { closeLoginModal } = useUIStore();
  const { loginWithLine, loading } = useLineLogin();
  const { log: logActivity } = useLogger();

  const handleLineLogin = async () => {
    try {
      await loginWithLine();

      // Log login event
      console.log('[LOG] login =>', { method: 'line' });
      logActivity('login', 'user', '', { method: 'line' });

      // if no error was thrown, consider login successful
      closeLoginModal();
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch {
      notification.error({
        message: 'เข้าสู่ระบบไม่สำเร็จ',
        description: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน LINE',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
    }
  };

  return (
    <div
      onClick={!loading ? handleLineLogin : undefined}
      className={`border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-green-50 transition-colors ${loading ? 'opacity-50 cursor-wait' : ''
        }`}
    >
      <Image
        className="inline-block h-[23px] w-[23px] rounded-full"
        src="/images/social-2.png"
        alt="LINE Login"
        width={23}
        height={23}
        unoptimized
      />
    </div>
  );
};

export default LoginLine;
