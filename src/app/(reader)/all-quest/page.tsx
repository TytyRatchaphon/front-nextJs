import type { Metadata } from 'next';
import AllQuestPage from "@/features/user/AllQuestPage";

export const metadata: Metadata = {
  title: 'ภารกิจทั้งหมด',
  description: 'ทำภารกิจเพื่อรับรางวัลบน Enjoybook',
  alternates: { canonical: '/all-quest' },
};

const Page = () => {
  return <AllQuestPage />;
};

export default Page;
