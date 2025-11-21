'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, App } from 'antd';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

interface ResetPasswordFieldType {
  email: string;
  password: string;
  confirmPassword: string;
}

// Function to decode JWT token
function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, setEmail] = useState('');
  const [form] = Form.useForm();
  const { login } = useAuthStore();
  const [token, setToken] = useState('');
  
  // Get token from params
  useEffect(() => {
    setToken(params.token);
  }, [params]);

  // Decode token and extract email
  useEffect(() => {
    if (token) {
      const decoded = decodeToken(token);
      console.log('🔓 Decoded Token:', decoded);
      
      if (decoded && decoded.email) {
        setEmail(decoded.email);
        form.setFieldsValue({ email: decoded.email });
      } else {
        message.error('Token ไม่ถูกต้องหรือหมดอายุ');
      }
    }
  }, [token, form, message]);

  const onFinish = async (values: ResetPasswordFieldType) => {
    if (values.password !== values.confirmPassword) {
      message.error('รหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        email: values.email,
        newPassword: values.password,
        newPasswordReEnter: values.confirmPassword,
      };
      
      console.log('📤 POST Payload:', payload);
      console.log('📤 POST URL:', `http://192.168.220.214:3331/resetpassword/${token}`);
      
      const response = await axios.post(
        `http://192.168.220.214:3331/resetpassword/${token}`,
        payload
      );

      console.log('✅ POST Response:', response.data);
      message.success('เปลี่ยนรหัสผ่านสำเร็จ กำลังเข้าสู่ระบบ...');
      
      // Auto-login หลังจาก reset password สำเร็จ
      try {
        const loginResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.214:3331'}/login`,
          {
            email: values.email,
            password: values.password,
          }
        );

        console.log('✅ Login Response:', loginResponse.data);

        if (loginResponse.data && loginResponse.data.data) {
          const token = typeof loginResponse.data.data === 'string' 
            ? loginResponse.data.data 
            : loginResponse.data.data.token;

          if (token) {
            const userData = {
              fullname: values.email.split('@')[0],
              email: values.email,
              role: 'user',
            };

            login(userData, token);
            message.success('เข้าสู่ระบบสำเร็จ!');

            // Redirect ไปหน้า profile
            setTimeout(() => {
              router.push('/sprofile');
            }, 500);
          } else {
            // ถ้าไม่มี token ให้ไปหน้า home
            setTimeout(() => {
              router.push('/');
            }, 1000);
          }
        }
      } catch (loginError) {
        console.error('❌ Auto-login failed:', loginError);
        // ถ้า login ไม่สำเร็จ ให้ไปหน้า home ให้ user login เอง
        message.info('กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message from backend:', error.response?.data?.message);
      
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-red-600 font-primary">
            ตั้งรหัสผ่านใหม่
          </h2>
          <p className="text-sm text-gray-600 mt-2 font-primary">
            กรุณากรอกรหัสผ่านใหม่ของคุณ
          </p>
        </div>

        <Form
          form={form}
          name="reset_password_form"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item<ResetPasswordFieldType>
            label={
              <span className="text-sm text-black md:text-base font-medium font-primary">
                อีเมล
              </span>
            }
            name="email"
            rules={[
              { required: true, message: 'กรุณากรอกอีเมล!' },
              { type: 'email', message: 'กรุณากรอกอีเมลที่ถูกต้อง!' },
            ]}
          >
            <Input 
              size="large" 
              placeholder="example@email.com"
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </Form.Item>

          <Form.Item<ResetPasswordFieldType>
            label={
              <span className="text-sm text-black md:text-base font-medium font-primary">
                รหัสผ่านใหม่
              </span>
            }
            name="password"
            rules={[
              { required: true, message: 'กรุณากรอกรหัสผ่าน!' },
              { min: 8, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร!' },
            ]}
          >
            <Input.Password size="large" placeholder="กรอกรหัสผ่านใหม่" />
          </Form.Item>

          <Form.Item<ResetPasswordFieldType>
            label={
              <span className="text-sm text-black md:text-base font-medium font-primary">
                ยืนยันรหัสผ่านใหม่
              </span>
            }
            name="confirmPassword"
            rules={[
              { required: true, message: 'กรุณายืนยันรหัสผ่าน!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน!'));
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="กรอกรหัสผ่านอีกครั้ง" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              danger
              size="large"
              loading={loading}
              className="w-full font-medium font-primary"
            >
              <span className="font-primary text-lg">ยืนยันเปลี่ยนรหัสผ่าน</span>
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <a
            onClick={() => router.push('/')}
            className="text-sm text-red-600 underline cursor-pointer font-primary"
          >
            กลับไปหน้าแรก
          </a>
        </div>
      </div>
    </div>
  );
}
