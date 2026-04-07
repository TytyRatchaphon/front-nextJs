"use client";

import React from 'react';
import { useWebsiteStore } from '@/stores/websiteStore';
import { Skeleton } from 'antd';
import { sanitizeUserGeneratedHtml } from '@/utils/sanitizeHtml';

export default function PolicyConditionsContent() {
    const { settings, isLoading } = useWebsiteStore();
    const safeConditionsHtml = sanitizeUserGeneratedHtml(settings?.condition || settings?.conditions || '');

    return (
        <div className="min-h-screen bg-[#FDFDFD]">
            {/* Header Section */}
            <div className="relative bg-gradient-to-b from-red-50 to-white pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-200 to-transparent"></div>

                {/* Decorative elements */}
                <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="relative text-center z-10 px-4">
                    <h1 className="text-3xl md:text-5xl font-bold font-primary text-gray-900 mb-6 tracking-tight">
                        ข้อกำหนดการใช้งาน
                    </h1>
                    <div className="h-1.5 w-20 bg-gradient-to-r from-red-600 to-red-500 mx-auto rounded-full shadow-sm"></div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 -mt-12 md:-mt-20 pb-20 relative z-20">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 lg:p-14 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton active paragraph={{ rows: 6 }} />
                        </div>
                    ) : settings?.condition || settings?.conditions ? (
                        <div
                            className="prose prose-lg prose-red max-w-none prose-headings:font-primary prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-loose prose-a:text-red-600 hover:prose-a:text-red-700 prose-li:text-gray-600 fonts-sarabun"
                            dangerouslySetInnerHTML={{ __html: safeConditionsHtml }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <p>ไม่พบข้อมูล</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
