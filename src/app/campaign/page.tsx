import Campaign from '@/features/campaign/Campaign';
import { fetchCampaigns } from '@/services/apiServices';

export const revalidate = 60; // Cache for 60 seconds

export default async function CampaignPage() {
  const initialData = await fetchCampaigns().catch(() => undefined);

  return (
    <div>
      <Campaign initialData={initialData} />
    </div>
  );
}