import PackCampaign from '@/features/campaign/PackCampaign';
import { fetchPackCampaignDetail } from '@/services/apiServices';
import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';

export const revalidate = 60;

type Props = {
    params: Promise<{ id: string }>;
};

const getCachedPackCampaignDetail = (id: string) =>
    unstable_cache(
        async () => fetchPackCampaignDetail(id),
        [`pack-campaign-${id}`],
        { revalidate: 60 }
    )();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const data = await getCachedPackCampaignDetail(id);
    if (!data) return { title: 'Pack Campaign | EnjoyBook' };

    return {
        title: `${data.name} | EnjoyBook`,
        description: data.detail || `โปรโมชั่น ${data.name} ที่ EnjoyBook`,
        alternates: {
            canonical: `/pack-campaign/${id}`,
        },
    };
}

import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';

export default async function Page({ params }: Props) {
    const { id } = await params;
    const data = await getCachedPackCampaignDetail(id);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://enjoybook.co';
    const campaignName = data?.name || 'โปรโมชั่น';

    return (
        <>
            <BreadcrumbJsonLd items={[
                { name: 'หน้าหลัก', url: baseUrl },
                { name: 'แพ็คโปรโมชั่น', url: `${baseUrl}/novel-pack` },
                { name: campaignName, url: `${baseUrl}/pack-campaign/${id}` },
            ]} />
            <PackCampaign data={data} />
        </>
    );
}
