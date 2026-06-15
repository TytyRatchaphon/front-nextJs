import PrivacyPolicyContent from '@/features/policy/PrivacyPolicyContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'นโยบายความเป็นส่วนตัว',
    description: 'นโยบายความเป็นส่วนตัวของ Enjoybook การเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล',
    alternates: {
        canonical: '/policy-privacy',
    },
};

export default function PrivacyPolicyPage() {
    return <PrivacyPolicyContent />;
}
