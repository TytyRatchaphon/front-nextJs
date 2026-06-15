import WriterProfile from '@/features/user/WriterProfile'
import type { Metadata } from 'next'
import { fetchPublicWriterProfile } from '@/services/api/userApi'
import { unstable_cache } from 'next/cache'

export const revalidate = 300; // Cache for 5 minutes

type Props = {
  searchParams: Promise<{ id?: string }> | { id?: string }
}

const getCachedWriterProfile = (writerId: string) => unstable_cache(
  async () => fetchPublicWriterProfile(writerId),
  [`writer-profile-${writerId}`],
  { revalidate: 300 }
)();

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const writerId = resolvedParams?.id;

  if (!writerId) {
    return {
      title: 'โปรไฟล์นักเขียน',
      description: 'ดูผลงานและติดตามนักเขียนบน Enjoybook แพลตฟอร์มอ่านนิยายออนไลน์',
      alternates: {
        canonical: '/wprofile',
      },
    };
  }

  try {
    const profile = await getCachedWriterProfile(writerId);

    if (!profile?.writer) {
      return {
        title: 'โปรไฟล์นักเขียน',
        description: 'ดูผลงานและติดตามนักเขียนบน Enjoybook แพลตฟอร์มอ่านนิยายออนไลน์',
      };
    }

    const writerName = profile.writer.writer_name;
    const bookCount = profile.book_count || 0;
    const followerCount = profile.follower_count || 0;
    const description = `อ่านนิยายจาก ${writerName} บน Enjoybook — ${bookCount} เรื่อง | ผู้ติดตาม ${followerCount.toLocaleString()} คน`;

    const writerImage = profile.writer.img
      ? (profile.writer.img.startsWith('http')
        ? profile.writer.img
        : `https://img.enjoybook.co/${profile.writer.img}`)
      : undefined;

    return {
      title: `${writerName} — นักเขียนบน Enjoybook`,
      description,
      alternates: {
        canonical: `/wprofile?id=${writerId}`,
      },
      openGraph: {
        title: `${writerName} — นักเขียนบน Enjoybook`,
        description,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://enjoybook.co'}/wprofile?id=${writerId}`,
        type: 'profile',
        ...(writerImage ? { images: [writerImage] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${writerName} — นักเขียนบน Enjoybook`,
        description,
        ...(writerImage ? { images: [writerImage] } : {}),
      },
    };
  } catch {
    return {
      title: 'โปรไฟล์นักเขียน',
      description: 'ดูผลงานและติดตามนักเขียนบน Enjoybook แพลตฟอร์มอ่านนิยายออนไลน์',
    };
  }
}

import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import JsonLd from '@/components/seo/JsonLd';
import { generateProfilePageSchema } from '@/utils/schema';

export default async function Page({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const writerId = resolvedParams?.id;
  
  let writerName = 'โปรไฟล์นักเขียน';
  let profileSchema = null;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://enjoybook.co';

  if (writerId) {
    try {
      const profile = await getCachedWriterProfile(writerId);
      if (profile?.writer?.writer_name) {
        writerName = profile.writer.writer_name;
        
        const writerImage = profile.writer.img
          ? (profile.writer.img.startsWith('http')
            ? profile.writer.img
            : `https://img.enjoybook.co/${profile.writer.img}`)
          : undefined;

        profileSchema = generateProfilePageSchema({
          name: writerName,
          description: `อ่านนิยายจาก ${writerName} บน Enjoybook — ${profile.book_count || 0} เรื่อง | ผู้ติดตาม ${(profile.follower_count || 0).toLocaleString()} คน`,
          url: `${baseUrl}/wprofile?id=${writerId}`,
          image: writerImage,
          interactionStatistic: {
            interactionType: 'FollowAction',
            userInteractionCount: profile.follower_count || 0
          }
        });
      }
    } catch {
      // ignore
    }
  }

  return (
    <>
      {profileSchema && <JsonLd data={profileSchema} />}
      <BreadcrumbJsonLd items={[
        { name: 'หน้าหลัก', url: baseUrl },
        { name: 'นักเขียน', url: `${baseUrl}/wprofile` },
        { name: writerName, url: `${baseUrl}/wprofile${writerId ? `?id=${writerId}` : ''}` },
      ]} />
      <WriterProfile />
    </>
  )
}