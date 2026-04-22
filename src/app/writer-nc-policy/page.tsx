import WriterNCPolicyContent from '@/features/policy/WriterNCPolicyContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'คู่มือนักเขียน | EnjoyBook',
    description: 'คู่มือนักเขียน - EnjoyBook',
};

export default function WriterNCPolicyPage() {
    return <WriterNCPolicyContent />;
}
