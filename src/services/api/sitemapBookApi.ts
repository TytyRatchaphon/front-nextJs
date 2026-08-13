import { z } from 'zod';

import apiClient from '../apiClient';

const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  nextPage: z.number().int().positive().nullable(),
  prevPage: z.number().int().positive().nullable(),
});

const publishedBookSchema = z.object({
  book_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  status: z.string(),
  update_at: z.string().optional(),
  is_indexable: z.boolean().optional(),
  noindex: z.boolean().optional(),
}).passthrough();

const responseSchema = z.object({
  code: z.literal(200),
  data: z.object({
    books: z.array(z.unknown()),
    pagination: paginationSchema,
  }),
}).passthrough();

export interface PublishedBookInventoryItem {
  bookId: number;
  writerId: number;
  lastModified?: string;
}

export interface PublishedBookInventoryPage {
  books: PublishedBookInventoryItem[];
  pagination: z.infer<typeof paginationSchema>;
}

const toPublishedBookInventoryItem = (value: unknown): PublishedBookInventoryItem | null => {
  const result = publishedBookSchema.safeParse(value);
  if (!result.success) return null;

  const book = result.data;
  if (book.status !== 'publish' || book.is_indexable === false || book.noindex === true) {
    return null;
  }

  const lastModified = book.update_at && !Number.isNaN(new Date(book.update_at).getTime())
    ? book.update_at
    : undefined;

  return {
    bookId: book.book_id,
    writerId: book.user_id,
    ...(lastModified ? { lastModified } : {}),
  };
};

export const fetchPublishedBookInventoryPage = async (
  page: number,
  limit: number,
): Promise<PublishedBookInventoryPage> => {
  const response = await apiClient.get('/books/new', {
    params: { page, limit, content_type: 'all' },
  });
  const result = responseSchema.safeParse(response.data);
  if (!result.success) {
    throw new Error('Invalid published-book inventory response');
  }

  if (result.data.data.pagination.page !== page || result.data.data.pagination.limit !== limit) {
    throw new Error('Published-book pagination does not match the requested page');
  }

  return {
    books: result.data.data.books
      .map(toPublishedBookInventoryItem)
      .filter((book): book is PublishedBookInventoryItem => book !== null),
    pagination: result.data.data.pagination,
  };
};

export const fetchAllPublishedBookInventory = async (
  limit: number = 100,
): Promise<PublishedBookInventoryItem[]> => {
  const books: PublishedBookInventoryItem[] = [];
  let page = 1;
  let expectedTotal = 0;
  let expectedTotalPages = 1;

  do {
    const result = await fetchPublishedBookInventoryPage(page, limit);
    if (page === 1) {
      expectedTotal = result.pagination.total;
      expectedTotalPages = Math.max(1, result.pagination.totalPages);
    } else if (
      result.pagination.total !== expectedTotal
      || Math.max(1, result.pagination.totalPages) !== expectedTotalPages
    ) {
      throw new Error('Published-book pagination changed during collection');
    }

    books.push(...result.books);
    page += 1;
  } while (page <= expectedTotalPages);

  return books;
};
