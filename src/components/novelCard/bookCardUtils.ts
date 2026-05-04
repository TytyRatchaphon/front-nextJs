/**
 * Shared utility functions for book/novel card components.
 * Extracted from duplicated logic across CardBook, PackCardBook,
 * PackCardBookHorizontal, ContinueCardbook, MyBookCard, MyBookCardNew.
 */

/**
 * Format a number for compact display (e.g. 1500 → "1k", 1200000 → "1.2M").
 */
export const formatNumber = (num: number): string | number => {
  if (num >= 1000 && num <= 999999) {
    return `${(num / 1000).toFixed(0)}k`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  return num;
};

/**
 * Normalize and detect various "ended" / "completed" values from different APIs.
 * The backend sends this flag in many different shapes and field names.
 */
export const isEndedValue = (v: any): boolean => {
  if (v === true) return true;
  if (v === 1 || v === '1') return true;
  if (!v && v !== 0) return false;
  // numeric codes (some APIs use 2 for finished)
  if (typeof v === 'number' && v >= 2) return true;
  if (typeof v === 'string' && /^[0-9]+$/.test(v) && Number(v) >= 2) return true;
  const s = String(v).trim().toLowerCase();
  return (
    s === 'end' ||
    s === 'ended' ||
    s === 'finished' ||
    s === 'true' ||
    s === 'จบ' ||
    s === 'จบแล้ว' ||
    s === 'complete' ||
    s === 'completed'
  );
};

/**
 * Check all known end-status fields on a book object.
 * Returns true if any field indicates the book is completed.
 */
export const computeEnded = (book: Record<string, any>): boolean => {
  return (
    isEndedValue(book.end) ||
    isEndedValue(book.status) ||
    isEndedValue(book.finished) ||
    isEndedValue(book.is_end) ||
    isEndedValue(book.isFinished) ||
    isEndedValue(book.finish) ||
    isEndedValue(book.ended) ||
    isEndedValue(book.end_status) ||
    isEndedValue(book.publish_status) ||
    isEndedValue(book.status_id) ||
    isEndedValue(book.status_code) ||
    isEndedValue(book.complete) ||
    isEndedValue(book.is_complete) ||
    isEndedValue(book.finish_status)
  );
};

/**
 * Resolve the URL parameter for a book.
 * Prefers the short numeric `book_id`; falls back to the string `bookID`.
 */
export const resolveBookParam = (book: Record<string, any>): string => {
  if (book.book_id) return String(book.book_id);
  if (book.bookID && String(book.bookID).trim() !== '') return String(book.bookID);
  return '';
};
