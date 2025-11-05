'use client';

import { BackToTopButton } from '@/components/BackToTopButton'
import Banner from '@/components/Banner'
import AllNovel from '@/features/book/AllNovel'
import React from 'react'

export default function Page() {
  return (
    <div className='bg-white font-primary font-medium flex flex-col items-center transition-colors duration-300'>
        <div>
            <Banner/>
        </div>
        <div>
            <AllNovel/>
        </div>
        <BackToTopButton />
    </div>
  )
}