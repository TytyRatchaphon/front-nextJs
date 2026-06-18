import type { Metadata } from 'next';
import UserProfile from '@/features/user/UserProfile';
import { getPublicUserProfile } from '@/services/api/publicUserApi';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  let profile = null;
  try {
    profile = await getPublicUserProfile(resolvedParams.id);
  } catch (err) {}
  
  const title = profile?.fullname ? `${profile.fullname} - โปรไฟล์นักอ่าน` : `โปรไฟล์นักอ่าน`;
  const description = `ดูโปรไฟล์ของ ${profile?.fullname || 'นักอ่าน'} รีวิวนิยาย คอลเล็กชันโปรด และประวัติการอ่านบน Enjoybook`;

  return {
    title,
    description,
    alternates: { canonical: `/profile/${resolvedParams.id}` },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <UserProfile userId={id} />;
}
