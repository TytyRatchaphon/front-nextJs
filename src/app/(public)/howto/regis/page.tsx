import type { Metadata } from 'next';
import HowToRegis from '@/features/Home/HowToRegis'

export const metadata: Metadata = {
  title: 'วิธีสมัครสมาชิก',
  description: 'วิธีสมัครสมาชิก Enjoybook เพื่อเริ่มต้นอ่านนิยายออนไลน์',
  alternates: { canonical: '/howto/regis' },
};

function page() {
  return (
    <HowToRegis />
  )
}

export default page