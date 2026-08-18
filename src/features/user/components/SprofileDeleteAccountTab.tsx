"use client";

import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Modal,
  App,
  Alert,
  Checkbox,
} from 'antd';
import { WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { deleteUserAccount } from '@/services/api/userApi';

export const SprofileDeleteAccountTab = () => {
  const { notification } = App.useApp();
  const { logout } = useAuthStore();
  const router = useRouter();

  // Modal Step States: 0 = Closed, 1 = Password Input, 2 = Final Confirmation
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAcceptedRisk, setIsAcceptedRisk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Step 1: Open Password Modal
  const handleOpenStep1 = () => {
    form.resetFields();
    setPasswordInput('');
    setIsAcceptedRisk(false);
    setConfirmStep(1);
  };

  // Step 1 Submit -> Proceed to Step 2
  const handleStep1Finish = (values: { password: string }) => {
    setPasswordInput(values.password);
    setConfirmStep(2);
  };

  // Step 2 Submit -> Execute Delete API
  const handleFinalDelete = async () => {
    if (!passwordInput) {
      setConfirmStep(1);
      return;
    }

    setLoading(true);
    try {
      const response = await deleteUserAccount(passwordInput);

      if (response.code === 200 || response.status === 'success') {
        notification.success({
          message: 'ลบบัญชีผู้ใช้สำเร็จ',
          description: 'บัญชีผู้ใช้ของคุณถูกลบออกจากระบบเรียบร้อยแล้ว',
          placement: 'topRight',
        });

        // Close modals and clear session
        setConfirmStep(0);
        logout();
        router.push('/');
      } else {
        notification.error({
          message: 'ลบบัญชีไม่สำเร็จ',
          description: response.message || 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
          placement: 'topRight',
        });
        setConfirmStep(1);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: errorMsg,
        placement: 'topRight',
      });

      if (error.response?.status === 401) {
        logout();
        router.push('/');
      } else {
        // Back to password input modal if password was wrong
        setConfirmStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="select-none w-full py-4 space-y-6">
      {/* Danger Zone Header */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
            <WarningOutlined className="text-2xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-700 font-primary mb-2">
              ลบบัญชีผู้ใช้ (Danger Zone)
            </h3>
            <p className="text-sm text-red-600 font-primary leading-relaxed mb-4">
              การลบบัญชีเป็นกระบวนการถาวร เมื่อดำเนินการลบบัญชีแล้ว คุณจะไม่สามารถกู้คืนข้อมูล ข้อมูลส่วนตัว 
              เหรียญคอยน์สะสม ประวัติการอ่าน หรือสิทธิ์การเข้าถึงนิยายทั้งหมดที่คุณเคยสั่งซื้อได้อีกต่อไป
            </p>

            <Button
              type="primary"
              danger
              size="large"
              icon={<ExclamationCircleOutlined />}
              onClick={handleOpenStep1}
              className="font-primary font-medium"
            >
              ลบบัญชีผู้ใช้
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Step 1 Modal: Enter Password */}
      <Modal
        title={
          <span className="font-primary text-base font-bold flex items-center gap-2">
            <ExclamationCircleOutlined className="text-red-500" />
            ยืนยันการลบบัญชี (ขั้นตอนที่ 1 จาก 2)
          </span>
        }
        open={confirmStep === 1}
        onCancel={() => setConfirmStep(0)}
        footer={null}
        destroyOnHidden
      >
        <div className="py-2">
          <p className="text-sm text-gray-600 font-primary mb-4">
            กรุณากรอกรหัสผ่านปัจจุบันของคุณเพื่อยืนยันตัวตนก่อนดำเนินการลบบัญชี
          </p>

          <Form form={form} layout="vertical" onFinish={handleStep1Finish}>
            <Form.Item
              name="password"
              label={<span className="font-primary">รหัสผ่านปัจจุบัน</span>}
              rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านปัจจุบัน' }]}
            >
              <Input.Password className="font-primary" placeholder="รหัสผ่านปัจจุบัน" />
            </Form.Item>

            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={() => setConfirmStep(0)} className="font-primary">
                ยกเลิก
              </Button>

              <Button type="primary" danger htmlType="submit" className="font-primary">
                ถัดไป (ขั้นตอนที่ 2)
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Confirmation Step 2 Modal: Final Confirmation */}
      <Modal
        title={
          <span className="font-primary text-base font-bold text-red-600 flex items-center gap-2">
            <WarningOutlined />
            ยืนยันครั้งสุดท้าย (ขั้นตอนที่ 2 จาก 2)
          </span>
        }
        open={confirmStep === 2}
        onCancel={() => setConfirmStep(0)}
        footer={null}
        destroyOnHidden
      >
        <div className="py-2 space-y-4">
          <Alert
            message="คำเตือนสุดท้าย"
            description="คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีถาวร? เมื่อกดยืนยันแล้ว ข้อมูลและสิทธิ์ทั้งหมดของคุณจะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้"
            type="error"
            showIcon
          />

          <div className="py-2">
            <Checkbox
              checked={isAcceptedRisk}
              onChange={(e) => setIsAcceptedRisk(e.target.checked)}
              className="font-primary text-xs"
            >
              ฉันเข้าใจและยอมรับว่าการลบบัญชีนี้ไม่สามารถกู้คืนข้อมูลได้ในทุกกรณี
            </Checkbox>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button
              onClick={() => setConfirmStep(1)}
              disabled={loading}
              className="font-primary"
            >
              ย้อนกลับ
            </Button>

            <Button
              type="primary"
              danger
              loading={loading}
              disabled={!isAcceptedRisk || loading}
              onClick={handleFinalDelete}
              className="font-primary"
            >
              {loading ? 'กำลังลบบัญชี...' : 'ยืนยันลบบัญชีถาวร'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
