import type { Metadata } from 'next';
import History from '@/features/user/History'

export const metadata: Metadata = {
  title: 'ประวัติการทำรายการ',
  description: 'ดูประวัติการทำรายการกระเป๋าเงินของคุณบน Enjoybook',
  alternates: { canonical: '/wallet/history' },
};
import AuthGuard from '@/features/auth/components/AuthGuard'

function page() {
  return (
    <AuthGuard>
      <History />
    </AuthGuard>
  )
}

export default page