import type { Metadata } from 'next';
import UserProfileEvent from '@/components/event/UserProfileEvent'
import UserUseCoin from '@/components/event/UserUseCoin'
import SevenDaysLoginWrapper from '@/components/event/SevenDaysLoginWrapper'
import UserTopupCoin from '@/components/event/UserTopupCoin'
import AuthGuard from '@/components/auth/AuthGuard'

export const metadata: Metadata = {
  title: 'กิจกรรม',
  description: 'รวมกิจกรรมสุดพิเศษ เช็คอินรายวัน สะสมเหรียญ รับรางวัลบน Enjoybook',
  alternates: { canonical: '/event' },
};

function Page() {
  return (
    <AuthGuard>
      <div>
        <div className='mt-6'>
          <UserProfileEvent />
        </div>
        <SevenDaysLoginWrapper />
        <div className='mt-6 mb-6 flex flex-col gap-6'>
          <UserUseCoin />
          <UserTopupCoin />
        </div>
      </div>
    </AuthGuard>
  )
}

export default Page
