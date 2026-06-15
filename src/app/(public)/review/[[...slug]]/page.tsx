import type { Metadata } from 'next';
import ReviewPageClient from '@/features/review/ReviewPageClient';

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const reviewId = resolvedParams.slug?.[0] || '';
  return {
    title: `รีวิวนิยาย`,
    description: `อ่านรีวิวนิยายบน Enjoybook`,
    alternates: { canonical: reviewId ? `/review/${reviewId}` : '/review' },
  };
}

interface Props {
    params: Promise<{
        slug?: string[];
    }>;
}

export default async function ReviewPage({ params }: Props) {
    const { slug } = await params;

    if (slug && slug.length > 0) {
        const reviewId = slug[0];
        return <ReviewPageClient reviewId={reviewId} />;
    }

    // No slug → redirect to home
    const { redirect } = await import('next/navigation');
    redirect('/');
}
