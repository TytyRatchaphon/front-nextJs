const SAFE_HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const UNSAFE_SCHEME_PATTERN = /^(javascript|data|vbscript|file):/i;
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;
const TOKEN_PATTERN = /^[A-Za-z0-9._-]+$/;
const APP_EQUIVALENT_HOSTS = new Set(["enjoybook.co", "www.enjoybook.co", "localhost", "127.0.0.1"]);

const FALLBACK_ORIGIN = "https://enjoybook.co";
const COINENJOY_BASE_URL = "https://coinenjoy.enjoybook.co/";

const getBaseOrigin = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return FALLBACK_ORIGIN;
};

export const resolveSafeNavigationUrl = (
  input: string,
  options?: { allowExternal?: boolean }
): string | null => {
  if (typeof input !== "string") return null;

  const raw = input.trim();
  if (!raw || CONTROL_CHAR_PATTERN.test(raw) || UNSAFE_SCHEME_PATTERN.test(raw)) {
    return null;
  }

  if (raw.startsWith("/") || raw.startsWith("#") || raw.startsWith("?")) {
    return raw;
  }

  try {
    const baseOrigin = getBaseOrigin();
    const parsed = new URL(raw, baseOrigin);
    if (!SAFE_HTTP_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return null;
    }

    if (!options?.allowExternal) {
      const currentOrigin = getBaseOrigin();
      if (parsed.origin === currentOrigin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }

      // Allow cross-origin absolute links that still point to the same app
      // (e.g. API returns https://enjoybook.co/... while local runs on localhost).
      if (APP_EQUIVALENT_HOSTS.has(parsed.hostname.toLowerCase())) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }

      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

export const navigateSafely = (
  input: string,
  options?: { allowExternal?: boolean; replace?: boolean }
): boolean => {
  if (typeof window === "undefined") return false;
  const safeUrl = resolveSafeNavigationUrl(input, { allowExternal: options?.allowExternal });
  if (!safeUrl) return false;

  if (options?.replace) {
    window.location.replace(safeUrl);
  } else {
    window.location.assign(safeUrl);
  }

  return true;
};

export const openSafeExternalInNewTab = (input: string): boolean => {
  if (typeof window === "undefined") return false;
  const safeUrl = resolveSafeNavigationUrl(input, { allowExternal: true });
  if (!safeUrl) return false;

  window.open(safeUrl, "_blank", "noopener,noreferrer");
  return true;
};

export const buildCoinEnjoyTopupUrl = (token?: string | null): string => {
  const topupUrl = new URL(COINENJOY_BASE_URL);
  const cleanToken = (token || "")
    .replace(/^Bearer\s+/i, "")
    .replace(/^['"]+|['"]+$/g, "")
    .trim();
  if (cleanToken && TOKEN_PATTERN.test(cleanToken)) {
    topupUrl.searchParams.set("tk", cleanToken);
  }
  return topupUrl.toString();
};
