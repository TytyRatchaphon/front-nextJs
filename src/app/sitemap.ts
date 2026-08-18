import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';

import { fetchLatestArticlesPage } from '@/services/api/articleApi';
import { fetchBookCategoryAll } from '@/services/api/categoryApi';
import { fetchAllPublishedBookInventory } from '@/services/api/sitemapBookApi';

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
const BOOK_PAGE_SIZE = 100;
const WRITER_PROFILE_IDS = [
  46404, 71792, 68444, 55, 17578, 61815, 46403, 8321, 28094,
  23208, 23031, 23207, 24208, 17966, 53, 16113, 23206,
] as const;

const STATIC_PATHS = [
  '',
  '/faq',
  '/about-us',
  '/article',
  '/campaign',
  '/ranking',
  '/how-payment',
  '/writer-nc-policy',
  '/events',
  '/news',
  '/novel-pack',
  '/fiction-novel',
  '/translated-novel',
  '/book-updates',
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

const fetchAllBookRoutes = async (): Promise<MetadataRoute.Sitemap> => {
  const books = await fetchAllPublishedBookInventory(BOOK_PAGE_SIZE);
  const bookRoutes: MetadataRoute.Sitemap = [];

  for (const book of books) {
    bookRoutes.push({
      url: toSitemapUrl(`/book/${book.bookId}`),
      lastModified: book.lastModified ? toValidDate(book.lastModified) : undefined,
    });
    assertBelowSitemapUrlLimit(bookRoutes.length);
  }

  return bookRoutes;
};

const deduplicateRoutes = (routes: MetadataRoute.Sitemap): MetadataRoute.Sitemap => {
  const routesByUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const route of routes) {
    const existingRoute = routesByUrl.get(route.url);
    routesByUrl.set(route.url, existingRoute?.lastModified && !route.lastModified
      ? existingRoute
      : route);
  }
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

const fetchHealthyBookRoutes = async (): Promise<MetadataRoute.Sitemap> => {
  const routes = await fetchAllBookRoutes();
  if (routes.length === 0) {
    throw new Error('Published-book inventory returned no URLs');
  }
  return routes;
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

const getCachedBookRoutes = unstable_cache(
  fetchHealthyBookRoutes,
  ['sitemap-book-routes', SITEMAP_CACHE_KEY],
  { revalidate: 3600 },
);

const loadArticleRoutes = createResilientInventoryLoader('Article', getCachedArticleRoutes, () => []);
const loadCategories = createResilientInventoryLoader('Category', getCachedCategories, () => []);
const loadBookRoutes = createResilientInventoryLoader(
  'Published-book',
  getCachedBookRoutes,
  () => [],
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: toSitemapUrl(path),
  }));
  const writerProfileRoutes: MetadataRoute.Sitemap = WRITER_PROFILE_IDS.map((writerId) => ({
    url: toSitemapUrl(`/wprofile/${writerId}`),
  }));

  const [articleRoutes, categories, bookRoutes] = await Promise.all([
    loadArticleRoutes(),
    loadCategories(),
    loadBookRoutes(),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: toSitemapUrl(`/cat/${category.id}`),
  }));

  const routes = deduplicateRoutes([
    ...staticRoutes,
    ...writerProfileRoutes,
    ...articleRoutes,
    ...categoryRoutes,
    ...bookRoutes,
  ]);
  assertBelowSitemapUrlLimit(routes.length);

  return routes;
}
