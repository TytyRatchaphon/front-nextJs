import type { Metadata } from 'next';
import NotificationPage from '@/features/user/NotificationPage';

export const metadata: Metadata = {
  title: 'การแจ้งเตือน',
  description: 'ดูการแจ้งเตือนทั้งหมดของคุณบน Enjoybook',
  alternates: { canonical: '/user/notification' },
};

export default function Page() {
    return <NotificationPage />;
}
