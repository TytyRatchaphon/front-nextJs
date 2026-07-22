import { Suspense } from 'react';
import PublicCollectionDetail from '@/features/collection/components/PublicCollectionDetail';

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
