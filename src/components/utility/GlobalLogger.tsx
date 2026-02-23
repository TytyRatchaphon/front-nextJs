"use client";

import { useEffect } from "react";
import { useLogger } from "@/hooks/useLogger";
import { usePathname, useSearchParams } from "next/navigation";

export default function GlobalLogger() {
  const { trackTimeSpent } = useLogger();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Skip logging page_view here for routes that handle their own time tracking
    if (pathname && (pathname.startsWith('/book/') || pathname.startsWith('/read/'))) {
      return;
    }

    // Track time spent for the global page view
    const stopTracking = trackTimeSpent('page', 'global', {}, 'page_view');
    return stopTracking;
  }, [pathname, searchParams, trackTimeSpent]);

  return null; // This component renders nothing
}
