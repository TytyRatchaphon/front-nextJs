import { describe, expect, it, vi } from 'vitest';

import {
  assertBelowSitemapUrlLimit,
  createResilientInventoryLoader,
} from './sitemapInventory';

describe('sitemap inventory recovery', () => {
  it('serves the last healthy inventory and logs an actionable diagnostic', async () => {
    const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchInventory = vi
      .fn<() => Promise<string[]>>()
      .mockResolvedValueOnce(['/article/101'])
      .mockRejectedValueOnce(new Error('upstream 503'));
    const loadInventory = createResilientInventoryLoader(
      'Article',
      fetchInventory,
      () => [],
    );

    await expect(loadInventory()).resolves.toEqual(['/article/101']);
    await expect(loadInventory()).resolves.toEqual(['/article/101']);
    expect(diagnostic).toHaveBeenCalledWith(
      '[sitemap] Article inventory unavailable; serving last healthy inventory: upstream 503',
    );

    diagnostic.mockRestore();
  });

  it('falls back to an empty inventory on a cold failure so static URLs can render', async () => {
    const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const loadInventory = createResilientInventoryLoader(
      'Category',
      async (): Promise<string[]> => { throw new Error('timeout'); },
      () => [],
    );

    await expect(loadInventory()).resolves.toEqual([]);
    expect(diagnostic).toHaveBeenCalledWith(
      '[sitemap] Category inventory unavailable; serving static URLs only: timeout',
    );

    diagnostic.mockRestore();
  });

  it('rejects the 50,000 URL boundary', () => {
    expect(() => assertBelowSitemapUrlLimit(49_999)).not.toThrow();
    expect(() => assertBelowSitemapUrlLimit(50_000)).toThrow(
      '[sitemap] URL count 50000 must stay below 50000',
    );
  });
});
