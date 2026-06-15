import type { Metadata } from 'next';
import CampaignDiscount from '@/features/campaign/CampaignDiscount';

export const metadata: Metadata = {
  title: 'แคมเปญส่วนลด',
  description: 'แคมเปญส่วนลดพิเศษ ซื้อนิยายในราคาพิเศษบน Enjoybook',
  alternates: { canonical: '/campaign-discount' },
};

export default function Page() {
  return <CampaignDiscount />;
}
