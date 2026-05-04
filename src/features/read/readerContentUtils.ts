import AES from "crypto-js/aes";
import encUtf8 from "crypto-js/enc-utf8";

import { getRegularEpisodePrices } from "./purchaseUtils";

export type EpisodeBookmark = {
  id: number;
  ep_id: number;
  paragraph_index: number;
  note?: string;
  created_at?: string;
};

export type ReaderConfigFont = {
  key: string;
  label: string;
  fontFamily: string;
  file?: string;
};

export type ReaderConfigPayload = {
  defaultFontKey?: string;
  cssUrl?: string;
  sharedCharacters?: number;
  fonts?: unknown[];
};

export type EpisodeFreeMeta = {
  isDiscountFree: boolean;
  freeUntilLabel: string | null;
  displayCoinPrice: number;
};

export type ReadEpisodeListItem = {
  rawEpisodeId: string;
  listKey: string;
  name: string;
  publishDatetime: string | null;
  isBuy: boolean;
  view: number;
  isDiscountFree: boolean;
  freeUntilLabel: string | null;
  displayCoinPrice: number;
};

export type ReadEpisodeListGroup = {
  groupName: string;
  groupKey: string;
  expandKey: number;
  defaultExpanded: boolean;
  episodes: ReadEpisodeListItem[];
};

export const BANGKOK_TIME_ZONE = "Asia/Bangkok";
export const READ_EPISODE_PUBLIC_SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY || "";
export const READER_OBFUSCATION_CSS_ID = "reader-obfuscation-css";
export const READER_OBFUSCATION_CSS_PRELOAD_ID = "reader-obfuscation-css-preload";
export const READER_TEMP_DISABLED_FONT_KEYS = ["baijamjuree", "trirong", "maitree"] as const;
export const READER_PREFERRED_DEFAULT_FONT_KEYS = ["chakrapetch", "sarabun", "thsarabunnew"] as const;
export const READER_SAFE_OBFUSCATION_FONT_KEYS = [
  "sarabun",
  "thsarabunnew",
  "mali",
  "trirong",
  "maitree",
] as const;
export const READER_FONT_FAMILY_BY_KEY: Record<string, string> = {
  sarabun: "contentENJOYSarabun",
  thsarabunnew: "contentENJOYTHSarabunNew",
  mali: "contentENJOYMali",
  trirong: "contentENJOYTrirong",
  maitree: "contentENJOYMaitree",
  taviraj: "contentENJOYTaviraj",
  kodchasan: "contentENJOYKodchasan",
  chakrapetch: "contentENJOYChakraPetch",
  baijamjuree: "contentENJOYBaiJamjuree",
};
export const READER_TOGGLE_IGNORE_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "[role='button']",
  "[data-reader-ignore-toggle='true']",
  ".ant-popover",
  ".ant-popover-content",
  ".ant-modal",
  ".ant-modal-wrap",
].join(",");

export const getEpisodeStableId = (episodeLike: any) =>
  String(episodeLike?.ep_id ?? episodeLike?.epID ?? "");

export const formatFreeUntilLabel = (endDate?: string | null) => {
  if (!endDate) return null;
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getEpisodeFreeMeta = (ep: any): EpisodeFreeMeta => {
  const prices = getRegularEpisodePrices(ep as any);
  const isDiscountFree = Boolean(prices.isDiscountFree) && !Boolean(ep?.isBuy);
  return {
    isDiscountFree,
    freeUntilLabel: isDiscountFree ? formatFreeUntilLabel(prices.discountEndDate) : null,
    displayCoinPrice: Number(prices.coinPrice ?? ep?.coin ?? 0),
  };
};

export const formatScheduledPublishDate = (value: Date) =>
  new Intl.DateTimeFormat("th-TH", {
    timeZone: BANGKOK_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);

export const formatScheduledPublishTime = (value: Date) =>
  new Intl.DateTimeFormat("th-TH", {
    timeZone: BANGKOK_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

export const formatScheduledPublishCountdown = (value: Date, nowMs: number) => {
  const diffMs = value.getTime() - nowMs;
  if (diffMs <= 0) return null;

  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} วัน`);
  if (hours > 0) parts.push(`${hours} ชั่วโมง`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} นาที`);

  return `อีก ${parts.slice(0, 2).join(" ")}`;
};

export const decryptEpisodePayloadOnClient = (payload: unknown): Record<string, unknown> | null => {
  if (payload && typeof payload === "object") {
    return payload as Record<string, unknown>;
  }

  if (typeof payload !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    if (!READ_EPISODE_PUBLIC_SECRET_KEY) return null;

    try {
      const bytes = AES.decrypt(payload, READ_EPISODE_PUBLIC_SECRET_KEY);
      const decrypted = bytes.toString(encUtf8);
      if (!decrypted) return null;

      const parsed = JSON.parse(decrypted);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
};

export const normalizeReaderConfigFont = (value: unknown): ReaderConfigFont | null => {
  if (!value || typeof value !== "object") return null;
  const data = value as {
    key?: unknown;
    label?: unknown;
    fontFamily?: unknown;
    family?: unknown;
    file?: unknown;
  };

  const key = typeof data.key === "string" ? data.key.trim().toLowerCase() : "";
  const label = typeof data.label === "string" ? data.label.trim() : "";
  if (!key || !label) return null;

  const candidateFamilies = [
    typeof data.fontFamily === "string" ? data.fontFamily.trim() : "",
    typeof data.family === "string" ? data.family.trim() : "",
    READER_FONT_FAMILY_BY_KEY[key] || "",
  ];
  const resolvedFamily = candidateFamilies.find((item) => item.length > 0) || "";
  if (!resolvedFamily) return null;

  const file = typeof data.file === "string" && data.file.trim().length > 0
    ? data.file.trim()
    : undefined;

  return {
    key,
    label,
    fontFamily: resolvedFamily,
    file,
  };
};
