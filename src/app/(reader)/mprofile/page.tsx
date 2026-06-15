import type { Metadata } from 'next';
import MyProfile from '@/features/user/MyProfile'

export const metadata: Metadata = {
  title: 'โปรไฟล์นักอ่าน',
  description: 'ข้อมูลโปรไฟล์นักอ่านของคุณบน Enjoybook',
  alternates: { canonical: '/mprofile' },
};

function page() {
  return (
    <MyProfile />
  )
}

export default page