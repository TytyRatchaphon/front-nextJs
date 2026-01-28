import React from 'react';
import LineCallbackContent from '@/features/auth/LineCallbackContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'LINE Login Callback | Enjoybook',
    description: 'LINE Login Callback - Enjoybook',
};

export default function LineCallbackPage() {
    return <LineCallbackContent />;
}
