import AboutUsContent from '@/features/about/AboutUsContent';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'เกี่ยวกับเรา | EnjoyBook',
    description: 'เกี่ยวกับเรา - EnjoyBook',
};

export default function AboutUsPage() {
    return <AboutUsContent />;
}