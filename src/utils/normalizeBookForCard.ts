import type { UniversalBook } from "@/types/api";
import { normalizeBookPurchaseReward } from "@/utils/bookPurchaseReward";

const toFiniteNumber = (value: unknown, fallback: number = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeBookTags = (tag: UniversalBook["tag"]): UniversalBook["tag"] => {
  if (!Array.isArray(tag)) return tag;
  return tag
    .map((item) => String(item).replace(/^"+|"+$/g, "").trim())
    .filter(Boolean);
};

export const normalizeBookForCard = (book: UniversalBook): UniversalBook => {
  const resolvedBookId =
    book.book_id
    ?? (book.bookID !== undefined && book.bookID !== null && String(book.bookID).trim() !== ""
      ? Number(book.bookID)
      : undefined);

  return {
    ...book,
    book_id: typeof resolvedBookId === "number" && Number.isFinite(resolvedBookId)
      ? resolvedBookId
      : book.book_id,
    bookID: book.bookID ?? (resolvedBookId !== undefined ? String(resolvedBookId) : undefined),
    img: book.img || book.img_full || "/images/ejb.png",
    img_gif: book.img_gif || undefined,
    img_full: book.img_full || undefined,
    name: book.name || book.title || "Untitled",
    title: book.title || book.name || "",
    tag: normalizeBookTags(book.tag),
    view: toFiniteNumber(book.view),
    chapter: toFiniteNumber(book.chapter),
    shelve_count: toFiniteNumber(book.shelve_count),
    writer_name: book.writer_name || book.author || "Unknown author",
    isBestSeller: Boolean(book.isBestSeller),
    isNew: book.isNew ?? true,
    isNewEp: Boolean(book.isNewEp),
    discount: book.discount || undefined,
    discount_ep_count: book.discount_ep_count ?? null,
    ep_purchase_reward: normalizeBookPurchaseReward(book),
  };
};

