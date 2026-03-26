export const DEFAULT_APP_STORE_URL = "https://bit.ly/47zskk0";
export const DEFAULT_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.enjoybook.enjoyread&hl=en";

const APPLE_SCHEME_PATTERN = /^itms-appss?:\/\//i;
const APPLE_DOMAIN_PATTERN = /(^|\/\/)(apps|itunes)\.apple\.com/i;
const PLAY_STORE_DOMAIN_PATTERN = /(^|\/\/)play\.google\.com/i;
const HTTP_URL_PATTERN = /^https?:\/\//i;

const sanitizeInput = (value?: string | null): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeAppleScheme = (value: string): string => {
  if (!APPLE_SCHEME_PATTERN.test(value)) {
    return value;
  }

  return value.replace(APPLE_SCHEME_PATTERN, "https://");
};

const normalizeMarketScheme = (value: string): string => {
  if (!value.toLowerCase().startsWith("market://")) {
    return value;
  }

  const rest = value.slice("market://".length);
  return `https://play.google.com/store/${rest}`;
};

const isHttpUrl = (value: string): boolean => HTTP_URL_PATTERN.test(value);

const hasAppleDomain = (value: string): boolean => APPLE_DOMAIN_PATTERN.test(value);

const hasPlayStoreDomain = (value: string): boolean =>
  PLAY_STORE_DOMAIN_PATTERN.test(value);

export const normalizeAppStoreUrl = (
  url?: string | null,
  fallback = DEFAULT_APP_STORE_URL
): string => {
  const sanitizedUrl = sanitizeInput(url);
  if (!sanitizedUrl) {
    return fallback;
  }

  const normalizedUrl = normalizeAppleScheme(sanitizedUrl);

  if (hasPlayStoreDomain(normalizedUrl)) {
    return fallback;
  }

  if (hasAppleDomain(normalizedUrl) && isHttpUrl(normalizedUrl)) {
    return normalizedUrl;
  }

  if (isHttpUrl(normalizedUrl)) {
    return normalizedUrl;
  }

  return fallback;
};

export const normalizePlayStoreUrl = (
  url?: string | null,
  fallback = DEFAULT_PLAY_STORE_URL
): string => {
  const sanitizedUrl = sanitizeInput(url);
  if (!sanitizedUrl) {
    return fallback;
  }

  if (hasAppleDomain(sanitizedUrl)) {
    return fallback;
  }

  const normalizedUrl = normalizeMarketScheme(sanitizedUrl);

  if (hasPlayStoreDomain(normalizedUrl) && isHttpUrl(normalizedUrl)) {
    return normalizedUrl;
  }

  if (isHttpUrl(normalizedUrl) && !hasAppleDomain(normalizedUrl)) {
    return normalizedUrl;
  }

  return fallback;
};
