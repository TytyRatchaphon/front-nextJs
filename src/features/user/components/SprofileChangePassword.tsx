"use client";
import { useState } from 'react';
import {
  Form,
  Input,
  Button,
  App,
  Divider,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { changeUserPassword, changeUserEmail } from '@/services/apiServices';

export const SprofileChangePassword = () => {
  const { notification } = App.useApp();
  const { user, token } = useAuthStore();
  const [passwordForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [passLoading, setPassLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const onFinishPassword = async (values: any) => {
    if (!user?.email || !token) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'กรุณาเข้าสู่ระบบใหม่',
        placement: 'topRight',
      });
      return;
    }

    setPassLoading(true);
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
          placement: 'topRight',
        });
        passwordForm.resetFields();
      } else {
        notification.error({
          message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
          description: response.data.message || 'เกิดข้อผิดพลาด',
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน',
        placement: 'topRight',
      });
    } finally {
      setPassLoading(false);
    }
  };

  const onFinishEmail = async (values: any) => {
    if (!token) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'กรุณาเข้าสู่ระบบใหม่',
        placement: 'topRight',
      });
      return;
    }

    setEmailLoading(true);
    try {
      const payload = {
        new_email: values.newEmail,
        current_password: values.currentPassword,
      };

      const response = await changeUserEmail(payload);

      if (response.status === 200 && (response.data.status === 'success' || response.data.code === 200)) {
        notification.success({
          message: 'เปลี่ยนอีเมลสำเร็จ!',
          description: 'อีเมลของคุณถูกเปลี่ยนเรียบร้อยแล้ว',
          placement: 'topRight',
        });
        emailForm.resetFields();
      } else {
        notification.error({
          message: 'เปลี่ยนอีเมลไม่สำเร็จ',
          description: response.data.message || 'เกิดข้อผิดพลาด',
          placement: 'topRight',
        });
      }
    } catch (error: any) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนอีเมล',
        placement: 'topRight',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className='select-none w-full py-4'>
      {/* Change Password Section */}
      <p className='text-xl font-bold mb-6 font-primary'>เปลี่ยนรหัสผ่าน</p>
      <Form form={passwordForm} layout="vertical" onFinish={onFinishPassword} autoComplete="off">
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
          <div className="flex flex-col col-span-1 md:col-span-3 justify-center items-center mt-4">
            <Form.Item className="mb-0">
              <Button htmlType="submit" loading={passLoading} disabled={passLoading} className="font-primary font-medium border-0 hover:opacity-90 transition-all duration-200" style={{ backgroundColor: '#FF0037', color: '#FFFFFF', borderRadius: '8px', padding: '10px 40px', height: 'auto' }}>
                {passLoading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
              </Button>
            </Form.Item>
          </div>
        </div>
      </Form>

      <Divider className="my-10" />

      {/* Change Email Section */}
      <p className='text-xl font-bold mb-6 font-primary'>เปลี่ยนอีเมล</p>
      <Form form={emailForm} layout="vertical" onFinish={onFinishEmail} autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form.Item 
            name="newEmail" 
            label={<span className="font-primary">อีเมลใหม่</span>} 
            rules={[
              { required: true, message: 'กรุณากรอกอีเมลใหม่' },
              { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
            ]}
          >
            <Input className="font-primary" placeholder="example@gmail.com" />
          </Form.Item>
          <Form.Item 
            name="currentPassword" 
            label={<span className="font-primary">ยืนยันรหัสผ่านปัจจุบัน</span>} 
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านเพื่อยืนยัน' }]}
          >
            <Input.Password className="font-primary" />
          </Form.Item>
          
          <div className="flex flex-col col-span-1 md:col-span-2 justify-center items-center mt-4">
            <Form.Item className="mb-0">
              <Button 
                htmlType="submit" 
                loading={emailLoading} 
                disabled={emailLoading} 
                className="font-primary font-medium border-0 hover:opacity-90 transition-all duration-200" 
                style={{ backgroundColor: '#FF0037', color: '#FFFFFF', borderRadius: '8px', padding: '10px 40px', height: 'auto' }}
              >
                {emailLoading ? 'กำลังเปลี่ยนอีเมล...' : 'เปลี่ยนอีเมล'}
              </Button>
            </Form.Item>
          </div>
        </div>
      </Form>
    </div>
  );
}
