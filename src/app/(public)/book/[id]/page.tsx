import BookDetailClient from "@/components/bookdetail/BookDetailClient";
import type { Metadata, ResolvingMetadata } from 'next'
import { fetchBookDetail, resolveBookId } from "@/services/apiServices";
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import JsonLd from '@/components/seo/JsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { generateBookSchema } from '@/utils/schema';

export const revalidate = 60;

type Props = {
  params: { id: string } | Promise<{ id: string }>
}

function stripHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

const getCachedBookDetail = (id: string) => unstable_cache(
  async () => fetchBookDetail(id),
  [`book-detail-${id}`],
  { revalidate: 60 }
)();

export const getCachedResolvedId = (id: string) => unstable_cache(
  async () => resolveBookId(id),
  [`resolve-book-${id}`],
  { revalidate: 3600 }
)();

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {

  const { id } = await params

  try {
    const book = await getCachedBookDetail(id);
    const cleanDescription = stripHtml(book.des);

    const previousImages = (await parent).openGraph?.images || []

    return {
      title: book.name,
      description: cleanDescription,
      alternates: {
        canonical: `/book/${id}`,
      },
      openGraph: {
        title: book.name,
        description: cleanDescription,
        images: [book.img, ...previousImages],
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/book/${id}`,
        type: 'book',
      },
      twitter: {
        card: 'summary_large_image',
        title: book.name,
        description: cleanDescription,
        images: [book.img],
      },
    }
  } catch {
    return {
      title: 'Enjoybook อ่านนิยาย นิยายแปล อ่านนิยายฟรี นิยายจีน',
      description: 'นิยายหลากหลาย สนุกครบรส ที่ Enjoybook แหล่งรวมนิยายแปลชื่อดัง นิยายจีน แฟนตาซี กำลังภายใน'
    }
  }
}

export default async function BookDetailPage({ params }: Props) {

  const { id: bookId } = await params;


  if (isNaN(Number(bookId))) {
    let resolvedBookId: number | null = null;
    try {
      const resolved = await getCachedResolvedId(bookId);
      if (resolved?.data?.book_id) {
        resolvedBookId = resolved.data.book_id;
      }
    } catch (error) {
      console.error('Failed to resolve book ID:', error);
    }

    if (resolvedBookId) {
      redirect(`/book/${resolvedBookId}`);
    }
  }

  // Fetch book detail for JSON-LD (reuses cache from generateMetadata)
  let bookSchema = null;
  try {
    const book = await getCachedBookDetail(bookId);
    bookSchema = generateBookSchema({
      name: book.name,
      authorName: book['user.fullname'] || '',
      description: stripHtml(book.des),
      image: book.img,
      url: `https://enjoybook.co/book/${bookId}`,
      genre: book['category1.name'],
      genre2: book['category2.name'],
      ratingValue: book.star,
      reviewCount: book.comment,
      numberOfChapters: book.chapter,
      datePublished: book.date_at,
      dateModified: book.update_at,
    });
  } catch {
    // Schema is non-critical; page still renders without it
  }

  const baseUrl = 'https://enjoybook.co';

  return (
    <>
      {bookSchema && <JsonLd data={bookSchema} />}
      <BreadcrumbJsonLd items={[
        { name: 'หน้าหลัก', url: baseUrl },
        { name: 'นิยาย', url: `${baseUrl}/allnovel` },
        { name: bookSchema ? (bookSchema.name as string) : 'รายละเอียดนิยาย', url: `${baseUrl}/book/${bookId}` },
      ]} />
      <BookDetailClient bookId={bookId} />
    </>
  );
}
