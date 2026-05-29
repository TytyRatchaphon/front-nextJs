"use client";

import * as React from "react";

type UseNavbarLifecycleParams = {
  setMounted: () => Promise<void>;
  initLIFF: (options: { allowBackendLogin: boolean }) => Promise<unknown>;
};

export function useNavbarLifecycle({
  setMounted,
  initLIFF,
}: UseNavbarLifecycleParams) {
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);

  React.useEffect(() => {
    setMounted();
  }, [setMounted]);

  React.useEffect(() => {
    const syncViewport = () => setIsMobileViewport(window.innerWidth < 1024);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  React.useEffect(() => {
    initLIFF({ allowBackendLogin: false }).catch(() => {
    });
  }, [initLIFF]);

  return { isMobileViewport };
}
