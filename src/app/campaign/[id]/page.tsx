import React from 'react';
import CampaignDetail from '@/features/campaign/CampaignDetail';

export const revalidate = 60;

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <CampaignDetail id={resolvedParams.id} />;
}