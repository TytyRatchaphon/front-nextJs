"use client"

import { Modal, Button } from 'antd';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { StopOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export default function BlockedUserModal() {
    const { isBlockedUserModalOpen, closeBlockedUserModal } = useUIStore();
    const logout = useAuthStore((state) => state.logout);
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleOk = () => {
        closeBlockedUserModal();
        logout();
        queryClient.clear();
        router.push('/');
    };

    return (
        <Modal
            open={isBlockedUserModalOpen}
            onOk={handleOk}
            onCancel={handleOk}
            footer={null}
            closable={false}
            centered
            className="blocked-user-modal"
            styles={{
                mask: {
                    backdropFilter: 'blur(4px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                }
            }}
        >
            <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <StopOutlined className="text-4xl text-red-500" />
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2 font-bai-jamjuree">
                    บัญชีของคุณถูกระงับการใช้งาน
                </h3>

                <p className="text-gray-500 mb-8 font-bai-jamjuree">
                    เนื่องจากมีการละเมิดข้อกำหนดการใช้งาน <br />
                    กรุณาติดต่อผู้ดูแลระบบหากมีข้อสงสัย
                </p>

                <Button
                    type="primary"
                    danger
                    size="large"
                    onClick={handleOk}
                    className="w-full h-12 text-lg rounded-xl font-bai-jamjuree shadow-lg hover:shadow-red-200 hover:scale-105 transition-all duration-300"
                >
                    รับทราบ, ออกจากระบบ
                </Button>
            </div>
        </Modal>
    );
}
