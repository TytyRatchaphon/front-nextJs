import React from 'react'
import History from '@/features/user/History'
import AuthGuard from '@/components/auth/AuthGuard'

function page() {
  return (
    <AuthGuard>
      <History />
    </AuthGuard>
  )
}

export default page