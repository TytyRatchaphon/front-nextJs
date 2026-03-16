
import React from 'react';
import PackCampaign from '@/features/campaign/PackCampaign';
import { fetchPackCampaignDetail } from '@/services/apiServices';
import { Metadata } from 'next';

export const revalidate = 60;

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const data = await fetchPackCampaignDetail(id);
    if (!data) return { title: 'Pack Campaign | EnjoyBook' };

    return {
        title: `${data.name} | EnjoyBook`,
        description: data.detail || `โปรโมชั่น ${data.name} ที่ EnjoyBook`,
    };
}

export default async function Page({ params }: Props) {
    const { id } = await params;
    const data = await fetchPackCampaignDetail(id);

    return (
        <>
            <PackCampaign data={data} />
        </>
    );
}