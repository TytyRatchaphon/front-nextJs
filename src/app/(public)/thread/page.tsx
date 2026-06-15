import type { Metadata } from 'next';
import Threads from '@/features/Home/Threads'
import { fetchThreads } from '@/services/apiServices';

export const metadata: Metadata = {
  title: 'กระทู้พูดคุย',
  description: 'ร่วมพูดคุย แลกเปลี่ยนความคิดเห็นเกี่ยวกับนิยายบน Enjoybook',
  alternates: { canonical: '/thread' },
};

export const revalidate = 60;
async function page() {
  const initialThreadResponse = await fetchThreads({
    page: 1,
    limit: 9,
    sort: 'newest',
  });

  return (
    <Threads initialThreadResponse={initialThreadResponse} />
  )
}

export default page
