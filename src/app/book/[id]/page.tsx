import BookDetailClient from "../../../components/bookdetail/BookDetailClient";
import type { Metadata, ResolvingMetadata } from 'next'
import { fetchBookDetail, resolveBookId } from "@/services/apiServices";
import { redirect } from 'next/navigation';

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

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {

  const { id } = await params

  try {
    const book = await fetchBookDetail(id);
    const cleanDescription = stripHtml(book.des);

    const previousImages = (await parent).openGraph?.images || []

    return {
      title: `${book.name} | Enjoybook`,
      description: cleanDescription,
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
  } catch (error) {
    return {
      title: 'Enjoybook อ่านนิยาย นิยายแปล อ่านนิยายฟรี นิยายจีน',
      description: 'นิยายหลากหลาย สนุกครบรส ที่ Enjoybook แหล่งรวมนิยายแปลชื่อดัง นิยายไทย แฟนตาซี กำลังภายใน'
    }
  }
}

export default async function BookDetailPage({ params }: Props) {

  const { id: bookId } = await params;


  if (isNaN(Number(bookId))) {
    let resolvedBookId: number | null = null;
    try {
      const resolved = await resolveBookId(bookId);
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

  return <BookDetailClient bookId={bookId} />;
}