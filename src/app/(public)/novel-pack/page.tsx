import { fetchHomeData } from "@/services/apiServices";
import HomeContent from "@/features/Home/HomeContent";
import { unstable_cache } from "next/cache";

const getCachedNovelPackHomeData = unstable_cache(
  async () => fetchHomeData(undefined, "novel_pack"),
  ["home-data-novel-pack-v1"],
  { revalidate: 60 },
);

export default async function NovelPackPage() {
  const homeData = await getCachedNovelPackHomeData();

  return (
    <HomeContent
      initialData={homeData}
      contentType="novel_pack"
      showPopups={false}
      showSpotlightFeature={false}
    />
  );
}
