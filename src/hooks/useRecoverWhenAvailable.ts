import { useEffect } from "react";

export const useRecoverWhenAvailable = (
  recover: () => void | Promise<unknown>,
  enabled = true,
) => {
  useEffect(() => {
    if (!enabled) return;
    const recoverWhenAvailable = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void recover();
      }
    };
    window.addEventListener("online", recoverWhenAvailable);
    document.addEventListener("visibilitychange", recoverWhenAvailable);
    return () => {
      window.removeEventListener("online", recoverWhenAvailable);
      document.removeEventListener("visibilitychange", recoverWhenAvailable);
    };
  }, [enabled, recover]);
};
