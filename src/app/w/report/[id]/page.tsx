import Report from '@/features/mybook/Report';
import AuthGuard from '@/components/auth/AuthGuard';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AuthGuard>
      <Report bookId={id} />
    </AuthGuard>
  );
}