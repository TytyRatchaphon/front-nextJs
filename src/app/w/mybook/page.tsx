import React from 'react'
import MyBook from '@/features/mybook/MyBook'
import AuthGuard from '@/components/auth/AuthGuard'

function page() {
  return (
    <AuthGuard>
      <div>
        <MyBook />
      </div>
    </AuthGuard>
  )
}

export default page