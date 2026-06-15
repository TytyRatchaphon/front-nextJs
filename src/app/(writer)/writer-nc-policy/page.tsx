import WriterNCPolicyContent from '@/features/policy/WriterNCPolicyContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'คู่มือนักเขียน',
    description: 'คู่มือนักเขียนและข้อกำหนดของ Enjoybook',
    alternates: { canonical: '/writer-nc-policy' },
};

export default function WriterNCPolicyPage() {
    return <WriterNCPolicyContent />;
}
