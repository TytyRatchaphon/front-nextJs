import AuthGuard from '@/features/auth/components/AuthGuard';
import CheckoutContent from '@/features/Home/CheckoutContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ชำระเงิน',
    description: 'ชำระเงินและตรวจสอบคำสั่งซื้อบน Enjoybook',
    alternates: { canonical: '/checkout' },
};

export default function CheckoutPage() {
    return (
        <AuthGuard>
            <CheckoutContent />
        </AuthGuard>
    );
}