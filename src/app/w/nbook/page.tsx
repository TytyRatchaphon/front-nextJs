import React from 'react'
import NewBook from '@/features/mybook/Newbook'
import AuthGuard from '@/components/auth/AuthGuard'

function Page() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <NewBook />
        </div>
      </div>
    </AuthGuard>
  )
}

export default Page