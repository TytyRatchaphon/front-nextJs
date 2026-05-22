"use client"

import { Modal, Button } from 'antd';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { WarningOutlined } from '@ant-design/icons';
import 'next/image';

export default function DuplicateLoginModal() {
    const { isDuplicateLoginModalOpen, closeDuplicateLoginModal } = useUIStore();
    const logout = useAuthStore((state) => state.logout);



    const handleOk = () => {
        closeDuplicateLoginModal();
        logout();
        window.location.href = '/';
    };

    return (
        <Modal
            open={isDuplicateLoginModalOpen}
            onOk={handleOk}
            onCancel={handleOk} // Prevent closing without logging out (or make it just close, but logout is safer)
            footer={null}
            closable={false}
            centered
            className="duplicate-login-modal"
            styles={{
                mask: {
                    backdropFilter: 'blur(4px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                }
            }}
        >
            <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <WarningOutlined className="text-4xl text-red-500" />
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2 font-bai-jamjuree">
                    มีการเข้าสู่ระบบจากอุปกรณ์อื่น
                </h3>

                <p className="text-gray-500 mb-8 font-bai-jamjuree">
                    ระบบตรวจพบการใช้งานบัญชีของคุณจากอุปกรณ์อื่น <br />
                    กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อความปลอดภัย
                </p>

                <Button
                    type="primary"
                    danger
                    size="large"
                    onClick={handleOk}
                    className="w-full h-12 text-lg rounded-xl font-bai-jamjuree shadow-lg hover:shadow-red-200 hover:scale-105 transition-all duration-300"
                >
                    ตกลง, ออกจากระบบ
                </Button>
            </div>
        </Modal>
    );
}
