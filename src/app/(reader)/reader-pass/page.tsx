import type { Metadata } from 'next';
import RoyalePassListPage from "@/features/royale-pass/RoyalePassListPage";

export const metadata: Metadata = {
  title: 'Reader Pass',
  description: 'ทำภารกิจสะสมเลเวล รับของรางวัลสุดเอ็กซ์คลูซีฟมากมาย',
  alternates: { canonical: '/reader-pass' },
};

export default function Page() {
  return <RoyalePassListPage />;
}
