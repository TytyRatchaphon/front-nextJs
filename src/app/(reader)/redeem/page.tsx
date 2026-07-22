import type { Metadata } from 'next';
import Redeem from '@/features/user/Redeem'

export const metadata: Metadata = {
  title: 'แลกไอเทมโค้ด',
  description: 'แลกไอเทมโค้ดรับของรางวัลบน Enjoybook',
  alternates: { canonical: '/redeem' },
};
import AuthGuard from '@/features/auth/components/AuthGuard'

export default function Page() {
  return (
    <AuthGuard>
      <div>
        <Redeem />
      </div>
    </AuthGuard>
  )
}
