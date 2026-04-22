import HowPaymentContent from '@/features/payment/HowPaymentContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'วิธีเติมเหรียญ / ระบบเหรียญ | EnjoyQuiz',
    description: 'วิธีเติมเหรียญ / ระบบเหรียญ - EnjoyQuiz',
};

export default function HowPaymentPage() {
    return <HowPaymentContent />;
}