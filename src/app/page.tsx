import HomePage from "@/features/Home/HomePage";
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  noStore();
  return <HomePage />;
}