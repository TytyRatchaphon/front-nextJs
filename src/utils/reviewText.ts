import { sanitizeUserGeneratedHtml } from "@/utils/sanitizeHtml";

const SPOILER_TAG_PATTERN = /\[\/?\s*SPOILER\s*\]/gi;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const BR_TAG_PATTERN = /<br\s*\/?>/gi;
const WHITESPACE_PATTERN = /\s+/g;

const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'",
};

const decodeBasicHtmlEntities = (input: string): string => {
  return input.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => HTML_ENTITY_MAP[entity] ?? entity);
};

export const toPlainReviewText = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "";

  let normalized = value
    .replace(SPOILER_TAG_PATTERN, " ")
    .replace(BR_TAG_PATTERN, " ")
    .replace(HTML_TAG_PATTERN, " ");

  normalized = decodeBasicHtmlEntities(normalized);
  normalized = normalized.replace(HTML_TAG_PATTERN, " ");

  return normalized
    .replace(/\r?\n/g, " ")
    .replace(WHITESPACE_PATTERN, " ")
    .trim();
};

export const getReviewPreviewText = (value: unknown, maxLength = 170): string => {
  const plain = toPlainReviewText(value);
  if (!plain) return "";
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}...`;
};

export const toSafeReviewPreviewHtml = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "";

  const sanitized = sanitizeUserGeneratedHtml(value.replace(SPOILER_TAG_PATTERN, " "));

  return sanitized
    .replace(/<img[^>]*>/gi, " ")
    .replace(/<\/?(ul|ol)[^>]*>/gi, " ")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, " ")
    .replace(/<\/?(p|div|blockquote)[^>]*>/gi, " ")
    .replace(BR_TAG_PATTERN, " ")
    .replace(WHITESPACE_PATTERN, " ")
    .trim();
};

