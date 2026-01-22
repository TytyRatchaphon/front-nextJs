import React, { Suspense } from 'react'
import Shelve from '@/features/user/Shelve'
import AuthGuard from '@/components/auth/AuthGuard'

function page() {
  return (
    <AuthGuard>
      <div>
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
          <Shelve />
        </Suspense>
      </div>
    </AuthGuard>
  )
}

export default page