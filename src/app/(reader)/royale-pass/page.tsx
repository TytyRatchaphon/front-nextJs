import type { Metadata } from 'next';
import RoyalePassListPage from "@/features/royale-pass/RoyalePassListPage";

export const metadata: Metadata = {
  title: 'Royale Pass',
  description: 'ทำภารกิจสะสมเลเวล รับของรางวัลสุดเอ็กซ์คลูซีฟมากมาย',
  alternates: { canonical: '/royale-pass' },
};

export default function Page() {
  return <RoyalePassListPage />;
}
