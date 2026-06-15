import ThreadDetail from '@/features/book/threadDetail';
import { fetchThreadDetail } from '@/services/apiServices';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import JsonLd from '@/components/seo/JsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { generateThreadSchema } from '@/utils/schema';

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

function stripHtml(html: string) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

const getCachedThreadDetail = (id: string) => unstable_cache(
  async () => fetchThreadDetail(id),
  [`thread-detail-${id}`],
  { revalidate: 60 }
)();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const thread = await getCachedThreadDetail(id);
    if (!thread) {
      return { title: 'กระทู้' };
    }

    const cleanDetail = stripHtml(thread.detail || '').slice(0, 160);

    return {
      title: thread.title,
      description: cleanDetail || `กระทู้ "${thread.title}" บน Enjoybook`,
      alternates: {
        canonical: `/thread/${id}`,
      },
      openGraph: {
        title: thread.title,
        description: cleanDetail,
        url: `https://enjoybook.co/thread/${id}`,
        type: 'article',
      },
    };
  } catch {
    return { title: 'กระทู้' };
  }
}

export default async function ThreadPage({ params }: Props) {
  const { id } = await params;
  let initialThread = null;

  try {
    initialThread = await getCachedThreadDetail(id);
  } catch {
    initialThread = null;
  }

  // Generate Thread JSON-LD schema
  let threadSchema = null;
  if (initialThread) {
    threadSchema = generateThreadSchema({
      title: initialThread.title,
      body: stripHtml(initialThread.detail || '').slice(0, 500),
      url: `https://enjoybook.co/thread/${id}`,
      authorName: initialThread.author || undefined,
      datePublished: initialThread.date_at,
      commentCount: initialThread.comment_count,
    });
  }

  const baseUrl = 'https://enjoybook.co';

  return (
    <>
      {threadSchema && <JsonLd data={threadSchema} />}
      <BreadcrumbJsonLd items={[
        { name: 'หน้าหลัก', url: baseUrl },
        { name: 'กระทู้', url: `${baseUrl}/thread` },
        { name: initialThread?.title || 'กระทู้', url: `${baseUrl}/thread/${id}` },
      ]} />
      <div>
        <ThreadDetail topicId={id} initialThread={initialThread} />
      </div>
    </>
  );
}
