import PrivacyPolicyContent from '@/features/policy/PrivacyPolicyContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'นโยบายความเป็นส่วนตัว | EnjoyBook',
    description: 'นโยบายความเป็นส่วนตัว - EnjoyBook',
};

export default function PrivacyPolicyPage() {
    return <PrivacyPolicyContent />;
}
