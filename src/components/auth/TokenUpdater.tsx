"use client"

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { notification } from 'antd'
import DuplicateLoginModal from './DuplicateLoginModal'
import { refreshToken } from '@/services/apiServices'
import { getAuthSession } from '@/services/authPersistence'

import { parseJwtToken } from '@/utils/jwtParser'

const getTokenUserId = (token: string | null | undefined): string | null => {
    try {
        const cleaned = parseJwtToken(token);
        if (!cleaned) return null;

        const payloadPart = cleaned.split('.')[1];
        if (!payloadPart) return null;

        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const payload = JSON.parse(atob(padded));
        const userId = payload?.userId ?? payload?.user_id ?? payload?.id ?? payload?.sub;

        return userId !== undefined && userId !== null ? String(userId) : null;
    } catch {
        return null;
    }
};

export default function TokenUpdater() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const updateToken = useAuthStore((state) => state.updateToken);

    useEffect(() => {
        const incomingRawToken = searchParams.get('token') || searchParams.get('tk');
        if (!incomingRawToken) return;

        const handleIncomingToken = async () => {
            // Clean query token from URL immediately to reduce leakage risk.
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('token');
            newParams.delete('tk');
            const newQuery = newParams.toString();
            const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
            router.replace(newUrl);

            const incomingToken = parseJwtToken(incomingRawToken);
            const currentToken =
                useAuthStore.getState().token ||
                (await getAuthSession())?.token;

            // Do not allow URL token to bootstrap a new login session.
            if (!incomingToken || !currentToken || incomingToken === currentToken) return;

            const incomingUserId = getTokenUserId(incomingToken);
            const currentUserId = getTokenUserId(currentToken);

            // Accept token update only when it belongs to current account.
            if (incomingUserId && currentUserId && incomingUserId !== currentUserId) return;

            updateToken(incomingToken);
            notification.success({
                message: 'อัปเดตยอดเงินสำเร็จ',
                description: 'อัปเดตยอดเงินเรียบร้อยแล้ว',
                placement: 'topRight',
            });
        };

        void handleIncomingToken();
    }, [searchParams, router, pathname, updateToken]);

    useEffect(() => {
        const fetchRefreshToken = async () => {
            // Skip token refresh if logout was just performed.
            try {
                if (sessionStorage.getItem('auth_logout_pending') === '1') return;
            } catch {}

            const savedToken = useAuthStore.getState().token || (await getAuthSession())?.token;
            if (!savedToken) return;

            try {
                const res = await refreshToken(savedToken);
                if (res?.code === 200 && typeof res.data === 'string') {
                    updateToken(res.data);
                } else if (res?.data?.token) {
                    updateToken(res.data.token);
                }
            } catch {
                // Silent fail for background refresh
            }
        };

        fetchRefreshToken();
    }, [updateToken]);

    return (
        <>
            <DuplicateLoginModal />
        </>
    )
}
