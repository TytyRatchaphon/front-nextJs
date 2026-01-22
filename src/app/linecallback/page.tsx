import React from 'react';
import LineCallbackContent from '@/features/auth/LineCallbackContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'LINE Login Callback | EnjoyQuiz',
    description: 'LINE Login Callback - EnjoyQuiz',
};

export default function LineCallbackPage() {
    return <LineCallbackContent />;
}
