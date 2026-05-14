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
    };
}

export default async function Page({ params }: Props) {
    const { id } = await params;
    const data = await getCachedPackCampaignDetail(id);

    return (
        <>
            <PackCampaign data={data} />
        </>
    );
}
