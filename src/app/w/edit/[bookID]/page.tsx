import React from 'react'
import EditBook from '@/features/mybook/EditBook'

// 1. แก้ Type ให้ params เป็น Promise
interface PageProps {
  params: Promise<{
    bookID: string;
  }>
}

// 2. ใส่ keyword 'async' หน้า function
export default async function page({ params }: PageProps) {
  
  // 3. สั่ง await params ก่อนดึงค่าออกมาใช้
  const { bookID } = await params;

  return (
    <EditBook bookId={bookID} />
  )
}