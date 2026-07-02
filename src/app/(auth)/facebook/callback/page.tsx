import FacebookCallbackContent from '@/features/auth/FacebookCallbackContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Facebook Login Callback | Enjoybook',
    description: 'Facebook Login Callback - Enjoybook',
};

export default function FacebookCallbackPage() {
    return <FacebookCallbackContent />;
}
