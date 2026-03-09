"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, hasMounted, setMounted } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!hasMounted) {
            setMounted();
        }
    }, [hasMounted, setMounted]);

    useEffect(() => {
        if (hasMounted && !isLoggedIn) {
            router.push('/');
        }
    }, [isLoggedIn, hasMounted, router]);

    if (!hasMounted) return null;

    if (!isLoggedIn) return null;

    return <>{children}</>;
}
