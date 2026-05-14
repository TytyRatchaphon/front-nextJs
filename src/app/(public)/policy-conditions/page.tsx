import PolicyConditionsContent from '@/features/policy/PolicyConditionsContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ข้อกำหนดการใช้งาน | EnjoyBook',
    description: 'ข้อกำหนดการใช้งาน - EnjoyBook',
};

export default function PolicyConditionsPage() {
    return <PolicyConditionsContent />;
}