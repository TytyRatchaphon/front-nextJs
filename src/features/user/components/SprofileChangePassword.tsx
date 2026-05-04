"use client";
import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  App,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { changeUserPassword } from '@/services/apiServices';

export const SprofileChangePassword = () => {
  const { notification } = App.useApp();
  const { user, token } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    if (!user?.email || !token) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'กรุณาเข้าสู่ระบบใหม่',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        oldpass: values.oldPassword,
        newpass1: values.newPassword,
        newpass2: values.confirmPassword,
        token: token,
      };

      const response = await changeUserPassword(requestData);

      if (response.status === 200 && (response.data.status === 'success' || response.data.code === 200)) {
        notification.success({
          message: 'เปลี่ยนรหัสผ่านสำเร็จ!',
          description: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          placement: 'topRight',
        });
        form.resetFields();
      } else {
        notification.error({
          message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
          description: response.data.message || 'เกิดข้อผิดพลาด',
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='select-none w-full py-4'>
      <p className='text-xl font-bold mb-6 font-primary'>เปลี่ยนรหัสผ่าน</p>
      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Form.Item name="oldPassword" label={<span className="font-primary">รหัสผ่านเดิม</span>} rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านเดิม' }]}>
            <Input.Password className="font-primary" />
          </Form.Item>
          <Form.Item name="newPassword" label={<span className="font-primary">รหัสผ่านใหม่</span>} rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านใหม่' }]}>
            <Input.Password className="font-primary" />
          </Form.Item>
          <Form.Item name="confirmPassword" label={<span className="font-primary">ยืนยันรหัสผ่านใหม่</span>} dependencies={['newPassword']} rules={[{ required: true, message: 'กรุณายืนยันรหัสผ่านใหม่' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('newPassword') === value) { return Promise.resolve(); } return Promise.reject(new Error('รหัสผ่านใหม่ไม่ตรงกัน!')); }, }),]}>
            <Input.Password className="font-primary" />
          </Form.Item>
          <div className="flex flex-col col-span-1 md:col-span-3 justify-center items-center mt-6">
            <Form.Item className="mb-0">
              <Button htmlType="submit" loading={loading} disabled={loading} className="font-primary font-medium border-0 hover:opacity-90 transition-all duration-200" style={{ backgroundColor: '#FF0037', color: '#FFFFFF', borderRadius: '8px', padding: '10px 40px', height: 'auto' }}>
                {loading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </Form.Item>
          </div>
        </div>
      </Form>
    </div>
  );
}
