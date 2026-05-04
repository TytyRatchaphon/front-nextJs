export const appendCacheVersion = (url: string, cacheVersion?: string) => {
  if (!cacheVersion) return url;
  const encodedVersion = encodeURIComponent(cacheVersion);
  const hashIndex = url.indexOf("#");

  if (hashIndex >= 0) {
    const baseUrl = url.slice(0, hashIndex);
    const hash = url.slice(hashIndex);
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}v=${encodedVersion}${hash}`;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodedVersion}`;
};

export const resolveReaderAssetUrl = (assetUrl: string, cacheVersion?: string) => {
  const trimmed = assetUrl.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const marker = "/reader-assets/";
      const markerIndex = parsed.pathname.indexOf(marker);
      if (markerIndex >= 0) {
        const relativeAssetPath = parsed.pathname.slice(markerIndex + marker.length);
        if (relativeAssetPath) {
          return appendCacheVersion(`/api/read/reader-assets/${relativeAssetPath}`, cacheVersion);
        }
      }
    } catch {
      // fall through
    }
    return appendCacheVersion(trimmed, cacheVersion);
  }

  if (trimmed.startsWith("//")) {
    return appendCacheVersion(`https:${trimmed}`, cacheVersion);
  }

  let normalizedPath = trimmed;
  if (!normalizedPath.startsWith("/")) normalizedPath = `/${normalizedPath}`;

  const marker = "/reader-assets/";
  const markerIndex = normalizedPath.indexOf(marker);
  const relativeAssetPath = markerIndex >= 0
    ? normalizedPath.slice(markerIndex + marker.length)
    : normalizedPath.replace(/^\/+/, "");

  if (!relativeAssetPath) return "";

  return appendCacheVersion(`/api/read/reader-assets/${relativeAssetPath}`, cacheVersion);
};

export const resolveReaderCssUrl = (cssUrl: string, cacheVersion?: string) =>
  resolveReaderAssetUrl(cssUrl, cacheVersion);
