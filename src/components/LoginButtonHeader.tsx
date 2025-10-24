// src/app/components/LoginButtonHeader.tsx

"use client"

import React from 'react';
import { Button, Modal, Form, Input, Checkbox, Divider, message } from 'antd';
import type { FormProps } from 'antd';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
// import './LoginModal.css'; // อย่าลืม import CSS

// 1. (MODIFIED) เปลี่ยนจาก interface เป็น type และเปลี่ยนชื่อ Field
type LoginFieldType = {
  email?: string; // ใช้ email เหมือนเดิมเพื่อให้สอดคล้องกับ UI
  password?: string;
};

type RegisterFieldType = {
  fullname?: string;
  email?: string;
  password?: string;
};


const LoginButtonHeader: React.FC = () => {
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

  //-------------------- Animation ---------------------------------
  const showModal = () => {
    openLoginModal();
    setLoginAnimation('fade-in'); // Reset animation ทุกครั้งที่เปิด
  };

  const handleViewChange = (newView: 'login' | 'register') => {
    setLoginAnimation('fade-out'); // เริ่ม Fade out
    setTimeout(() => {
      setLoginViewMode(newView); // เปลี่ยน View ตอนที่มองไม่เห็น
      setLoginAnimation('fade-in'); // เริ่ม Fade in
    }, 200); // 200ms คือระยะเวลาของ animation
  };

  const handleCancel = () => {
    closeLoginModal();
    setTimeout(() => setLoginViewMode('login'), 200);
  };
  //-------------------- Animation ---------------------------------

  //-------------------- Login / Register --------------------------
  const loginUser = async (credentials: LoginFieldType) => {
    // สร้าง Payload ให้ตรงกับที่ API ต้องการ
    const apiPayload = {
      email: credentials.email,
      user_pwd: credentials.password // <-- เปลี่ยนจาก password เป็น user_pwd
    };
    // ใช้ Endpoint ที่ถูกต้อง
    const response = await apiClient.post('/user/login', apiPayload); 
    return response.data;
  };

  const registerUser = async (userData: RegisterFieldType) => {
     // สร้าง Payload ให้ตรงกับที่ API ต้องการ (สมมติว่า Register ใช้ user_pwd เหมือนกัน)
     const apiPayload = {
       fullname: userData.fullname,
       email: userData.email,
       user_pwd: userData.password // <-- เปลี่ยนจาก password เป็น user_pwd
     };
    // ใช้ Endpoint ที่ถูกต้อง (สมมติ)
    const response = await apiClient.post('/user/register', apiPayload); 
    return response.data;
  };

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (responseData) => {
      // --- Login สำเร็จ ---
      console.log('API Response Data:', responseData); 
      message.success(responseData.message || 'เข้าสู่ระบบสำเร็จ!'); 
      
      // --- ใช้ Zustand store ---
      if (responseData.data && responseData.data.token) {
        const userData = responseData.data;
        const token = responseData.data.token;
        login(userData, token);
      }
      
      handleCancel(); 
    },
    onError: (error: any) => {
      // --- เกิด Error (จาก API response หรือ Network) ---
      console.error('Login API Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      message.error(errorMessage);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (responseData) => {
      message.success(responseData.message || 'สมัครสมาชิกสำเร็จ!');
      handleViewChange('login'); 
    },
    onError: (error: any) => {
      console.error('Register API Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'สมัครสมาชิกไม่สำเร็จ';
      message.error(errorMessage);
    },
  });



  const onLoginFinish: FormProps<LoginFieldType>['onFinish'] = (values) => {
    loginMutation.mutate(values); // เรียกใช้ mutation ที่สร้างไว้
  };

  const onRegisterFinish: FormProps<RegisterFieldType>['onFinish'] = (values) => {
    registerMutation.mutate(values); // เรียกใช้ mutation ที่สร้างไว้
  };
  
  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
    message.error('กรุณากรอกข้อมูลให้ครบถ้วน');
  };
  
  //-------------------- Login / Register ---------------------------------
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

  return (
    <>
      <style>{animationStyles}</style>
      <div 
        className="text-nowrap text-[15px] lg:text-[17px] leading-6 flex justify-end items-center hover:text-primary cursor-pointer"
        onClick={showModal}
      >
        <span>เข้าสู่ระบบ</span>
      </div>

      <Modal
        title={null}       
        open={isLoginModalOpen}
        onCancel={handleCancel}
        footer={null}
        centered
        width={800}
        styles={{ 
          body: { padding: 0 },
          content:{ padding: 0}
        }} 
      >

        <div className={loginAnimationClass}>
        {loginViewMode === 'login' ? (
        <div className="grid lg:grid-cols-2 p-0 gap-0">
          {/* คอลัมน์ซ้าย (รูปภาพ) */}
          <div className="hidden lg:block overflow-hidden rounded-l-xl h-[400px] justify-center items-center mt-7">
            <img 
              src="https://img.enjoybook.co/img/img_login2025qstOcG71ML0121162832.png?w=3840&q=75" 
              alt="Login Visual"
              className="w-full h-full"  
            />
          </div>
          {/* คอลัมน์ขวา (ฟอร์ม) */}
          {/* ===== MODIFIED: ลบ h-[400px] ออก ===== */}
          <div className="text-center bg-white rounded-r-xl p-6 flex flex-col justify-between">
            <div>
              {/* Title */}
              <div className="mb-2">
                <span className="text-primary font-bold md:text-xl font-primary text-red-600">เข้าสู่ระบบ</span>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-3 gap-2">
                <div className='border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-blue-50'>
                    <Image src="https://img.enjoybook.co/img/icon-img/social-1.png" alt="" className='inline-block h-[23px] w-[23px] rounded-full ' loading="lazy" width="96" height="96" decoding="async" data-nimg="1" style={{color: "transparent"}} />
                </div>
                   <div className='border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-blue-50'>
                     <Image src="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ffacebook.63de5bea.png&w=256&q=75" alt="" className='inline-block h-[23px] w-[23px] rounded-full ' loading="lazy" width="96" height="96" decoding="async" data-nimg="1" style={{color: "transparent"}} />
                </div>
                   <div className='border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-blue-50'>
                     <Image src="https://img.enjoybook.co/img/icon-img/social-2.png" alt="" className='inline-block h-[23px] w-[23px] rounded-full ' loading="lazy" width="96" height="96" decoding="async" data-nimg="1" style={{color: "transparent"}} />
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center my-2">
                <div className="flex-grow"></div>
                <div className='flex-grow border-b border-primary text-red-600'></div>
                <div className="mx-4 text-primary text-sm font-medium font-primary text-red-600">หรือ</div>
                <div className='flex-grow border-b border-primary text-red-600'></div>
                <div className="flex-grow"></div>
              </div>
              
              {/* Form Component */}
              <Form
                name="login_form"
                layout="vertical"
                onFinish={onLoginFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
                requiredMark={false}
              >
                <Form.Item<LoginFieldType>
                  label={<span className="text-sm text-black md:text-base text-left block w-full font-medium font-primary">อีเมล</span>}
                  name="email"
                  rules={[{ required: true, message: 'Please input your Email!' }]}
                  className='text-left font-primary'
                >
                  <Input size="middle"/>
                </Form.Item>
                
                <Form.Item<LoginFieldType>
                  label={<span className="text-sm text-black md:text-base text-left block w-full font-medium font-primary">รหัสผ่าน</span>}
                  name="password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                  className='text-left'
                >
                  <Input.Password size="middle"/>
                </Form.Item>
                
                {/* Forgot Password & Login Button */}
                <div className="grid grid-cols-2 p-0 ">
                  <div className="flex justify-start items-center">
                    <a href="" className="text-sm underline text-primary cursor-pointer md:text-xl font-medium font-primary text-red-600 login-link">
                      <span className='font-primary text-red-600 underline'>ลืมรหัสผ่าน</span>
                    </a>
                  </div>
                  <div className="flex justify-end p-0">
                      <Button loading={loginMutation.isPending} type="primary" htmlType="submit" danger size="large" className='font-medium font-primary text-md text-red-500 py-1 hover:border-secondary hover:bg-secondary hover:text-primary focus:outline-none fontFam md:text-xl'>
                        <span className='font-primary text-xl'>เข้าสู่ระบบ</span>
                      </Button>
                  </div>
                </div>
              </Form>
            </div>

            {/* ส่วนล่างสุด (Sign up & Policy) */}
            <div>
              <div className="grid grid-cols-2 p-0 gap-3 mt-5 ">
                <div className="flex justify-end items-center">
                  <span className="text-[12px] text-gray-600 md:text-lg font-medium font-primary">ยังไม่มีบัญชีผู้ใช้?</span>
                </div>
                <div className="flex justify-start p-0">
                  <a onClick={() => handleViewChange('register')}  className="text-sm text-primary cursor-pointer underline font-bold md:text-lg font-primary login-link">
                    <span className='font-primary text-red-600 underline'>สมัครสมาชิก</span>
                  </a>
                </div>
              </div>
              
              <a target="_blank" className="text-sm cursor-pointer font-bold mt-5 inline-block font-primary login-link" href="/policy-privacy">
                <span className='font-primary text-red-600 underline'>นโยบายข้อมูลส่วนบุคคล</span>
              </a>
            </div>
          </div>
        </div>
        ) : (
        <div className="grid lg:grid-cols-2 p-0 gap-0">
            <div className="hidden lg:block overflow-hidden rounded-l-xl">
              <img 
                src="https://img.enjoybook.co/img/img_register2025gvOxyaNKLH0121162832.png?w=3840&q=75" 
                alt="Register Visual"
                className="w-full h-full object-cover"  
              />
            </div>
            <div className="text-center rounded-l-xl bg-white p-6 flex flex-col justify-between">
              <div>
                <div className="mb-2">
                  <span className="text-primary font-bold md:text-xl text-red-600 font-primary">สมัครสมาชิก</span>
                </div>
                <Form
                  name="register_form"
                  layout="vertical"
                  onFinish={onRegisterFinish}
                  onFinishFailed={onFinishFailed}
                  autoComplete="off"
                  requiredMark={false}
                >
                  <Form.Item<RegisterFieldType>
                    label={<span className="text-sm text-black md:text-base text-left block w-full font-primary">ชื่อ-นามสกุล</span>}
                    name="fullname"
                    rules={[{ required: true, message: 'Please input your name!' }]}
                    className="text-left"
                  >
                    <Input size="middle" />
                  </Form.Item>
                  <Form.Item<RegisterFieldType>
                    label={<span className="text-sm text-black md:text-base text-left block w-full font-primary">อีเมล</span>}
                    name="email"
                    rules={[{ required: true, type: 'email', message: 'Please input a valid Email!' }]}
                    className="text-left"
                  >
                    <Input size="middle" />
                  </Form.Item>
                  <Form.Item<RegisterFieldType>
                    label={<span className="text-sm text-black md:text-base text-left block w-full font-primary">รหัสผ่าน</span>}
                    name="password"
                    rules={[{ required: true, min: 6, message: 'Password must be at least 8 characters!' }]}
                    className="text-left"
                  >
                    <Input.Password size="middle" />
                  </Form.Item>
                  <div className="flex flex-col text-center py-4">
                    <span className="text-sm text-gray-500 font-primary">กดปุ่ม "สมัครสมาชิก" เป็นการยอมรับ</span>
                    <a href="#" className="text-sm text-primary font-bold cursor-pointer font-primary "><span className='text-red-600 text-bold '>ข้อตกลงการใช้งาน</span></a>
                  </div>
                  <div className="grid grid-cols-2 items-center">
                    <div className="flex justify-start">
                      {/* --- ปุ่มสลับกลับไปหน้า Login --- */}
                      <a onClick={() => handleViewChange('login')} className="text-sm underline text-primary cursor-pointer font-primary login-link"><span className='text-red-600 underline'>เข้าสู่ระบบ</span></a>
                    </div>
                    <div className="flex justify-end">
                      <Button type="primary" htmlType="submit" danger size="large"><span className='font-primary font-medium'>สมัครสมาชิก</span></Button>
                    </div>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        )}
        </div>
      </Modal>
    </>
  );
};

export default LoginButtonHeader;

