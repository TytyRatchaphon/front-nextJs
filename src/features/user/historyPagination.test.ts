import { describe, expect, it, vi } from 'vitest';
import { clampHistoryPage, getHistoryMaxPage, getHistoryTotal } from './historyPagination';

describe('historyPagination', () => {
  it('reads total from the current query response first', () => {
    expect(getHistoryTotal({ data: { data: { total: 42 } } }, 3)).toBe(42);
    expect(getHistoryTotal({ data: { data: { pagination: { total: 24 } } } }, 3)).toBe(24);
    expect(getHistoryTotal({ data: { total: 12 } }, 3)).toBe(12);
  });

  it('falls back to previousData before local list length', () => {
    expect(getHistoryTotal({ previousData: { data: { pagination: { total: 18 } } } }, 3)).toBe(18);
    expect(getHistoryTotal({}, 3)).toBe(3);
  });

  it('uses explicit totalPages when available', () => {
    expect(getHistoryMaxPage({ data: { data: { totalPages: 8 } } }, 20, 1)).toBe(8);
  });

  it('calculates max page from total and page size', () => {
    expect(getHistoryMaxPage({ data: { data: { total: 41 } } }, 20, 1)).toBe(3);
    expect(getHistoryMaxPage({}, 20, 0)).toBe(1);
  });

  it('clamps current page only after fetching is finished', () => {
    const setPage = vi.fn();

    clampHistoryPage({
      query: { data: { data: { total: 20 } }, isFetching: true },
      page: 5,
      pageSize: 20,
      fallbackLength: 0,
      setPage,
    });

    expect(setPage).not.toHaveBeenCalled();

    clampHistoryPage({
      query: { data: { data: { total: 20 } }, isFetching: false },
      page: 5,
      pageSize: 20,
      fallbackLength: 0,
      setPage,
    });

    expect(setPage).toHaveBeenCalledWith(1);
  });
});
