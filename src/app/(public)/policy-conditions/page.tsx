import PolicyConditionsContent from '@/features/policy/PolicyConditionsContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ข้อกำหนดการใช้งาน',
    description: 'ข้อกำหนดและเงื่อนไขการใช้งาน Enjoybook สิทธิและหน้าที่ของผู้ใช้งาน',
    alternates: {
        canonical: '/policy-conditions',
    },
};

export default function PolicyConditionsPage() {
    return <PolicyConditionsContent />;
}