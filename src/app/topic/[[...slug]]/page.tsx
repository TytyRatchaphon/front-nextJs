import { redirect } from 'next/navigation';

interface Props {
    params: Promise<{
        slug?: string[];
    }>;
}

export default async function TopicRedirectPage({ params }: Props) {
    const { slug } = await params;

    // Always redirect to /thread regardless of slugs
    redirect('/thread');
}
