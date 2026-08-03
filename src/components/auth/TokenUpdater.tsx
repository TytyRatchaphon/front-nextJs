"use client"

import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { notification } from 'antd'
import { refreshToken } from '@/services/apiServices'
import { getJwtIdentity, parseJwtToken } from '@/utils/jwtParser'

export default function TokenUpdater() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const updateToken = useAuthStore((state) => state.updateToken);
    const refreshSession = useAuthStore((state) => state.refreshSession);
    const hasMounted = useAuthStore((state) => state.hasMounted);
    const status = useAuthStore((state) => state.status);
    const token = useAuthStore((state) => state.token);
    const refreshedIdentityRef = useRef<string | null>(null);

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
            const currentToken = useAuthStore.getState().token;

            // Do not allow URL token to bootstrap a new login session.
            if (!incomingToken || !currentToken || incomingToken === currentToken) return;

            const incomingUserId = getJwtIdentity(incomingToken);
            const currentUserId = getJwtIdentity(currentToken);

            // Accept token update only when it belongs to current account.
            if (incomingUserId && currentUserId && incomingUserId !== currentUserId) return;

            const updated = await updateToken(incomingToken);
            if (!updated) return;
            notification.success({
                message: 'อัปเดตยอดเงินสำเร็จ',
                description: 'อัปเดตยอดเงินเรียบร้อยแล้ว',
                placement: 'topRight',
            });
        };

        void handleIncomingToken();
    }, [searchParams, router, pathname, updateToken]);

    useEffect(() => {
        const identity = getJwtIdentity(token);
        if (!hasMounted || status !== 'authenticated' || !identity) return;
        if (refreshedIdentityRef.current === identity) return;
        refreshedIdentityRef.current = identity;

        const fetchRefreshToken = async () => {
            await refreshSession(async (currentToken) => {
                const res = await refreshToken(currentToken);
                if (res?.code === 200 && typeof res.data === 'string') return res.data;
                return res?.data?.token ?? null;
            });
        };

        void fetchRefreshToken();
    }, [hasMounted, refreshSession, status, token]);

    return null
}
