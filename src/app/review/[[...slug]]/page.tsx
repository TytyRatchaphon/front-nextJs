import ReviewPageClient from '@/features/review/ReviewPageClient';

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
