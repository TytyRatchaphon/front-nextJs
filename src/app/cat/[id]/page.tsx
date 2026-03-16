import Category from '@/features/Home/Category'

export const revalidate = 120;
import React from 'react'
import '@/components/home/FooterWrapper';
import '@/components/navbar/navbar';

function Page() {
  return (
    <>
        <Category />
    </>
  )
}

export default Page