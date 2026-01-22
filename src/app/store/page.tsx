import Store from '@/features/user/Store'
import React from 'react'
import AuthGuard from '@/components/auth/AuthGuard'

function page() {
  return (
    <AuthGuard>
      <div className='mt-12'>
        <Store />
      </div>
    </AuthGuard>
  )
}
export default page