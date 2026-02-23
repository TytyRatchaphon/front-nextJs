'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App, Spin } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import apiClient from '@/services/apiClient';
import { logActivity } from '@/services/apiServices';

interface UserData {
  fullname?: string;
  name?: string;
  email?: string;
  role?: string;
  user_id?: string | number;
  userID?: string | number;
  token?: string;
  pws?: string;
}

const FacebookCallbackContent = () => {
    const router = useRouter();
    const { message } = App.useApp();
    const { login, updateToken } = useAuthStore();
    const { closeLoginModal } = useUIStore();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    const setCookie = (name: string, value: string, days: number = 365) => {
        if (typeof document === 'undefined') return;
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + (value || "") + ";" + expires + ";path=/";
    };

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Facebook sends access_token in the URL fragment (Implicit flow)
                const hash = window.location.hash;
                const params = new URLSearchParams(hash.replace('#', '?'));
                const accessToken = params.get('access_token');

                if (!accessToken) {
                    console.error("Facebook Login: Access token not found in URL");
                    throw new Error("Login failed: Access token missing");
                }

                // Send to Backend
                const response = await apiClient.post(`${API_BASE_URL}/login/facebook`, {
                    accessToken: accessToken
                });

                if (response.data && response.data.data) {
                    const userData = response.data.data as UserData | string;
                    let token = '';
                    let userInfo = {
                        fullname: 'Facebook User',
                        email: 'user@facebook.local',
                        role: 'user',
                        userId: ''
                    };

                    if (typeof userData === 'string') {
                        token = userData;
                    } else {
                        const dataObj = userData as UserData;
                        userInfo = {
                            fullname: dataObj.fullname || dataObj.name || 'Facebook User',
                            email: dataObj.email || 'user@facebook.local',
                            role: dataObj.role || 'user',
                            userId: String(dataObj.user_id || dataObj.userID || '')
                        };
                        token = dataObj.token || dataObj.pws || response.headers?.authorization || response.headers?.['x-auth-token'] || '';
                    }

                    if (token) {
                        setCookie('token', token, 365);
                        setCookie('closePopupPolicy', '', 365);

                        login(userInfo, token);
                        updateToken(token);

                        // Log activity
                        logActivity({ 
                            action: 'login', 
                            target_type: 'user', 
                            target_id: userInfo.userId || '', 
                            metadata: { method: 'facebook_redirect' } 
                        });

                        message.success('เข้าสู่ระบบผ่าน Facebook สำเร็จ!');
                        closeLoginModal();
                        
                        // Final redirect home
                        router.replace('/');
                    } else {
                        throw new Error("Token not received from backend");
                    }
                }
            } catch (error: any) {
                console.error("Facebook Callback Error", error);
                message.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Facebook");
                router.push('/');
            }
        };

        handleCallback();
    }, [router, message, API_BASE_URL, login, updateToken, closeLoginModal]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <Spin size="large" />
                <p className="mt-4 text-gray-500 font-primary">กำลังตรวจสอบข้อมูลจาก Facebook...</p>
            </div>
        </div>
    );
};

export default FacebookCallbackContent;
