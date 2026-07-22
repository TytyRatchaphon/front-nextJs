"use client"

import * as React from "react";

import { useState } from 'react';
import { Button, Modal, Form, Input, Progress, App } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import type { ApiResponse } from '@/types/api';
import { useAuthStore, UserData } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useLogger } from '@/hooks/useLogger';

// Types
import LoginFacebook from '../social/LoginFacebook';
import LoginGoogle from '../social/LoginGoogle';
import LoginLine from '../social/LoginLine';
import LoginApple from '../social/LoginApple';
import DuplicateLoginModal from '@/features/auth/components/DuplicateLoginModal';
import BlockedUserModal from '@/features/auth/components/BlockedUserModal';
import PolicyModal from '@/components/modal/PolicyModal';

type LoginFieldType = {
  email?: string;
  password?: string;
};

type RegisterFieldType = {
  fullname?: string;
  email?: string;
  password?: string;
};

type ForgotPasswordFieldType = {
  email?: string;
};

// API Response Types
// Login response จาก API จะส่ง token มาเป็น string ใน data field
interface LoginResponse {
  token?: string;  // สำหรับกรณีที่ data เป็น object
  email?: string;  // เพิ่ม email field
}

interface RegisterResponse {
  message: string;
  token?: string;
  email?: string;
}

