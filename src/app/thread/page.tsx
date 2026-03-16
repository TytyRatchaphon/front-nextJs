import React from 'react'
import Threads from '@/features/Home/Threads'

export const revalidate = 60;
function page() {
  return (
    <Threads />
  )
}

export default page