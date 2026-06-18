import type { Metadata } from 'next';
import PromotionDetail from '@/features/promotion/PromotionDetail'
import { fetchPromotingGroupDetail } from '@/services/apiServices';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  let title = `โปรโมชั่น`;
  try {
    const detail = await fetchPromotingGroupDetail(resolvedParams.id);
    if (detail?.name) title = detail.name;
  } catch (err) {}

  return {
    title,
    description: `โปรโมชั่น ${title} พบกับหนังสือนิยายที่น่าสนใจและสิทธิพิเศษมากมายบน Enjoybook`,
    alternates: { canonical: `/promotion/${resolvedParams.id}` },
  };
}

export const revalidate = 120;

function page() {
  return (
    <PromotionDetail />
  )
}

export default page