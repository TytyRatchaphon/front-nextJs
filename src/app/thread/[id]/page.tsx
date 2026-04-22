import ThreadDetail from '@/features/book/threadDetail'
import { fetchThreadDetail } from '@/services/apiServices';

export const revalidate = 60;

interface PageProps {
  params: Promise<{
    id: string;
  }>
}

export default async function ThreadPage({ params }: PageProps) {
  const { id } = await params;
  let initialThread = null;

  try {
    initialThread = await fetchThreadDetail(id);
  } catch {
    initialThread = null;
  }
  
  return (
    <div>
      <ThreadDetail topicId={id} initialThread={initialThread} />
    </div>
  )
}
