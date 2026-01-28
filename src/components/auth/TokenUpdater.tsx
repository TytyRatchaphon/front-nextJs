"use client"

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { App } from 'antd'
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
    }, [searchParams, router, pathname, updateToken, message, oldToken])



    return (
        <>
            <DuplicateLoginModal />
        </>
    )
}
