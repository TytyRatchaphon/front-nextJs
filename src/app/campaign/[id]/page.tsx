import React from 'react';
import CampaignDetail from '@/features/campaign/CampaignDetail';

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <CampaignDetail id={resolvedParams.id} />;
}