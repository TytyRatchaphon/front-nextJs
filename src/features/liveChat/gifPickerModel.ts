export interface GifPickerItem {
  id: string;
  title: string;
  previewUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
}

type TenorMedia = {
  url?: unknown;
  dims?: unknown;
};

type TenorResult = {
  id?: unknown;
  content_description?: unknown;
  media_formats?: { tinygif?: TenorMedia };
};

export function buildTenorApiUrl({ apiKey, query }: { apiKey: string; query: string }): URL {
  const normalizedQuery = query.trim();
  const endpoint = normalizedQuery ? "search" : "featured";
  const url = new URL(`https://tenor.googleapis.com/v2/${endpoint}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("client_key", "enjoybook_live_chat");
  url.searchParams.set("limit", "20");
  url.searchParams.set("media_filter", "tinygif");
  url.searchParams.set("contentfilter", "high");
  url.searchParams.set("locale", "th_TH");
  if (normalizedQuery) url.searchParams.set("q", normalizedQuery);
  return url;
}

export function isAllowedTenorMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "media.tenor.com";
  } catch {
    return false;
  }
}

export function normalizeTenorResults(payload: unknown): GifPickerItem[] {
  if (!payload || typeof payload !== "object" || !("results" in payload)) return [];
  const results = (payload as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];

  return results.flatMap((candidate): GifPickerItem[] => {
    const result = candidate as TenorResult;
    const id = typeof result.id === "string" ? result.id : "";
    const media = result.media_formats?.tinygif;
    const previewUrl = typeof media?.url === "string" ? media.url : "";
    if (!id || !previewUrl || !isAllowedTenorMediaUrl(previewUrl)) return [];

    const dims = Array.isArray(media?.dims) ? media.dims : [];
    const width = typeof dims[0] === "number" && dims[0] > 0 ? dims[0] : 1;
    const height = typeof dims[1] === "number" && dims[1] > 0 ? dims[1] : 1;
    const title = typeof result.content_description === "string"
      ? result.content_description
      : "GIF";

    return [{
      id,
      title,
      previewUrl,
      downloadUrl: `/api/gifs/media?url=${encodeURIComponent(previewUrl)}`,
      width,
      height,
    }];
  });
}
