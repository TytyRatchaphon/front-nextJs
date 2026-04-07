"use client";

import React from 'react';
import { Collapse } from 'antd';
import type { FaqItem } from '@/services/apiServices';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { sanitizeUserGeneratedHtml } from '@/utils/sanitizeHtml';

interface FaqContentProps {
    initialFaqs?: FaqItem[];
}

export default function FaqContent({ initialFaqs = [] }: FaqContentProps) {
    const faqs = initialFaqs;

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-primary">
            {/* Header Section */}
            <div className="relative bg-gradient-to-b from-red-50 to-white pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-200 to-transparent"></div>
                {/* Decorative elements */}
                <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="relative text-center z-10 px-4">
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        คำถามที่พบบ่อย (FAQ)
                    </h1>
                    <div className="h-1.5 w-20 bg-gradient-to-r from-red-600 to-red-500 mx-auto rounded-full shadow-sm mb-4"></div>
                    <p className="mt-4 text-gray-500 text-lg">รวบรวมคำถามและคำตอบที่พบบ่อยเกี่ยวกับการใช้งาน</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 -mt-12 md:-mt-20 pb-20 relative z-20">
                <div className="max-w-4xl mx-auto">
                    {faqs.length > 0 ? (
                        <div className="space-y-4">
                            <Collapse
                                accordion
                                expandIconPosition="end"
                                expandIcon={({ isActive }) => (
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${isActive ? 'bg-red-100 text-red-600 rotate-180' : 'bg-gray-50 text-gray-400'}`}>
                                       {isActive ? <MinusOutlined /> : <PlusOutlined />}
                                    </div>
                                )}
                                className="bg-transparent border-none flex flex-col gap-4"
                                items={faqs.map((faq) => ({
                                    key: String(faq.id),
                                    label: (
                                        <div className="py-2 text-lg font-bold text-gray-800 hover:text-red-600 transition-colors">
                                            {faq.question}
                                        </div>
                                    ),
                                    children: (
                                        <div 
                                            className="text-gray-600 leading-relaxed prose prose-red max-w-none"
                                            dangerouslySetInnerHTML={{ __html: sanitizeUserGeneratedHtml(faq.answer) }}
                                        />
                                    ),
                                    style: {
                                        background: '#ffffff',
                                        borderRadius: '16px',
                                        border: '1px solid #f3f4f6', // subtle border
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 20px -8px rgba(0, 0, 0, 0.05)',
                                    }
                                }))}
                            />
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-400">
                            <p>ไม่พบข้อมูลคำถามที่พบบ่อย</p>
                        </div>
                    )}
                </div>
            </div>
            
            <style jsx global>{`
              .ant-collapse-content {
                  border-top: 1px solid #f3f4f6 !important;
              }
              .ant-collapse-header {
                  align-items: center !important;
                  padding: 20px 24px !important;
              }
              .ant-collapse-content-box {
                  padding: 24px !important;
              }
            `}</style>
        </div>
    );
}
