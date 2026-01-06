import React, { Suspense } from 'react'
import Shelve from '@/features/user/Shelve'

function page() {
  return (
    <div>
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Shelve />
      </Suspense>
    </div>
  )
}

export default page