const LoginButtonHeader: React.FC = () => {
  const { notification: api } = App.useApp();
  const { login } = useAuthStore();
  const {
    isLoginModalOpen,
    loginViewMode,
    loginAnimationClass,
    openLoginModal,
    closeLoginModal,
    setLoginViewMode,
    setLoginAnimation
  } = useUIStore();
  const { log: logActivity } = useLogger();

  // Notification API


  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  // เก็บข้อมูล form สำหรับใช้หลัง login/register สำเร็จ
  const [, setLoginFormData] = useState<LoginFieldType | null>(null);
  const [, setRegisterFormData] = useState<RegisterFieldType | null>(null);

  // Policy Modal state
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyType, setPolicyType] = useState<'privacy' | 'conditions' | null>(null);

  const handleOpenPolicy = (type: 'privacy' | 'conditions') => {
    setPolicyType(type);
    setPolicyModalOpen(true);
  };

  // Password strength checker
  const checkPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const getPasswordColor = (strength: number): string => {
    if (strength < 40) return '#ff4d4f';
    if (strength < 70) return '#faad14';
    return '#52c41a';
  };

  //-------------------- Animation ---------------------------------
  const showModal = () => {
    openLoginModal();
    setLoginAnimation('fade-in');
  };

  const handleViewChange = (newView: 'login' | 'register' | 'forgot-password') => {
    setLoginViewMode(newView);
    setPasswordStrength(0); // Reset password strength
  };

  const handleCancel = () => {
    closeLoginModal();
    setTimeout(() => {
      setLoginViewMode('login');
      setPasswordStrength(0);
    }, 200);
  };
  //-------------------- Animation ---------------------------------

  //-------------------- Login / Register --------------------------
  const loginUser = async (credentials: LoginFieldType): Promise<ApiResponse<LoginResponse>> => {
    const apiPayload = {
      email: credentials.email,
      password: credentials.password
    };
    // Debug log
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/login', apiPayload);
    return response.data;
  };

  const registerUser = async (userData: RegisterFieldType): Promise<ApiResponse<RegisterResponse>> => {
    const apiPayload = {
      fullname: userData.fullname,
      email: userData.email,
      password: userData.password  // ใช้ password ตรงๆ ตามที่ API ต้องการ
    };
    const response = await apiClient.post<ApiResponse<RegisterResponse>>('/signup', apiPayload);
    return response.data;
  };

  const forgotPassword = async (data: ForgotPasswordFieldType): Promise<ApiResponse<any>> => {
    const apiPayload = {
      email: data.email
    };
    const response = await apiClient.post<ApiResponse<any>>('/forgotpassword', apiPayload);
    return response.data;
  };

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (responseData, variables) => {

      // ---------------------------------------------------------
      // 🟢 แก้ไข: เปลี่ยนจาก message เป็น notification พร้อมไอคอน
      // ---------------------------------------------------------
      api.success({
        message: 'เข้าสู่ระบบสำเร็จ!',
        placement: 'topRight',
        duration: 3,
        // สีเขียว Success
      });
      // ---------------------------------------------------------

      // API ส่ง token มาเป็น string ใน data field โดยตรง
      if (responseData.data) {
        const token = typeof responseData.data === 'string'
          ? responseData.data
          : responseData.data.token;


        if (token) {
          // Decode token เพื่อดึงข้อมูล fullname ที่ถูกต้อง
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const decoded = JSON.parse(jsonPayload);


            const userData: UserData = {
              fullname: decoded.fullname || 'User',
              email: decoded.email || variables.email || 'user@email.com',
              role: decoded.role || 'user',

              // Profile Data
              writer_name: decoded.writer_name,
              img: decoded.img,
              banner: decoded.banner,
              frame_id: decoded.frame_id,
              aka_id: decoded.aka_id,
              phone: decoded.phone,
              address_main: decoded.address_main,
              des: decoded.des,
              facebook: decoded.facebook,
              twitter: decoded.twitter,
              gender: decoded.gender,
              birthday: decoded.birthday,
              cat1: decoded.cat1,
              cat2: decoded.cat2,
              frame: decoded.frame,
              aka: decoded.aka,

              // Stats
              flower: decoded.flower,
              heart: decoded.heart,
              stamp: decoded.stamp,
              coupon: decoded.coupon,
              coin: decoded.coin,
              freecoin: decoded.freecoin
            };

            login(userData, token);

            logActivity('login', 'user', '', { method: 'email', email: userData.email });

            setLoginFormData(null);
          } catch {
            api.error({
              message: 'ไม่สามารถอ่านข้อมูลจาก Token ได้',
              description: '',
              placement: 'topRight',
              duration: 4,
              });
          }
        } else {
        }
      } else {
      }

      handleCancel();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      api.error({
        message: errorMessage,
        description: '',
        placement: 'topRight',
        duration: 4,
        });

    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (responseData) => {
      api.success({
        message: 'สมัครสมาชิกสำเร็จ!',
        description: 'สมัครสมาชิกเรียบร้อยแล้ว',
        placement: 'topRight',
      });

      // Auto login หลังจาก register สำเร็จ
      if (responseData.data) {
        const token = typeof responseData.data === 'string'
          ? responseData.data
          : responseData.data.token;

        if (token) {
          // Decode token เพื่อดึงข้อมูลที่ถูกต้อง
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const decoded = JSON.parse(jsonPayload);

            const userData: UserData = {
              fullname: decoded.fullname || 'User',
              email: decoded.email || 'user@email.com',
              role: decoded.role || 'user',

              // Profile Data
              writer_name: decoded.writer_name,
              img: decoded.img,
              banner: decoded.banner,
              frame_id: decoded.frame_id,
              aka_id: decoded.aka_id,
              phone: decoded.phone,
              address_main: decoded.address_main,
              des: decoded.des,
              facebook: decoded.facebook,
              twitter: decoded.twitter,
              gender: decoded.gender,
              birthday: decoded.birthday,
              cat1: decoded.cat1,
              cat2: decoded.cat2,
              frame: decoded.frame,
              aka: decoded.aka,

              // Stats
              flower: decoded.flower,
              heart: decoded.heart,
              stamp: decoded.stamp,
              coupon: decoded.coupon,
              coin: decoded.coin,
              freecoin: decoded.freecoin
            };

            login(userData, token);

            logActivity('register', 'user', '', { method: 'email', email: userData.email });

            api.success({
              message: 'เข้าสู่ระบบอัตโนมัติแล้ว',
              description: 'เข้าสู่ระบบเรียบร้อยแล้ว',
              placement: 'topRight',
            });
            handleCancel();
            setRegisterFormData(null);
          } catch {
            api.error({
              message: 'ไม่สามารถอ่านข้อมูลจาก Token ได้',
              description: 'ไม่สามารถอ่านข้อมูลจาก Token ได้',
              placement: 'topRight',
            });
            handleViewChange('login');
          }
        } else {
          handleViewChange('login');
        }
      } else {
        handleViewChange('login');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'สมัครสมาชิกไม่สำเร็จ';

      // Workaround for backend issue: If registration succeeds but token generation fails
      // with "Expected 'payload' to be a plain object.", treat it as success.
      if (typeof errorMessage === 'string' && (errorMessage.includes("plain object") || errorMessage.includes('payload'))) {
        api.success({
          message: 'สมัครสมาชิกสำเร็จ',
          description: 'สมัครสมาชิกเรียบร้อยแล้ว',
          placement: 'topRight',
        });
        handleViewChange('login');
      } else {
        api.error({
          message: 'สมัครสมาชิกไม่สำเร็จ',
          description: errorMessage,
          placement: 'topRight',
        });
      }
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (responseData) => {
      // แสดง notification แทน message
      api.success({
        message: 'ส่งคำขอรีเซ็ตรหัสผ่านสำเร็จ',
        description: responseData.message,
        placement: 'topRight',
        duration: 6,
      });
      handleViewChange('login');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาด';
      api.error({
        message: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        placement: 'topRight',
        duration: 4,
      });
    },
  });



  const onLoginFinish: FormProps<LoginFieldType>['onFinish'] = (values) => {
    setLoginFormData(values); // เก็บข้อมูล form ไว้ใช้หลัง login สำเร็จ
    loginMutation.mutate(values);
  };

  const onRegisterFinish: FormProps<RegisterFieldType>['onFinish'] = (values) => {
    setRegisterFormData(values); // เก็บข้อมูล form ไว้ใช้หลัง register สำเร็จ
    registerMutation.mutate(values);
  };

  const onForgotPasswordFinish: FormProps<ForgotPasswordFieldType>['onFinish'] = (values) => {
    forgotPasswordMutation.mutate(values);
  };

  const onFinishFailed = () => {
    api.error({
      message: 'เกิดข้อผิดพลาด',
      description: 'กรุณากรอกข้อมูลให้ครบถ้วน',
      placement: 'topRight',
    });
  };

  const animationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.98); }
    }
    .fade-in {
      animation: fadeIn 200ms ease-out forwards;
    }
    .fade-out {
      animation: fadeOut 200ms ease-in forwards;
    }
  `;

  const renderLoginForm = (prefix: string = '') => (
    <div className="text-center w-full px-2 lg:px-8 flex flex-col justify-between h-full py-6 bg-white">
      <div>
        <div className="mb-2">
          <span className="font-bold md:text-xl font-primary text-red-600">เข้าสู่ระบบ</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <LoginFacebook />
          <LoginGoogle />
          <LoginLine />
          <LoginApple />
        </div>
        <div className="flex items-center my-2">
          <div className="flex-grow border-b border-primary text-red-600"></div>
          <div className="mx-4 text-sm font-medium font-primary text-red-600">หรือ</div>
          <div className="flex-grow border-b border-primary text-red-600"></div>
        </div>
        <Form name={`login_form_${prefix}`} layout="vertical" onFinish={onLoginFinish} onFinishFailed={onFinishFailed} autoComplete="off" requiredMark={false}>
          <Form.Item<LoginFieldType> label={<span className="text-sm text-black md:text-base font-medium font-primary w-full text-left block">อีเมล</span>} name="email" rules={[{ required: true, message: 'Please input your Email!' }]} className='text-left font-primary mb-3'>
            <Input size="middle" />
          </Form.Item>
          <Form.Item<LoginFieldType> label={<span className="text-sm text-black md:text-base font-medium font-primary w-full text-left block">รหัสผ่าน</span>} name="password" rules={[{ required: true, message: 'Please input your password!' }]} className='text-left mb-3'>
            <Input.Password size="middle" />
          </Form.Item>
          <div className="grid grid-cols-2 p-0">
            <div className="flex justify-start items-center">
              <a onClick={() => handleViewChange('forgot-password')} className="text-sm underline cursor-pointer md:text-xl font-medium font-primary text-red-600 login-link">ลืมรหัสผ่าน</a>
            </div>
            <div className="flex justify-end p-0">
              <Button loading={loginMutation.isPending} type="primary" htmlType="submit" danger size="large" className='font-medium font-primary text-md md:text-xl text-red-500 py-1 hover:border-secondary hover:bg-secondary hover:text-primary focus:outline-none'>เข้าสู่ระบบ</Button>
            </div>
          </div>
        </Form>
      </div>
      <div>
        <div className="grid grid-cols-2 p-0 gap-3 mt-5">
          <div className="flex justify-end items-center">
            <span className="text-[12px] text-gray-600 md:text-lg font-medium font-primary">ยังไม่มีบัญชีผู้ใช้?</span>
          </div>
          <div className="flex justify-start p-0">
            <a onClick={() => handleViewChange('register')} className="text-sm cursor-pointer underline font-bold md:text-lg font-primary text-red-600 login-link">สมัครสมาชิก</a>
          </div>
        </div>
        <a onClick={() => handleOpenPolicy('privacy')} className="text-sm cursor-pointer font-bold mt-5 inline-block font-primary text-red-600 underline login-link">นโยบายข้อมูลส่วนบุคคล</a>
      </div>
    </div>
  );

  const renderRegisterForm = (prefix: string = '') => (
    <div className="text-center w-full px-2 lg:px-8 flex flex-col justify-between h-full py-6 bg-white">
      <div>
        <div className="mb-2">
          <span className="font-bold md:text-xl text-red-600 font-primary">สมัครสมาชิก</span>
        </div>
        <Form name={`register_form_${prefix}`} layout="vertical" onFinish={onRegisterFinish} onFinishFailed={onFinishFailed} autoComplete="off" requiredMark={false}>
          <Form.Item<RegisterFieldType> label={<span className="text-sm text-black md:text-base font-primary w-full text-left block">ชื่อ-นามสกุล</span>} name="fullname" rules={[{ required: true, message: 'Please input your name!' }]} className="text-left mb-3">
            <Input size="middle" />
          </Form.Item>
          <Form.Item<RegisterFieldType> label={<span className="text-sm text-black md:text-base font-primary w-full text-left block">อีเมล</span>} name="email" rules={[{ required: true, type: 'email', message: 'Please input a valid Email!' }]} className="text-left mb-3">
            <Input size="middle" />
          </Form.Item>
          <Form.Item<RegisterFieldType> label={<span className="text-sm text-black md:text-base font-primary w-full text-left block">รหัสผ่าน</span>} name="password" rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน!' }, { min: 8, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร!' }]} className="text-left mb-3">
            <Input.Password size="middle" onChange={(e) => setPasswordStrength(checkPasswordStrength(e.target.value))} />
          </Form.Item>
          {passwordStrength > 0 && (
            <div className="mb-4 -mt-2">
              <Progress percent={passwordStrength} strokeColor={getPasswordColor(passwordStrength)} showInfo={false} size="small" />
              <span className="text-xs" style={{ color: getPasswordColor(passwordStrength) }}>
                {passwordStrength < 40 ? 'รหัสผ่านอ่อนแอ' : passwordStrength < 70 ? 'รหัสผ่านปานกลาง' : 'รหัสผ่านแข็งแรง'}
              </span>
            </div>
          )}
          <div className="flex flex-col text-center py-4">
            <span className="text-sm text-gray-500 font-primary">กดปุ่ม &quot;สมัครสมาชิก&quot; เป็นการยอมรับ</span>
            <a onClick={() => handleOpenPolicy('conditions')} className="text-sm font-bold cursor-pointer font-primary text-red-600 underline">ข้อตกลงการใช้งาน</a>
          </div>
          <div className="grid grid-cols-2 items-center">
            <div className="flex justify-start">
              <a onClick={() => handleViewChange('login')} className="text-sm underline cursor-pointer font-primary text-red-600 login-link">เข้าสู่ระบบ</a>
            </div>
            <div className="flex justify-end">
              <Button type="primary" htmlType="submit" danger size="large" loading={registerMutation.isPending}><span className='font-primary font-medium'>สมัครสมาชิก</span></Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );

  const renderForgotForm = (prefix: string = '') => (
    <div className="text-center w-full px-2 lg:px-8 flex flex-col justify-between h-full py-6 bg-white">
      <div>
        <div className="mb-4">
          <span className="font-bold md:text-xl font-primary text-red-600">ลืมรหัสผ่าน</span>
          <p className="text-sm text-gray-600 mt-2 font-primary">กรุณากรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
        </div>
        <Form name={`forgot_password_form_${prefix}`} layout="vertical" onFinish={onForgotPasswordFinish} onFinishFailed={onFinishFailed} autoComplete="off" requiredMark={false}>
          <Form.Item<ForgotPasswordFieldType> label={<span className="text-sm text-black md:text-base font-medium font-primary w-full text-left block">อีเมล</span>} name="email" rules={[{ required: true, message: 'กรุณากรอกอีเมล!' }, { type: 'email', message: 'กรุณากรอกอีเมลที่ถูกต้อง!' }]} className='text-left font-primary'>
            <Input size="middle" placeholder="example@email.com" />
          </Form.Item>
          <div className="grid grid-cols-2 p-0 gap-3 mt-5">
            <div className="flex justify-start items-center">
              <a onClick={() => handleViewChange('login')} className="text-sm underline cursor-pointer font-primary text-red-600 login-link">กลับไปเข้าสู่ระบบ</a>
            </div>
            <div className="flex justify-end p-0">
              <Button loading={forgotPasswordMutation.isPending} type="primary" htmlType="submit" danger size="large" className='font-medium font-primary'><span className='font-primary text-lg'>ส่งลิงก์</span></Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );

  return (
    <>
      <style>{animationStyles}</style>
      <div
        className="group text-nowrap text-[15px] lg:text-[17px] leading-6 flex justify-end items-center cursor-pointer"
        onClick={showModal}
      >
        <span className='flex flex-row items-center'>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className='mr-2 transition-colors duration-300' style={{ fill: 'none' }}>
            <path d="M8.90039 7.55999C9.21039 3.95999 11.0604 2.48999 15.1104 2.48999H15.2404C19.7104 2.48999 21.5004 4.27999 21.5004 8.74999V15.27C21.5004 19.74 19.7104 21.53 15.2404 21.53H15.1104C11.0904 21.53 9.24039 20.08 8.91039 16.54" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="transition-colors duration-300 group-hover:stroke-red-600" />
            <path d="M2 12H14.88" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="transition-colors duration-300 group-hover:stroke-red-600" />
            <path d="M12.6504 8.65002L16.0004 12L12.6504 15.35" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="transition-colors duration-300 group-hover:stroke-red-600" />
          </svg>
          <span className="text-black transition-colors duration-300 group-hover:text-red-600 font-primary">
            เข้าสู่ระบบ
          </span>
        </span>
      </div>

      <Modal
        title={null}
        open={isLoginModalOpen}
        onCancel={handleCancel}
        footer={null}
        centered
        width={800}
        zIndex={1600}
        styles={{
          body: { padding: 0 },
          content: { padding: 0, overflow: 'hidden', borderRadius: '12px' }
        }}
      >
        <div className={loginAnimationClass}>
          <div className="relative w-full bg-white lg:min-h-[500px] overflow-hidden flex flex-col lg:flex-row">
            
            {/* --- Mobile View --- */}
            <div className="grid lg:hidden w-full relative z-10 bg-white overflow-hidden items-start">
              
              {/* Login Form */}
              <div 
                style={{ gridArea: '1 / 1' }} 
                className={`w-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  loginViewMode === 'login' ? 'opacity-100 translate-x-0 pointer-events-auto z-10' : 
                  loginViewMode === 'register' ? 'opacity-0 -translate-x-8 pointer-events-none z-0' : 
                  'opacity-0 -translate-x-8 pointer-events-none z-0'
                }`}
              >
                {renderLoginForm('mobile')}
              </div>

              {/* Register Form */}
              <div 
                style={{ gridArea: '1 / 1' }} 
                className={`w-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  loginViewMode === 'register' ? 'opacity-100 translate-x-0 pointer-events-auto z-10' : 
                  'opacity-0 translate-x-8 pointer-events-none z-0'
                }`}
              >
                {renderRegisterForm('mobile')}
              </div>

              {/* Forgot Password Form */}
              <div 
                style={{ gridArea: '1 / 1' }} 
                className={`w-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  loginViewMode === 'forgot-password' ? 'opacity-100 translate-x-0 pointer-events-auto z-10' : 
                  'opacity-0 translate-x-8 pointer-events-none z-0'
                }`}
              >
                {renderForgotForm('mobile')}
              </div>

            </div>

            {/* --- Desktop View (Sliding Overlay Layout) --- */}
            <div className="hidden lg:flex w-full relative min-h-[500px]">
              
              {/* Left Side: Register Form */}
              <div className={`w-1/2 h-full absolute top-0 left-0 flex flex-col justify-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-10 ${
                loginViewMode === 'register' ? 'opacity-100 pointer-events-auto delay-200 translate-x-0' : 'opacity-0 pointer-events-none -translate-x-8'
              }`}>
                {renderRegisterForm('desktop')}
              </div>

              {/* Right Side: Login / Forgot Form */}
              <div className={`w-1/2 h-full absolute top-0 right-0 flex flex-col justify-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-10 ${
                loginViewMode !== 'register' ? 'opacity-100 pointer-events-auto delay-200 translate-x-0' : 'opacity-0 pointer-events-none translate-x-8'
              }`}>
                {loginViewMode === 'forgot-password' ? renderForgotForm('desktop') : renderLoginForm('desktop')}
              </div>

              {/* Sliding Image Panel */}
              <div 
                className={`absolute top-0 left-0 w-1/2 h-full z-20 bg-gray-50 flex flex-col items-center justify-center overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  loginViewMode === 'register' ? 'translate-x-full' : 'translate-x-0'
                }`}
              >
                <div className="relative w-full h-full min-h-[500px]">
                  <Image
                    src={loginViewMode === 'forgot-password' ? "https://img.enjoybook.co/img/img_login2025qstOcG71ML0121162832.png" : "/images/img_login.png"}
                    alt="Visual"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </Modal>
      <DuplicateLoginModal />
      <BlockedUserModal />
      <PolicyModal 
        open={policyModalOpen} 
        onCancel={() => setPolicyModalOpen(false)} 
        type={policyType} 
      />
    </>
  );
};

export default LoginButtonHeader;


