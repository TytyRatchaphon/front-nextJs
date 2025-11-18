// import Image from "next/image";
import SearchClient from "@/components/SearchClient";
import { SearchBanner } from "@/components/Banner";

export default function SearchPage() {
  return (
    <div className="bg-white min-h-screen">
        <div className="mt-8">
            <SearchBanner />
        </div>
      {/* Content Layout */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <SearchClient />
        </div>
      </div>
    </div>
  );
}