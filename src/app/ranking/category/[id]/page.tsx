import React from 'react'
import CategoryRank from '@/features/Home/CategoryRank'

export const revalidate = 120;

async function page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <CategoryRank categoryId={id} />
    )
}

export default page