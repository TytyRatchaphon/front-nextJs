"use client";
import * as React from "react";
import { useEffect } from 'react'
import {
  Tabs,
  App,
} from 'antd';
import type { TabsProps } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import GifLoader from '@/components/utility/GifLoader';
import { SprofileUserInfoTab } from './components/SprofileUserInfoTab';
import { SprofileChangePassword } from './components/SprofileChangePassword';

const items: TabsProps['items'] = [
  {
    key: '1',
    label: <span className='font-primary font-medium text-black text-lg'>ข้อมูลผู้ใช้งาน</span>,
    children: <SprofileUserInfoTab />
  },
  {
    key: '2',
    label: <span className='font-primary font-medium text-black text-lg'>เปลี่ยนรหัสผ่าน</span>,
    children: <SprofileChangePassword />,
  },
];

function Page() {
  const { notification } = App.useApp();
  const { user, isLoggedIn, hasMounted, setMounted } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setMounted();
  }, [setMounted]);

  useEffect(() => {
    if (hasMounted && (!isLoggedIn || !user)) {
      notification.warning({
        message: 'เกิดข้อผิดพลาด',
        description: 'กรุณาเข้าสู่ระบบก่อนเข้าถึงหน้านี้',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
      router.push('/');
    }
  }, [hasMounted, isLoggedIn, user, router, notification]);

  if (!hasMounted || !isLoggedIn || !user) {
    return (
      <GifLoader />
    );
  }

  return (
    <div className='bg-white' style={{ overflowX: 'hidden' }}>
      <div className='relative w-[100vw] items-center flex flex-col'>
        <div className='flex flex-col pt-[100px] px-4 lg:px-0 w-full max-w-[1360px] relative mb-10' style={{ minHeight: 'calc(100vh - 100px)' }}>
          <div className='bg-white select-none'>
            <div className='select-none '>
              <div className='lg: mt-[-80] py-2'>
                <span className='text-2xl font-bold mb-11 mt-0 text-black font-primary'>
                  ตั้งค่า - {user?.fullname || user?.email || 'ผู้ใช้'}
                </span>
              </div>
              <div className=''>
                <Tabs
                  defaultActiveKey="1"
                  items={items}
                  className="my-red-tabs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
