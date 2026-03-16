import { Suspense } from "react";
// import Image from "next/image";
import SearchClient from "@/components/search/SearchClient";
import GifLoader from "@/components/utility/GifLoader";
import "@/components/home/Banner";

export default function SearchPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Content Layout */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <Suspense fallback={<GifLoader className="col-span-full min-h-[60vh]" />}>
            <SearchClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
