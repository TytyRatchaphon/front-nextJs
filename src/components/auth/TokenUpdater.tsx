"use client"

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { App } from 'antd'
import axios from 'axios'
import DuplicateLoginModal from './DuplicateLoginModal'

export default function TokenUpdater() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const { updateToken, token: oldToken } = useAuthStore()
    const { message } = App.useApp()

    useEffect(() => {
        // Check for 'token' or 'tk' in query params
        const newToken = searchParams.get('token') || searchParams.get('tk')

        if (newToken) {
            // Update store with new token
            if (newToken !== oldToken) {
                updateToken(newToken)

                // Fetch fresh profile data immediately using direct Axios
                // because there is no centralized service function for this yet.
                const fetchProfile = async () => {
                    try {
                        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.214:3331';
                        // 2. Replace dynamic import with direct axios.get call
                        // 3. Set headers manually with the new token
                        const response = await axios.get(`${baseUrl}/user/me`, {
                            headers: { 'Authorization': newToken }
                        });

                        const userData = response.data?.data ?? response.data;
                        if (userData) {
                            // 4. On success, call useAuthStore.getState().login to update the store.
                            useAuthStore.getState().login(userData, newToken);
                            message.success('อัปเดตยอดเงินสำเร็จ');
                        }
                    } catch (e) {
                        console.error("Failed to sync profile:", e);
                    }
                };
                fetchProfile();
            }

            // Clean up the URL by removing the token param
            const newParams = new URLSearchParams(searchParams.toString())
            newParams.delete('token')
            newParams.delete('tk')

            const newQuery = newParams.toString()
            const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname

            router.replace(newUrl)
        }
    }, [searchParams, router, pathname, updateToken, message, oldToken])

    // Focus Handler Effect
    useEffect(() => {
        const handleFocus = async () => {
            const currentToken = useAuthStore.getState().token;
            if (!currentToken) return;



            try {
                // Assuming refreshToken is exported from apiServices
                const { refreshToken } = await import('@/services/apiServices');
                const res = await refreshToken();

                if (res?.data) {

                    updateToken(res.data);
                }
            } catch (error: any) {

                // Duplicate login handling is now done via apiClient interceptor globally
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [updateToken, message]);

    return (
        <>
            <DuplicateLoginModal />
        </>
    )
}
