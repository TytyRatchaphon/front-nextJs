import React from 'react'
import UserProfileEvent from '@/components/event/UserProfileEvent'
import UserUseCoin from '@/components/event/UserUseCoin'
import SevenDaysLogin from '@/components/event/SevenDaysLogin'
import AllEvent from '@/components/event/AllEvent'
import UserTopupCoin from '@/components/event/UserTopupCoin'
import AuthGuard from '@/components/auth/AuthGuard'

function Page() {
  return (
    <AuthGuard>
      <div>
        <div className='mt-6'>
          <UserProfileEvent />
        </div>
        <div>
          <SevenDaysLogin />
        </div>
        <div>
          {/* <AllEvent /> */}
        </div>
        <div className='mt-6 mb-6 flex flex-col gap-6'>
          <UserUseCoin />
          <UserTopupCoin />
        </div>
      </div>
    </AuthGuard>
  )
}

export default Page