import { Suspense } from 'react';
import AuthGuard from '@/features/auth/components/AuthGuard';
import CollectionDetail from '@/features/collection/components/CollectionDetail';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'คอลเลคชั่น | EnjoyBook',
  description: 'จัดการคอลเลคชั่นหนังสือของคุณ',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <CollectionDetail collectionId={id} />
      </Suspense>
    </AuthGuard>
  );
}
