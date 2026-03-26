import React, { Suspense } from 'react'
import Shelve from '@/features/user/Shelve'
import AuthGuard from '@/components/auth/AuthGuard'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'ชั้นหนังสือ | EnjoyBook',
  description: 'ชั้นหนังสือ - จัดการหนังสือที่คุณชื่นชอบ',
}

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
