"use client";
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import Link from 'next/link';

const FloatingContactButton = () => {
    const { isLoggedIn } = useAuthStore();

    // Show only when user is NOT logged in
    if (isLoggedIn) return null;

    return (
        <Link 
            href="/contact"
            className="fixed bottom-24 right-4 z-[900] cursor-pointer transition-transform hover:scale-110 active:scale-95"
        >
            <div className="relative w-12 h-12 md:w-14 md:h-14 drop-shadow-xl">
                 <Image 
                    src="/images/warning_cat.png"
                    alt="Contact Admin / FAQ"
                    fill
                    className="object-contain"
                    unoptimized
                />
            </div>
        </Link>
    );
};

export default FloatingContactButton;
