import SprofilePage from '@/features/user/Sprofile'
import { BackToTopButton } from '@/components/utility/BackToTopButton'
import AuthGuard from '@/features/auth/components/AuthGuard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ตั้งค่าโปรไฟล์',
  description: 'จัดการข้อมูลส่วนตัวและการตั้งค่าโปรไฟล์ของคุณบน Enjoybook',
  alternates: { canonical: '/sprofile' },
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