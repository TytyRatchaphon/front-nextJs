import OtherPolicyContent from '@/features/policy/OtherPolicyContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ข้อกำหนดอื่นๆ | EnjoyBook',
    description: 'ข้อกำหนดอื่นๆ - EnjoyBook',
};

export default function OtherPolicyPage() {
    return <OtherPolicyContent />;
}