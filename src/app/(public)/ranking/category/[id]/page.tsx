import type { Metadata } from 'next';
import CategoryRank from '@/features/Home/CategoryRank'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    return {
        title: `จัดอันดับนิยาย`,
        description: `จัดอันดับนิยายยอดนิยมในหมวดหมู่นี้`,
        alternates: { canonical: `/ranking/category/${resolvedParams.id}` },
    };
}

export const revalidate = 120;

async function page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <CategoryRank categoryId={id} />
    )
}

export default page