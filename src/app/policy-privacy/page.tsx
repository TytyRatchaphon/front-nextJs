import React from 'react';
import PrivacyPolicyContent from '@/features/policy/PrivacyPolicyContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'นโยบายความเป็นส่วนตัว | EnjoyQuiz',
    description: 'นโยบายความเป็นส่วนตัว - EnjoyQuiz',
};

export default function PrivacyPolicyPage() {
    return <PrivacyPolicyContent />;
}
