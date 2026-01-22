import { BackToTopButton } from '@/components/utility/BackToTopButton'
import { AllNovelBanner } from '@/components/home/Banner'
import AllNovel from '@/features/book/AllNovel'
import React from 'react'

export default function Page() {
  return (
    <div className='bg-white font-primary font-medium flex flex-col items-center transition-colors duration-300'>
      <div >
        <AllNovelBanner />
      </div>
      <div className="w-full max-w-[1128px] px-4 lg:px-0">
        <AllNovel />
      </div>
      <BackToTopButton />
    </div>
  )
}