import type { Metadata } from 'next';
import PromotionDetail from '@/features/promotion/PromotionDetail'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `โปรโมชั่น`,
    description: `โปรโมชั่นสุดพิเศษบน Enjoybook`,
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