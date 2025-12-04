"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UserProfileEvent from '@/components/event/UserProfileEvent'
import UserUseCoin from '@/components/event/UserUseCoin'
import SevenDaysLogin from '@/components/event/SevenDaysLogin'
import AllEvent from '@/components/event/AllEvent'
import { useAuthStore } from '@/stores/authStore'

function Page() {
  const router = useRouter()
  const { isLoggedIn, hasMounted } = useAuthStore()

  useEffect(() => {
    // wait until store has been rehydrated/mounted, then redirect if not logged in
    if (hasMounted && !isLoggedIn) {
      router.replace('/')
    }
  }, [hasMounted, isLoggedIn, router])

  // While we haven't determined auth state yet, render nothing (avoids flash)
  if (!hasMounted) return null

  // If not logged in, we've already redirected; still avoid rendering UI
  if (!isLoggedIn) return null

  return (
    <div>
      <div className='mt-6'>
        <UserProfileEvent />
      </div>
      <div>
        <SevenDaysLogin />
      </div>
      <div>
        <AllEvent />
      </div>
      <div className='mt-6 mb-6'>
        <UserUseCoin />
      </div>
    </div>
  )
}

export default Page