import Rank from '@/features/book/Rank';
import type { Metadata } from 'next';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'จัดอันดับนิยายยอดนิยม',
  description: 'จัดอันดับนิยายยอดนิยมบน Enjoybook นิยายที่มีคนอ่านมากที่สุด นิยายแปล นิยายจีน แฟนตาซี กำลังภายใน โรแมนติก อัพเดททุกวัน',
  alternates: {
    canonical: '/ranking',
  },
  openGraph: {
    title: 'จัดอันดับนิยายยอดนิยม',
    description: 'จัดอันดับนิยายยอดนิยมบน Enjoybook อัพเดททุกวัน',
    url: 'https://enjoybook.co/ranking',
  },
};

export default function RankPage() {
  return (
    <div className="bg-white min-h-screen pb-10">
      <Rank />
    </div>
  );
}