import BookDetailClient from "../../../components/bookdetail/BookDetailClient";

export default async function BookDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Next.js may provide params as a promise in some environments — await to be safe
  const { id: bookId } = await params;
  return <BookDetailClient bookId={bookId} />;
}