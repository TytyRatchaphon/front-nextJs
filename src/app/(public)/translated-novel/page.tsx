import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

import HomeContent from "@/features/Home/HomeContent";
import { fetchHomeData } from "@/services/apiServices";

const CONTENT_TYPE = "trancn";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "นิยายแปล",
  description: "อ่านนิยายแปลลิขสิทธิ์แท้ สนุกสุดมันส์ หลากหลายแนว อัปเดตตอนใหม่ทุกวันบน Enjoybook",
  alternates: { canonical: '/translated-novel' },
};

const getCachedTranslatedNovelHomeData = unstable_cache(
  async () => fetchHomeData(undefined, CONTENT_TYPE),
  ["home-data-translated-novel-v1"],
  { revalidate: 60 },
);

export default async function TranslatedNovelPage() {
  const homeData = await getCachedTranslatedNovelHomeData();

  return (
    <HomeContent
      initialData={homeData}
      contentType={CONTENT_TYPE}
    />
  );
}
