import { redirect } from 'next/navigation';

interface Props {
    params: Promise<{
        slug?: string[];
    }>;
}

export default async function ReviewRedirectPage({ params }: Props) {
    const { slug } = await params;

    if (slug && slug.length > 0) {
        // If there are slugs (e.g. /review/123), redirect to /article/123
        const path = slug.join('/');
        redirect(`/article/${path}`);
    } else {
        // If no slug (e.g. /review), redirect to /article
        redirect('/article');
    }
}
