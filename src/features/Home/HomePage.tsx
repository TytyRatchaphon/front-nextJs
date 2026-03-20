import { fetchHomeData } from "@/services/apiServices";
import HomeContent from "./HomeContent";
import { unstable_cache } from 'next/cache';

const getCachedHomeData = unstable_cache(
  async () => fetchHomeData(),
  ['home-data-v1'],
  { revalidate: 60 }
);

export default async function HomePage() {
  const homeData = await getCachedHomeData();

  return (
    <HomeContent initialData={homeData} />
  );
}
