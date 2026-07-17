export function isPlaybackUrlUsable(expiresAt?: number | null): boolean {
  if (!expiresAt) return true;
  return expiresAt > Math.floor(Date.now() / 1000) + 30;
}

export function isHlsNativelySupported(): boolean {
  if (typeof document === "undefined") return false;
  return document.createElement("video").canPlayType("application/vnd.apple.mpegurl") !== "";
}
