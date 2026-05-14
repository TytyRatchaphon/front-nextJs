const DEFAULT_BACKEND_URL = "https://apiweb.enjoybook.co";

const normalizeBackendUrl = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
};

export const resolveBackendUrl = (): string => {
  return normalizeBackendUrl(process.env.API_URL)
    || normalizeBackendUrl(process.env.API_BASE_URL)
    || normalizeBackendUrl(process.env.NEXT_PUBLIC_API_BASE_URL)
    || DEFAULT_BACKEND_URL;
};
