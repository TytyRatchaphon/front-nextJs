import React from 'react'
import SprofilePage from '@/features/user/Sprofile'
import { BackToTopButton } from '@/components/utility/BackToTopButton'
import AuthGuard from '@/components/auth/AuthGuard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ตั้งค่าโปรไฟล์ | EnjoyBook',
  description: 'ตั้งค่าโปรไฟล์ - จัดการข้อมูลส่วนตัวของคุณ',
}

function page() {
  return (
    <AuthGuard>
      <SprofilePage />
      <BackToTopButton />
    </AuthGuard>
  )
}

export default page