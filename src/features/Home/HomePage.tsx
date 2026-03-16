import { fetchHomeData } from "@/services/apiServices";
import HomeContent from "./HomeContent";

export default async function HomePage() {
  const homeData = await fetchHomeData();

  return (
    <HomeContent initialData={homeData} />
  );
}
