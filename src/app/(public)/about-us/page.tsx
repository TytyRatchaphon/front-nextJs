import AboutUsContent from '@/features/about/AboutUsContent';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'เกี่ยวกับเรา',
    description: 'Enjoybook แพลตฟอร์มอ่านนิยายออนไลน์ชั้นนำ รวมนิยายแปล นิยายจีน แฟนตาซี กำลังภายใน โรแมนติก และอีกมากมาย',
    alternates: {
        canonical: '/about-us',
    },
};

export default function AboutUsPage() {
    return <AboutUsContent />;
}