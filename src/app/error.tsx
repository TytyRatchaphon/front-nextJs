'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service if needed
        console.error('Unhandled App Error:', error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 font-primary text-center">
            <div className="bg-red-50 text-red-500 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
                <svg 
                    className="w-12 h-12" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                </svg>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                เกิดข้อผิดพลาดบางอย่าง
            </h1>
            <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                ขออภัย ระบบไม่สามารถดำเนินการตามคำขอของคุณได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือกลับไปยังหน้าหลัก
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                    onClick={() => reset()}
                    className="bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 font-semibold py-2.5 px-8 rounded-full transition-all duration-300 w-full sm:w-auto"
                >
                    ลองใหม่อีกครั้ง
                </button>
                <Link 
                    href="/" 
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto transform hover:-translate-y-0.5"
                >
                    กลับสู่หน้าหลัก
                </Link>
            </div>
        </div>
    );
}
