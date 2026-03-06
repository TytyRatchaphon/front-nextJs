import React from 'react';
import Campaign, { fetchCampaigns } from '@/features/campaign/Campaign';

export const revalidate = 60; // Cache for 60 seconds

export default async function CampaignPage() {
  const initialData = await fetchCampaigns().catch(() => undefined);

  return (
    <div>
      <Campaign initialData={initialData} />
    </div>
  );
}