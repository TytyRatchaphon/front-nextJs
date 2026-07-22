import CouponDetail from '@/features/Home/CouponDetail'
import AuthGuard from '@/features/auth/components/AuthGuard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'คูปองส่วนลด',
  description: 'รับและใช้งานคูปองส่วนลดพิเศษบน Enjoybook',
  alternates: { canonical: '/coupon' },
}

function page() {
  return (
    <AuthGuard>
      <CouponDetail/>
    </AuthGuard>
  )
}

export default page