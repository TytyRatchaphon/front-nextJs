import HowPaymentContent from '@/features/payment/HowPaymentContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'วิธีเติมเหรียญ / ระบบเหรียญ | EnjoyBook',
    description: 'วิธีเติมเหรียญ / ระบบเหรียญ - EnjoyBook',
};

export default function HowPaymentPage() {
    return <HowPaymentContent />;
}