import React, { Suspense } from 'react';
import PublicCollectionDetail from '@/components/collection/PublicCollectionDetail';

interface PageProps {
  params: Promise<{ id: string; collectionId: string }>;
}

export default async function PublicCollectionPage({ params }: PageProps) {
  const { id, collectionId } = await params;

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PublicCollectionDetail userId={id} collectionId={collectionId} />
    </Suspense>
  );
}
