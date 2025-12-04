import React from 'react'
import NewBook from '@/features/mybook/Newbook' 

function Page() {
  return (

    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <NewBook />
      </div>
    </div>
  )
}

export default Page