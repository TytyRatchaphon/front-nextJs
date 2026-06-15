import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

import HomeContent from "@/features/Home/HomeContent";
import { fetchHomeData } from "@/services/apiServices";

const CONTENT_TYPE = "fiction";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "นิยายแต่ง",
  description: "อ่านนิยายแต่งสุดมันส์ หลากหลายแนว อัปเดตตอนใหม่ทุกวันบน Enjoybook",
  alternates: { canonical: '/fiction-novel' },
};

const getCachedFictionNovelHomeData = unstable_cache(
  async () => fetchHomeData(undefined, CONTENT_TYPE),
  ["home-data-fiction-novel-v1"],
  { revalidate: 60 },
);

export default async function FictionNovelPage() {
  const homeData = await getCachedFictionNovelHomeData();

  return (
    <HomeContent
      initialData={homeData}
      contentType={CONTENT_TYPE}
    />
  );
}
