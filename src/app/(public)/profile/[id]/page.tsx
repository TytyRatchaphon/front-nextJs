import type { Metadata } from 'next';
import UserProfile from '@/features/user/UserProfile';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `โปรไฟล์นักอ่าน`,
    description: `โปรไฟล์นักอ่านบน Enjoybook`,
    alternates: { canonical: `/profile/${resolvedParams.id}` },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <UserProfile userId={id} />;
}
