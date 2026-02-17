
import React from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import CheckoutContent from '@/features/Home/CheckoutContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Checkout | Niyay',
    description: 'ชำระเงิน',
};

export default function CheckoutPage() {
    return (
        <AuthGuard>
            <CheckoutContent />
        </AuthGuard>
    );
}