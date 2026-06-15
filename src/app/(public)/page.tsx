import HomePage from "@/features/Home/HomePage";
import JsonLd from "@/components/seo/JsonLd";
import { generateWebSiteSchema } from "@/utils/schema";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function Home() {
  return (
    <>
      <JsonLd data={generateWebSiteSchema()} />
      <HomePage />
    </>
  );
}