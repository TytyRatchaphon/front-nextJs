import Store from '@/features/user/Store'
import AuthGuard from '@/components/auth/AuthGuard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ร้านค้า | EnjoyBook',
  description: 'ร้านค้า - ซื้อเหรียญและไอเทมพิเศษ',
}

function page() {
  return (
    <AuthGuard>
      <div className='mt-12'>
        <Store />
      </div>
    </AuthGuard>
  )
}
export default page