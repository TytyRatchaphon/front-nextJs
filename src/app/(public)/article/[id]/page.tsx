import ArticleDetail from '@/features/article/ArticleDetail';
import { fetchArticleDetail } from '@/services/apiServices';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import JsonLd from '@/components/seo/JsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { generateArticleSchema } from '@/utils/schema';

export const revalidate = 120;

type Props = {
  params: Promise<{ id: string }>;
};

function stripHtml(html: string) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

const getCachedArticleDetail = (id: string) => unstable_cache(
  async () => fetchArticleDetail(id),
  [`article-detail-${id}`],
  { revalidate: 120 }
)();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const data = await getCachedArticleDetail(id);
    const article = data?.data?.result?.[0];
    if (!article) {
      return { title: 'บทความ' };
    }

    const cleanDescription = stripHtml(article.description || article.detail_1 || '').slice(0, 160);

    return {
      title: article.name || article.title,
      description: cleanDescription || `อ่านบทความ ${article.name} ที่ Enjoybook`,
      alternates: {
        canonical: `/article/${id}`,
      },
      openGraph: {
        title: article.name || article.title,
        description: cleanDescription,
        images: article.img ? [article.img] : [],
        url: `https://enjoybook.co/article/${id}`,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: article.name || article.title,
        description: cleanDescription,
        images: article.img ? [article.img] : [],
      },
    };
  } catch {
    return { title: 'บทความ' };
  }
}

export default async function ArticlePage({ params }: Props) {
  const resolvedParams = await params;
  const initialData = await getCachedArticleDetail(resolvedParams.id);

  // Generate Article JSON-LD schema
  let articleSchema = null;
  const article = initialData?.data?.result?.[0];
  if (article) {
    articleSchema = generateArticleSchema({
      title: article.name || article.title,
      description: stripHtml(article.description || article.detail_1 || '').slice(0, 300),
      image: article.img,
      url: `https://enjoybook.co/article/${resolvedParams.id}`,
      authorName: article.post_by || undefined,
      datePublished: article.date_post,
      dateModified: article.update_at,
    });
  }

  const baseUrl = 'https://enjoybook.co';

  return (
    <>
      {articleSchema && <JsonLd data={articleSchema} />}
      <BreadcrumbJsonLd items={[
        { name: 'หน้าหลัก', url: baseUrl },
        { name: 'บทความ', url: `${baseUrl}/article` },
        { name: article?.name || 'บทความ', url: `${baseUrl}/article/${resolvedParams.id}` },
      ]} />
      <ArticleDetail id={resolvedParams.id} initialData={initialData} />
    </>
  );
}
