export interface GifPickerItem {
  id: string;
  title: string;
  previewUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
}

type GiphyRendition = {
  url?: string;
  width?: string | number;
  height?: string | number;
};

type GiphyGifLike = {
  id: string | number;
  title?: string;
  images?: {
    fixed_width_small?: GiphyRendition;
    downsized?: GiphyRendition;
    original?: GiphyRendition;
  };
};

export function isAllowedGiphyMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      /^media\d*\.giphy\.com$/i.test(url.hostname)
      || url.hostname === "i.giphy.com"
    );
  } catch {
    return false;
  }
}

export function toGifPickerItem(gif: GiphyGifLike): GifPickerItem | null {
  const previewRendition = gif.images?.fixed_width_small
    ?? gif.images?.downsized
    ?? gif.images?.original;
  const uploadRendition = gif.images?.downsized
    ?? gif.images?.original
    ?? previewRendition;
  const previewUrl = previewRendition?.url ?? "";
  const uploadUrl = uploadRendition?.url ?? "";
  if (
    !previewUrl
    || !uploadUrl
    || !isAllowedGiphyMediaUrl(previewUrl)
    || !isAllowedGiphyMediaUrl(uploadUrl)
  ) {
    return null;
  }

  const width = Number(uploadRendition?.width) || Number(previewRendition?.width) || 1;
  const height = Number(uploadRendition?.height) || Number(previewRendition?.height) || 1;
  return {
    id: String(gif.id),
    title: gif.title?.trim() || "GIF",
    previewUrl,
    downloadUrl: `/api/gifs/media?url=${encodeURIComponent(uploadUrl)}`,
    width,
    height,
  };
}
