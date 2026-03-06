import { BackToTopButton } from '@/components/utility/BackToTopButton'
import { AllNovelBanner } from '@/components/home/Banner'
import AllNovel, { searchBooks, SearchParams } from '@/features/book/AllNovel'
import React from 'react'

export const revalidate = 60;

export default async function Page() {
  const initialParams: SearchParams = {
    query: "",
    categories: [],
    types: [],
    status: [],
    end: "all",
    sortBy: "update_at",
    order: "DESC",
  };
  
  const initialData = await searchBooks(initialParams, 1, 18).catch(() => undefined);

  return (
    <div className='bg-white font-primary font-medium flex flex-col items-center transition-colors duration-300'>
      <div >
        <AllNovelBanner />
      </div>
      <div className="w-full max-w-[1128px] px-4 lg:px-0">
        <AllNovel initialData={initialData} />
      </div>
      <BackToTopButton />
    </div>
  )
}