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
  const rendition = gif.images?.fixed_width_small ?? gif.images?.downsized;
  const previewUrl = rendition?.url ?? "";
  if (!previewUrl || !isAllowedGiphyMediaUrl(previewUrl)) return null;

  const width = Number(rendition?.width) || 1;
  const height = Number(rendition?.height) || 1;
  return {
    id: String(gif.id),
    title: gif.title?.trim() || "GIF",
    previewUrl,
    downloadUrl: `/api/gifs/media?url=${encodeURIComponent(previewUrl)}`,
    width,
    height,
  };
}
