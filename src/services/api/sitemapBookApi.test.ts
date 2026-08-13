import { beforeEach, describe, expect, it, vi } from 'vitest';

import apiClient from '../apiClient';
import {
  fetchAllPublishedBookInventory,
  fetchPublishedBookInventoryPage,
} from './sitemapBookApi';

vi.mock('../apiClient', () => ({
  default: { get: vi.fn() },
}));

const mockedApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe('published book sitemap inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only indexable published books from the strict paginated catalog', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: {
        code: 200,
        data: {
          books: [
            { book_id: 201, user_id: 31, status: 'publish', update_at: '2026-07-01T00:00:00.000Z' },
            { book_id: 202, user_id: 31, status: 'publish', update_at: 'invalid' },
            { book_id: 203, user_id: 32, status: 'private' },
            { book_id: 'bad', user_id: 33, status: 'publish' },
            { book_id: true, user_id: 34, status: 'publish' },
            { book_id: '205', user_id: 35, status: 'publish' },
            { book_id: 204, user_id: 32, status: 'publish', is_indexable: false },
          ],
          pagination: {
            page: 1,
            limit: 100,
            total: 5,
            totalPages: 2,
            nextPage: 2,
            prevPage: null,
          },
        },
      },
    });

    await expect(fetchPublishedBookInventoryPage(1, 100)).resolves.toEqual({
      books: [
        { bookId: 201, writerId: 31, lastModified: '2026-07-01T00:00:00.000Z' },
        { bookId: 202, writerId: 31 },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 5,
        totalPages: 2,
        nextPage: 2,
        prevPage: null,
      },
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith('/books/new', {
      params: { page: 1, limit: 100, content_type: 'all' },
    });
  });

  it('rejects homepage-shaped and malformed pagination responses', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { code: 200, data: { groupBookHome: [] } },
    });

    await expect(fetchPublishedBookInventoryPage(1, 100)).rejects.toThrow(
      'Invalid published-book inventory response',
    );
  });

  it('rejects application-level errors and pagination for a different request', async () => {
    mockedApiClient.get
      .mockResolvedValueOnce({
        data: {
          code: 500,
          data: {
            books: [{ book_id: 201, user_id: 31, status: 'publish' }],
            pagination: {
              page: 1, limit: 100, total: 1, totalPages: 1, nextPage: null, prevPage: null,
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          code: 200,
          data: {
            books: [],
            pagination: {
              page: 1, limit: 50, total: 0, totalPages: 0, nextPage: null, prevPage: null,
            },
          },
        },
      });

    await expect(fetchPublishedBookInventoryPage(1, 100)).rejects.toThrow(
      'Invalid published-book inventory response',
    );
    await expect(fetchPublishedBookInventoryPage(2, 100)).rejects.toThrow(
      'Published-book pagination does not match the requested page',
    );
  });

  it('collects every page and rejects pagination metadata that changes mid-crawl', async () => {
    const page = (currentPage: number, totalPages: number) => ({
      data: {
        code: 200,
        data: {
          books: [{ book_id: 200 + currentPage, user_id: 30 + currentPage, status: 'publish' }],
          pagination: {
            page: currentPage,
            limit: 100,
            total: 2,
            totalPages,
            nextPage: currentPage < totalPages ? currentPage + 1 : null,
            prevPage: currentPage > 1 ? currentPage - 1 : null,
          },
        },
      },
    });

    mockedApiClient.get.mockResolvedValueOnce(page(1, 2)).mockResolvedValueOnce(page(2, 2));
    await expect(fetchAllPublishedBookInventory(100)).resolves.toEqual([
      { bookId: 201, writerId: 31 },
      { bookId: 202, writerId: 32 },
    ]);

    mockedApiClient.get.mockResolvedValueOnce(page(1, 2)).mockResolvedValueOnce(page(2, 1));
    await expect(fetchAllPublishedBookInventory(100)).rejects.toThrow(
      'Published-book pagination changed during collection',
    );
  });
});
