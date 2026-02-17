/**
 * Book data mapping utilities
 * Normalizes inconsistent API responses into standardized formats
 */

import { UniversalBook, BookData, NormalizedBook } from '@/types/api';

/**
 * Normalized book data for continue reading cards
 * Extends UniversalBook with episode-specific fields
 */
export interface NormalizedContinueBook extends UniversalBook {
  ep_id?: string | number;
  epName?: string;
  last_read_at?: string;
}

/**
 * Normalizes book data from various API response formats
 * Handles inconsistent field names and missing data
 * 
 * @param book - Raw book data from API (can have various field names)
 * @returns Normalized book data in UniversalBook format
 */
export const normalizeBookData = (book: BookData): UniversalBook => {
  return {
    book_id: typeof book.book_id === 'number' ? book.book_id : 
             typeof book.bookID === 'number' ? book.bookID :
             typeof book.id === 'number' ? book.id : undefined,
    bookID: String(book.bookID ?? book.book_id ?? ''),
    img: book.img ?? book.imgtn ?? book.imgtn_url ?? '',
    name: book.name ?? book.title ?? '',
    title: book.title ?? book.name ?? '',
    author: book.writer_name ?? book.user_name ?? book.author ?? '',
    writer_name: book.writer_name ?? book.user_name ?? book.author ?? '',
    view: Number(book.view ?? 0),
    chapter: Number(book.chapter ?? 0),
    shelve_count: Number(book.shelve_count ?? 0),
    shelveCount: Number(book.shelve_count ?? 0),
    end: book.end ?? book.status ?? '',
    status: book.status ?? book.end ?? '',
  };
};

/**
 * Normalizes continue reading book data
 * Includes episode information and reading progress
 * 
 * @param book - Raw continue reading book data from API
 * @returns Normalized continue reading book data
 */
export const normalizeContinueBook = (book: BookData): NormalizedContinueBook => {
  const baseBook = normalizeBookData(book);
  
  return {
    ...baseBook,
    ep_id: (book.last_read_ep ?? book.ep_id) as string | number | undefined,
    epName: String(book.epName ?? ''),
    last_read_at: book.last_read_at as string | undefined,
    isBestSeller: book.isBestSeller as boolean | undefined,
    isNew: book.isNew as boolean | undefined,
    isNewEp: book.isNewEp as boolean | undefined,
    discount: book.discount as number | undefined,
    img_full: book.img_full as string | undefined,
  };
};

/**
 * Normalizes purchased book data
 * Includes purchase information
 * 
 * @param book - Raw purchased book data from API
 * @returns Normalized purchased book data
 */
export const normalizePurchasedBook = (book: BookData): UniversalBook => {
  const baseBook = normalizeBookData(book);
  
  return {
    ...baseBook,
    purchase_date: (book.purchase_date ?? book.created_at) as string | undefined,
    price_paid: Number(book.price_paid ?? 0),
  };
};

/**
 * Batch normalize an array of books
 * 
 * @param books - Array of raw book data from API
 * @returns Array of normalized books
 */
export const normalizeBooksArray = (books: BookData[]): UniversalBook[] => {
  return books.map(normalizeBookData);
};

/**
 * Batch normalize an array of continue reading books
 * 
 * @param books - Array of raw continue reading book data
 * @returns Array of normalized continue reading books
 */
export const normalizeContinueBooksArray = (books: BookData[]): NormalizedContinueBook[] => {
  return books.map(normalizeContinueBook);
};

/**
 * Batch normalize an array of purchased books
 * 
 * @param books - Array of raw purchased book data
 * @returns Array of normalized purchased books
 */
export const normalizePurchasedBooksArray = (books: BookData[]): UniversalBook[] => {
  return books.map(normalizePurchasedBook);
};
