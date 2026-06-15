import type { Metadata } from 'next';
import CampaignDetail from '@/features/campaign/CampaignDetail';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `รายละเอียดแคมเปญ`,
    description: `แคมเปญพิเศษบน Enjoybook`,
    alternates: { canonical: `/campaign/${resolvedParams.id}` },
  };
}

export const revalidate = 60;

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <CampaignDetail id={resolvedParams.id} />;
}