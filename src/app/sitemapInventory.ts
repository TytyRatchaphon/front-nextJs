import { appendFileSync } from 'node:fs';

import { getErrorMessage } from '@/types/errors';

export const SITEMAP_URL_LIMIT = 50_000;

export const assertBelowSitemapUrlLimit = (urlCount: number): void => {
  if (urlCount >= SITEMAP_URL_LIMIT) {
    throw new Error(`[sitemap] URL count ${urlCount} must stay below ${SITEMAP_URL_LIMIT}`);
  }
};

const reportSitemapDiagnostic = (message: string): void => {
  console.error(message);
  if (process.env.SITEMAP_DIAGNOSTIC_FILE) {
    appendFileSync(process.env.SITEMAP_DIAGNOSTIC_FILE, `${message}\n`, 'utf8');
  }
};

export const createResilientInventoryLoader = <T extends unknown[]>(
  source: string,
  fetchInventory: () => Promise<T>,
  createEmptyInventory: () => T,
) => {
  let lastHealthyInventory: T | undefined;

  return async (): Promise<T> => {
    try {
      const inventory = await fetchInventory();
      lastHealthyInventory = inventory;
      return inventory;
    } catch (error) {
      const fallback = lastHealthyInventory ?? createEmptyInventory();
      reportSitemapDiagnostic(
        `[sitemap] ${source} inventory unavailable; serving ${fallback.length > 0 ? 'last healthy inventory' : 'static URLs only'}: ${getErrorMessage(error)}`,
      );
      return fallback;
    }
  };
};
