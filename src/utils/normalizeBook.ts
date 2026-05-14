import type { NormalizedBook, BookData, BookTrans, BookDetail, UniversalBook } from "@/types/book";

// ---------------------------------------------------------------------------
// Type alias for any API book shape that the normalizer can accept.
// ---------------------------------------------------------------------------
type AnyBookInput =
  | BookData
  | BookTrans
  | BookDetail
  | UniversalBook
  | Record<string, unknown>;

// ---------------------------------------------------------------------------
// Field resolution helpers — handle the field name variations across endpoints.
// ---------------------------------------------------------------------------

const resolveBookId = (raw: AnyBookInput): number | string =>
  (raw as any).book_id ?? (raw as any).bookID ?? (raw as any).id ?? 0;

const resolveBookImg = (raw: AnyBookInput): string =>
  (raw as any).img ?? (raw as any).cover ?? (raw as any).imgtn ?? "";

const resolveBookName = (raw: AnyBookInput): string =>
  (raw as any).name ?? "";

const resolveBookTitle = (raw: AnyBookInput): string =>
  (raw as any).title ?? (raw as any).des ?? "";

const resolveAuthor = (raw: AnyBookInput): string =>
  (raw as any).writer_name ??
  (raw as any).author ??
  (raw as any).user_name ??
  (raw as any)["writer.writer_name"] ??
  (raw as any).writer?.writer_name ??
  (raw as any).writer?.fullname ??
  "";

const resolveView = (raw: AnyBookInput): number =>
  Number((raw as any).view ?? (raw as any).views ?? 0);

const resolveChapter = (raw: AnyBookInput): number =>
  Number((raw as any).chapter ?? (raw as any).chapters ?? 0);

const resolveShelveCount = (raw: AnyBookInput): number =>
  Number(
    (raw as any).shelve_count ??
    (raw as any).shelveCount ??
    (raw as any).shelf_count ??
    (raw as any).shelfCount ??
    (raw as any).hearts ??
    0,
  );

const resolveTag = (raw: AnyBookInput): string => {
  const t = (raw as any).tag;
  if (Array.isArray(t)) return t.join(",");
  if (typeof t === "string") return t;
  return "";
};

const resolveStar = (raw: AnyBookInput): number | undefined => {
  const v = (raw as any).star;
  return v != null ? Number(v) : undefined;
};

const resolveDiscount = (raw: AnyBookInput): number | undefined => {
  const v = (raw as any).discount;
  return v != null ? Number(v) : undefined;
};

const resolveWriter = (raw: AnyBookInput): NormalizedBook["writer"] => {
  const w = (raw as any).writer;
  if (w && typeof w === "object" && "user_id" in w) {
    return {
      user_id: Number(w.user_id),
      writer_name: w.writer_name || w.fullname || "",
      img: w.img || w.user_img || "",
      isFollowing: Boolean(w.isFollowing),
    };
  }
  return null;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Normalize any API book object into the canonical `NormalizedBook` shape.
 *
 * This function handles the field-name inconsistencies across endpoints
 * (`shelve_count` vs `shelveCount` vs `shelf_count`, `view` vs `views`, etc.)
 * so that downstream components only need to deal with ONE predictable type.
 *
 * Usage:
 * ```ts
 * const book = normalizeBook(rawApiResponse);
 * console.log(book.view);          // always a number
 * console.log(book.shelve_count);  // always a number
 * ```
 */
export function normalizeBook(raw: AnyBookInput): NormalizedBook {
  const bookId = resolveBookId(raw);

  return {
    book_id: bookId,
    bookID: String((raw as any).bookID ?? bookId),
    img: resolveBookImg(raw),
    name: resolveBookName(raw),
    title: resolveBookTitle(raw),
    author: resolveAuthor(raw),
    view: resolveView(raw),
    chapter: resolveChapter(raw),
    tag: resolveTag(raw),
    category: (raw as any).category ?? (raw as any)["category1.name"],
    category2: (raw as any).category2 ?? (raw as any)["category2.name"],
    description: (raw as any).description ?? (raw as any).des ?? (raw as any).title,
    status: (raw as any).status,
    end: (raw as any).end,
    use_coin: (raw as any).use_coin != null ? Number((raw as any).use_coin) : undefined,
    use_freecoin: (raw as any).use_freecoin != null ? Number((raw as any).use_freecoin) : undefined,
    writer: resolveWriter(raw),
    shelve_count: resolveShelveCount(raw),
    star: resolveStar(raw),
    discount: resolveDiscount(raw),
  };
}

/**
 * Normalize an array of API book objects.
 */
export function normalizeBooks(rawList: AnyBookInput[]): NormalizedBook[] {
  return rawList.map(normalizeBook);
}
