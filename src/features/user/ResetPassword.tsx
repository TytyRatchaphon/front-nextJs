'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, App, notification    } from 'antd';
import { useRouter } from 'next/navigation';
import apiClient from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { CloseCircleOutlined } from '@ant-design/icons';

interface ResetPasswordFieldType {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [token, setToken] = useState('');
  
  // Get token from params
  useEffect(() => {
    setToken(params.token);
  }, [params]);

  const onFinish = async (values: ResetPasswordFieldType) => {
    if (values.password !== values.confirmPassword) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'รหัสผ่านไม่ตรงกัน',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
      return;
    }

    try {
      setLoading(true);
      
      // New Payload: { token, newPassword }
      const payload = {
        token: token,
        newPassword: values.password,
      };
      
      const response = await apiClient.post(
        '/reset-password',
        payload
      );

      modal.success({
        title: 'เปลี่ยนรหัสผ่านสำเร็จ',
        content: 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
        onOk: () => {
             router.push('/');
        },
      });

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
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
          {/* Email field removed as we cannot decode it from the opaque token */}

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
