'use client';

import React from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import Image from 'next/image';
import { useLineLogin } from '@/hooks/useLineLogin';

const LoginLine = () => {
  const { message } = App.useApp();
  const router = useRouter();
  const { closeLoginModal } = useUIStore();
  const { loginWithLine, loading } = useLineLogin();

  const handleLineLogin = async () => {
    try {
      await loginWithLine();

      // if no error was thrown, consider login successful
      closeLoginModal();
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน LINE');
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
