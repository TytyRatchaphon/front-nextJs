import { Suspense } from "react";

import HomeGroupPage from "@/features/Home/HomeGroupPage";
import GifLoader from "@/components/utility/GifLoader";

export default function HomeGroupRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[520px] items-center justify-center bg-white">
          <GifLoader />
        </main>
      }
    >
      <HomeGroupPage />
    </Suspense>
  );
}
