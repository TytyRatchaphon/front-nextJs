import type { Metadata } from 'next';
import { Suspense } from "react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `หมวดหมู่นิยาย`,
    description: `รวมนิยายในหมวดหมู่นี้`,
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
