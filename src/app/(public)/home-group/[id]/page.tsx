import type { Metadata } from 'next';
import { Suspense } from "react";
import { fetchHomeData } from '@/services/apiServices';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  let name = 'หมวดหมู่นิยาย';
  try {
    const homeData = await fetchHomeData();
    const group = homeData?.data?.groupBookHome?.find((g: any) => 
      g.home_group_id?.toString() === resolvedParams.id || 
      g.user_bookhome_section?.toString() === resolvedParams.id
    );
    if (group) {
      name = group.name_web || group.name || name;
    }
  } catch (err) {}
  
  return {
    title: name,
    description: `รวมนิยายสุดสนุกในหมวด ${name} ที่คุณไม่ควรพลาด คัดสรรมาให้คุณอ่านเพลินๆ บน Enjoybook`,
    alternates: { canonical: `/home-group/${resolvedParams.id}` },
  };
}

import HomeGroupPage from "@/features/Home/HomeGroupPage";
import GifLoader from "@/components/utility/GifLoader";

export default function HomeGroupRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[520px] items-center justify-center bg-white">
          <GifLoader />
        </main>
      }
    >
      <HomeGroupPage />
    </Suspense>
  );
}
