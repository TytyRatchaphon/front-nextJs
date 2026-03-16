import React from 'react';
import AboutUsContent from '@/features/about/AboutUsContent';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'เกี่ยวกับเรา | EnjoyQuiz',
    description: 'เกี่ยวกับเรา - EnjoyQuiz',
};

export default function AboutUsPage() {
    return <AboutUsContent />;
}