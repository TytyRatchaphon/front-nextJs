import React from 'react';
import PolicyConditionsContent from '@/features/policy/PolicyConditionsContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ข้อกำหนดการใช้งาน | EnjoyQuiz',
    description: 'ข้อกำหนดการใช้งาน - EnjoyQuiz',
};

export default function PolicyConditionsPage() {
    return <PolicyConditionsContent />;
}