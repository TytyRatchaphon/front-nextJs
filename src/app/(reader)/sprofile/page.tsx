import SprofilePage from '@/features/user/Sprofile'
import { BackToTopButton } from '@/components/utility/BackToTopButton'
import AuthGuard from '@/components/auth/AuthGuard'
import { Metadata } from 'next'
import { resolveSprofileTabKey } from '@/features/user/sprofileTabs'

export const metadata: Metadata = {
  title: 'ตั้งค่าโปรไฟล์',
  description: 'จัดการข้อมูลส่วนตัวและการตั้งค่าโปรไฟล์ของคุณบน Enjoybook',
  alternates: { canonical: '/sprofile' },
}

interface SprofileRouteProps {
  searchParams: Promise<{ tab?: string | string[] }> | { tab?: string | string[] };
}

async function page({ searchParams }: SprofileRouteProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const initialTabKey = resolveSprofileTabKey(resolvedSearchParams.tab);

  return (
    <AuthGuard>
      <SprofilePage initialTabKey={initialTabKey} />
      <BackToTopButton />
    </AuthGuard>
  )
}

export default page
