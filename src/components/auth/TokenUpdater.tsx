"use client"

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { App } from 'antd'
import DuplicateLoginModal from './DuplicateLoginModal'
import { refreshToken } from '@/services/apiServices'

import Cookies from 'js-cookie'

export default function TokenUpdater() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const updateToken = useAuthStore((state) => state.updateToken)
    const { message } = App.useApp()

    useEffect(() => {
        // Check for 'token' or 'tk' in query params
        const newToken = searchParams.get('token') || searchParams.get('tk')

        if (newToken) {
            // Get current token directly from store to avoid dependency loop
            const oldToken = useAuthStore.getState().token

            // Update store with new token
            if (newToken !== oldToken) {
                updateToken(newToken)
                message.success('อัปเดตยอดเงินสำเร็จ');
            }

            // Clean up the URL by removing the token param
            const newParams = new URLSearchParams(searchParams.toString())
            newParams.delete('token')
            newParams.delete('tk')

            const newQuery = newParams.toString()
            const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname

            router.replace(newUrl)
        }
    }, [searchParams, router, pathname, updateToken, message])

    useEffect(() => {
        const fetchRefreshToken = async () => {
            // Check if token exists in storage before calling API
            const savedToken = Cookies.get('token') || localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!savedToken) return;

            try {
                const res = await refreshToken();
                // API returns { code: 200, data: "token_string", ... }
                if (res?.code === 200 && typeof res.data === 'string') {
                    updateToken(res.data);
                } else if (res?.data?.token) {
                     // Fallback in case structure changes or I misread
                    updateToken(res.data.token);
                }
            } catch (error) {
                // Silent fail for background refresh
            }
        };

        fetchRefreshToken();
    }, []);



    return (
        <>
            <DuplicateLoginModal />
        </>
    )
}
