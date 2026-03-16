import React from 'react';
import FaqContent from '@/features/faq/FaqContent';

export const revalidate = 3600;

export default function FaqPage() {
    return (
        <FaqContent />
    );
}