import type { Metadata } from 'next';
import AchievementPageClient from '@/features/achievement/AchievementPageClient';

export const metadata: Metadata = {
  title: 'ความสำเร็จ',
  description: 'ปลดล็อกความสำเร็จและรับรางวัลบน Enjoybook',
  alternates: { canonical: '/achievement' },
};

export default function AchievementPage() {
    return <AchievementPageClient />;
}
