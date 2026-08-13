import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';

import { fetchLatestArticlesPage } from '@/services/api/articleApi';
import { fetchBookCategoryAll } from '@/services/api/categoryApi';

import {
  assertBelowSitemapUrlLimit,
  createResilientInventoryLoader,
} from './sitemapInventory';

const configuredBaseUrl = new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://enjoybook.co');
if (configuredBaseUrl.protocol !== 'https:') {
  throw new Error('[sitemap] NEXT_PUBLIC_BASE_URL must use HTTPS');
}

const BASE_ORIGIN = configuredBaseUrl.origin;
const SITEMAP_CACHE_KEY = process.env.SITEMAP_CACHE_KEY || 'v1';
const ARTICLE_PAGE_SIZE = 100;

const STATIC_PATHS = [
  '',
  '/faq',
  '/about-us',
  '/article',
  '/campaign',
  '/ranking',
  '/how-payment',
  '/policy-conditions',
  '/policy-privacy',
  '/writer-nc-policy',
  '/contact',
  '/events',
  '/news',
  '/novel-pack',
  '/fiction-novel',
  '/translated-novel',
  '/book-updates',
  '/store',
  '/other-policy',
  '/howto/regis',
  '/howto/howincome',
  '/howto/howwithdraw',
  '/howto/novelevent',
  '/campaign-discount',
] as const;

export const revalidate = 3600;

const toSitemapUrl = (path: string): string => new URL(path || '/', BASE_ORIGIN).toString().replace(/\/$/, '');

const toValidDate = (value: string): Date | undefined => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const fetchAllArticleRoutes = async (): Promise<MetadataRoute.Sitemap> => {
  const routes: MetadataRoute.Sitemap = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await fetchLatestArticlesPage(page, ARTICLE_PAGE_SIZE);
    totalPages = Math.max(1, result.pagination.totalPages);

    routes.push(...result.list.map((article) => ({
      url: toSitemapUrl(`/article/${article.id}`),
      lastModified: toValidDate(article.update_at),
    })));

    assertBelowSitemapUrlLimit(routes.length);

    page += 1;
  } while (page <= totalPages);

  return routes;
};

const deduplicateRoutes = (routes: MetadataRoute.Sitemap): MetadataRoute.Sitemap => {
  const routesByUrl = new Map(routes.map((route) => [route.url, route]));
  return [...routesByUrl.values()];
};

const fetchHealthyArticleRoutes = async (): Promise<MetadataRoute.Sitemap> => {
  const routes = await fetchAllArticleRoutes();
  if (routes.length === 0) {
    throw new Error('Article inventory returned no URLs');
  }
  return routes;
};

const fetchHealthyCategories = async () => {
  const categories = await fetchBookCategoryAll();
  if (categories.length === 0) {
    throw new Error('Category inventory returned no URLs');
  }
  return categories;
};

const getCachedArticleRoutes = unstable_cache(
  fetchHealthyArticleRoutes,
  ['sitemap-article-routes', SITEMAP_CACHE_KEY],
  { revalidate: 3600 },
);

const getCachedCategories = unstable_cache(
  fetchHealthyCategories,
  ['sitemap-categories', SITEMAP_CACHE_KEY],
  { revalidate: 3600 },
);

const loadArticleRoutes = createResilientInventoryLoader('Article', getCachedArticleRoutes, () => []);
const loadCategories = createResilientInventoryLoader('Category', getCachedCategories, () => []);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: toSitemapUrl(path),
  }));

  const [articleRoutes, categories] = await Promise.all([
    loadArticleRoutes(),
    loadCategories(),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: toSitemapUrl(`/cat/${category.id}`),
  }));

  const routes = deduplicateRoutes([...staticRoutes, ...articleRoutes, ...categoryRoutes]);
  assertBelowSitemapUrlLimit(routes.length);

  return routes;
}
