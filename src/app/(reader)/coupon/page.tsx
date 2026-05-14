import CouponDetail from '@/features/Home/CouponDetail'
import AuthGuard from '@/components/auth/AuthGuard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'คูปอง | EnjoyBook',
  description: 'คูปองส่วนลด - รับและใช้คูปองส่วนลดพิเศษ',
}

function page() {
  return (
    <AuthGuard>
      <CouponDetail/>
    </AuthGuard>
  )
}

export default page