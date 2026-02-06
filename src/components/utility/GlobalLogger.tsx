"use client";

import { useEffect } from "react";
import { useLogger } from "@/hooks/useLogger";
import { usePathname, useSearchParams } from "next/navigation";

export default function GlobalLogger() {
  const { log } = useLogger();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Log page view whenever pathname or searchParams change
    // You might want to debounce this or filter out specific params if needed
    log('page_view');
  }, [pathname, searchParams, log]);

  return null; // This component renders nothing
}
