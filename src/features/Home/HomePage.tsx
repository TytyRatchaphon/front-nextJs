import { fetchHomeData } from "@/services/apiServices";
import { unstable_noStore as noStore } from 'next/cache';
import HomeContent from "./HomeContent";

export default async function HomePage() {
  noStore();
  const homeData = await fetchHomeData();

  return (
    <HomeContent initialData={homeData} />
  );
}
