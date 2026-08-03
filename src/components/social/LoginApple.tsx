'use client';
import { useEffect, useState } from 'react';
import { App } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import Image from 'next/image';
import apiClient from '@/services/apiClient';
import { useLogger } from '@/hooks/useLogger';
import { completeProviderSession, PUBLIC_AUTH_REQUEST_CONFIG } from '@/features/auth/providerSession';

declare global {
    interface Window {
        AppleID: any;
    }
}

import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const LoginApple = () => {
    const { notification } = App.useApp();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuthStore();
    const { closeLoginModal } = useUIStore();
    const { log: logActivity } = useLogger();

    const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ; // Replace with actual Client ID
    const APPLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ; // Replace with actual Redirect URI
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    useEffect(() => {
        // Load Apple Sign-In SDK
        const script = document.createElement('script');
        script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
        script.async = true;
        script.defer = true;

        script.onload = () => {
            if (window.AppleID) {
                window.AppleID.auth.init({
                    clientId: APPLE_CLIENT_ID,
                    scope: 'name email',
                    redirectURI: APPLE_REDIRECT_URI,
                    state: 'origin:web',
                    usePopup: true,
                });
            }
        };

        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [APPLE_CLIENT_ID, APPLE_REDIRECT_URI]);

    const handleAppleLogin = async () => {
        setLoading(true);

        if (typeof window === 'undefined' || !window.AppleID) {
            notification.error({
                message: 'เกิดข้อผิดพลาด',
                description: 'Apple Sign-In SDK ยังไม่โหลด กรุณาลองใหม่อีกครั้ง',
                placement: 'topRight',
            });
            setLoading(false);
            return;
        }

        try {
            const response = await window.AppleID.auth.signIn();
            if (response) {
                // Send to Backend
                await sendToBackend(response);
            }
        } catch (error: any) {
            console.error("Apple Sign-In Error:", error);
            setLoading(false);
            // Apple often returns an object error, not just string
            if (error && error.error === 'popup_closed_by_user') {
                return; // User cancelled, no error message needed
            }
            notification.error({
                message: 'เข้าสู่ระบบไม่สำเร็จ',
                description: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Apple',
                placement: 'topRight',
            });
        }
    };

    const sendToBackend = async (appleResponse: any) => {
        try {
            // Apple response structure: { authorization: { id_token, code, ... }, user: { name: { firstName, lastName }, email } }
            // user object is ONLY returned on the FIRST login.

            const payload = {
                idToken: appleResponse.authorization.id_token,
                code: appleResponse.authorization.code,
                user: appleResponse.user ? JSON.stringify(appleResponse.user) : undefined
            };

            const response = await apiClient.post(
                `${API_BASE_URL}/login/apple`,
                payload,
                PUBLIC_AUTH_REQUEST_CONFIG,
            );

            if (response.data && response.data.data) {
                const userData = response.data.data;
                let token = '';
                let userInfo = {
                    fullname: 'Apple User',
                    email: 'user@apple.com',
                    role: 'user',
                    userId: ''
                };

                if (typeof userData === 'string') {
                    token = userData;
                } else {
                    userInfo = {
                        fullname: userData.fullname || 'Apple User',
                        email: userData.email || 'user@apple.com',
                        role: userData.role || 'user',
                        userId: userData.user_id
                    };
                    token = userData.token || userData.pws || response.headers?.authorization;
                }

                if (token) {
                    await completeProviderSession(login, userInfo, token, 'APPLE');

                    logActivity('login', 'user', userInfo.userId || '', { method: 'apple' });
                    notification.success({
                        message: 'เข้าสู่ระบบสำเร็จ',
                        description: 'เข้าสู่ระบบผ่าน Apple เรียบร้อยแล้ว',
                        placement: 'topRight',
                    });
                    closeLoginModal();
                    setTimeout(() => {
                        router.push('/');
                    }, 500);
                } else {
                    notification.error({
                        message: 'เข้าสู่ระบบไม่สำเร็จ',
                        description: 'ไม่พบ token จาก Backend',
                        placement: 'topRight',
                    });
                }
            }
        } catch (error: any) {
            notification.error({
                message: 'เข้าสู่ระบบไม่สำเร็จ',
                description: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบกับ Server',
                placement: 'topRight',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={!loading ? handleAppleLogin : undefined}
            className={`border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-gray-50 transition-colors ${loading ? 'opacity-50 cursor-wait' : ''}`}
        >
            <Image
                className="inline-block h-[23px] w-[23px]"
                src="/images/apple-logo.png"
                alt="Apple Login"
                width={23}
                height={23}
            />
        </div>
    );
};

export default LoginApple;
