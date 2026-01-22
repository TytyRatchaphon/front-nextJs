'use client';

import React, { useEffect } from 'react';
import { useLineLogin } from '@/hooks/useLineLogin';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import { useAuthStore } from '@/stores/authStore';

const LineCallbackContent = () => {
    const { initLIFF } = useLineLogin();
    const router = useRouter();
    const { message } = App.useApp();
    const { isLoggedIn } = useAuthStore();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                await initLIFF();
                // initLIFF handles the login logic via handleBackendLogin internally if conditions met.
                // After initLIFF, we check if we are logged in.

                // We can also check localStorage flag to be sure we came from login
                const isLoginProcessing = localStorage.getItem('is_line_login_processing');

                // Give a small delay for store update or just check immediately?
                // handleBackendLogin is awaited in initLIFF so store should be updated.

                if (useAuthStore.getState().isLoggedIn) {
                    message.success('Login Successful');
                    router.replace('/');
                } else {
                    // If not logged in, maybe it was just a normal visit or login failed.
                    // But if we are in callback, likely we want to redirect or show something.
                    // For now, if not logged in after init, we might just stay or redirect home.
                    // Let's assume if it failed, handleBackendLogin would have caught it.

                    // If specific LIFF error?
                    // For now, redirect home if not logged in?
                    router.replace('/');
                }
            } catch (error) {
                console.error("LIFF Init Error", error);
                message.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE");
                router.push('/');
            }
        };

        handleCallback();
    }, [initLIFF, router, message]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <Spin size="large" />
                <p className="mt-4 text-gray-500 font-primary">กำลังยืนยันตัวตนผ่าน LINE...</p>
            </div>
        </div>
    );
};

export default LineCallbackContent;
