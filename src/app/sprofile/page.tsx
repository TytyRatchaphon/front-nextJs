import React from 'react'
import SprofilePage from '@/features/user/Sprofile'
import { BackToTopButton } from '@/components/utility/BackToTopButton'
import AuthGuard from '@/components/auth/AuthGuard'

function page() {
  return (
    <AuthGuard>
      <SprofilePage />
      <BackToTopButton />
    </AuthGuard>
  )
}

export default page