import type { Metadata } from 'next';
import Campaign from '@/features/campaign/Campaign';
import { fetchCampaigns } from '@/services/apiServices';

export const metadata: Metadata = {
  title: 'แคมเปญ',
  description: 'รวมแคมเปญโปรโมชั่นสุดพิเศษบน Enjoybook อ่านนิยายสนุกในราคาคุ้มค่า',
  alternates: { canonical: '/campaign' },
};

export const revalidate = 60; // Cache for 60 seconds

export default async function CampaignPage() {
  const initialData = await fetchCampaigns().catch(() => undefined);

  return (
    <div>
      <Campaign initialData={initialData} />
    </div>
  );
}