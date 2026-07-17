import type { GifPickerItem } from "./gifPickerModel";

const readErrorMessage = async (response: Response, fallback: string) => {
  const payload = await response.json().catch(() => null) as { message?: unknown } | null;
  return typeof payload?.message === "string" ? payload.message : fallback;
};

export async function downloadGif(item: GifPickerItem): Promise<File> {
  const response = await fetch(item.downloadUrl);
  if (!response.ok) throw new Error(await readErrorMessage(response, "ดาวน์โหลด GIF ไม่สำเร็จ"));
  const blob = await response.blob();
  return new File([blob], `tenor-${item.id}.gif`, { type: "image/gif" });
}
