import BookDetailClient from './BookDetailClient';

// Tell Next.js not to pre-render any static paths
export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BookDetailClient id={id} />;
}