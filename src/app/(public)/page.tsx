import HomePage from "@/features/Home/HomePage";

export const revalidate = 60;

export default async function Home() {
  return <HomePage />;
}