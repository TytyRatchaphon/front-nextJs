import { fetchHomeData, fetchBookUpdates, fetchRankingCategories } from "@/services/apiServices";
import { unstable_noStore as noStore } from 'next/cache';
import HomeContent from "./HomeContent";

export default async function HomePage() {
  noStore();
  const [homeData, bookUpdates, rankingCategories] = await Promise.all([
    fetchHomeData(),
    fetchBookUpdates(),
    fetchRankingCategories(),
  ]);

  return (
    <HomeContent 
      initialData={homeData} 
      initialBookUpdates={bookUpdates}
      initialRankingCategories={rankingCategories}
    />
  );
}
