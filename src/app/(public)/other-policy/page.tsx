import OtherPolicyContent from '@/features/policy/OtherPolicyContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ข้อกำหนดอื่นๆ',
    description: 'ข้อกำหนดอื่นๆ ของการใช้บริการ Enjoybook',
    alternates: { canonical: '/other-policy' },
};

export default function OtherPolicyPage() {
    return <OtherPolicyContent />;
}