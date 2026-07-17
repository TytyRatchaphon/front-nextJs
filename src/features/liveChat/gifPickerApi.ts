import type { GifPickerItem } from "./gifPickerModel";

const readErrorMessage = async (response: Response, fallback: string) => {
  const payload = await response.json().catch(() => null) as { message?: unknown } | null;
  return typeof payload?.message === "string" ? payload.message : fallback;
};

export async function searchGifs(query: string, signal?: AbortSignal): Promise<GifPickerItem[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  const response = await fetch(`/api/gifs?${params.toString()}`, { signal });
  if (!response.ok) throw new Error(await readErrorMessage(response, "ค้นหา GIF ไม่สำเร็จ"));
  const payload = await response.json() as { items?: GifPickerItem[] };
  return Array.isArray(payload.items) ? payload.items : [];
}

export async function downloadGif(item: GifPickerItem): Promise<File> {
  const response = await fetch(item.downloadUrl);
  if (!response.ok) throw new Error(await readErrorMessage(response, "ดาวน์โหลด GIF ไม่สำเร็จ"));
  const blob = await response.blob();
  return new File([blob], `tenor-${item.id}.gif`, { type: "image/gif" });
}
