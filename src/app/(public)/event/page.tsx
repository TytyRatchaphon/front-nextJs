import type { Metadata } from 'next';
import UserProfileEvent from '@/features/event/components/UserProfileEvent'
import UserUseCoin from '@/features/event/components/UserUseCoin'
import SevenDaysLoginWrapper from '@/features/event/components/SevenDaysLoginWrapper'
import UserTopupCoin from '@/features/event/components/UserTopupCoin'
import AuthGuard from '@/features/auth/components/AuthGuard'

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
