import React from 'react'
import Redeem from '@/features/user/Redeem'
import AuthGuard from '@/components/auth/AuthGuard'

export default function Page() {
  return (
    <AuthGuard>
      <div>
        <Redeem />
      </div>
    </AuthGuard>
  )
}
