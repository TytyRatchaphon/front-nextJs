import type { Metadata } from 'next';
import CategoryRank from '@/features/Home/CategoryRank'
import { fetchBookCategoryAll } from '@/services/apiServices';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    let categoryName = '';
    try {
        const categories = await fetchBookCategoryAll();
        const category = categories?.find(c => c.id.toString() === resolvedParams.id);
        if (category?.name) categoryName = category.name;
    } catch (err) {}
    
    const title = categoryName ? `จัดอันดับนิยาย${categoryName}` : `จัดอันดับนิยาย`;
    return {
        title,
        description: `จัดอันดับนิยายยอดนิยมและมาแรงที่สุดในหมวด${categoryName || 'ต่างๆ'} อัปเดตล่าสุด น่าอ่านที่สุดบน Enjoybook`,
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