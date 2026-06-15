import { MetadataRoute } from 'next';
import { fetchBookTrans, fetchLatestArticles, fetchBookCategoryAll, fetchThreads, fetchBookEpisodes } from '@/services/apiServices';
import { unstable_cache } from 'next/cache';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://enjoybook.co';

export const revalidate = 3600; // Cache sitemap for 1 hour to prevent N+1 query flooding

// Cache API calls to avoid hitting the backend repeatedly during generateSitemaps and sitemap execution
const getCachedBooks = unstable_cache(
    async () => fetchBookTrans(),
    ['sitemap-books'],
    { revalidate: 3600 }
);

const getCachedArticles = unstable_cache(
    async () => fetchLatestArticles(1, 100),
    ['sitemap-articles'],
    { revalidate: 3600 }
);

const getCachedCategories = unstable_cache(
    async () => fetchBookCategoryAll(),
    ['sitemap-categories'],
    { revalidate: 3600 }
);

const getCachedThreads = unstable_cache(
    async () => fetchThreads({ limit: 100 }),
    ['sitemap-threads'],
    { revalidate: 3600 }
);

const CHUNK_SIZE = 1000; // Generate a new sitemap for every 1000 books

export async function generateSitemaps() {
    const books = await getCachedBooks();
    const sitemapCount = Math.ceil((books?.length || 0) / CHUNK_SIZE) || 1;
    return Array.from({ length: sitemapCount }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const booksRaw = await getCachedBooks();
    const books = booksRaw || [];
    
    // Slice books for the current sitemap chunk
    const startIdx = id * CHUNK_SIZE;
    const endIdx = startIdx + CHUNK_SIZE;
    const chunkedBooks = books.slice(startIdx, endIdx);

    const staticRoutes: MetadataRoute.Sitemap = [];
    let articleRoutes: MetadataRoute.Sitemap = [];
    let categoryRoutes: MetadataRoute.Sitemap = [];
    let threadRoutes: MetadataRoute.Sitemap = [];

    // Only include static and other non-paginated routes in the FIRST sitemap (id = 0)
    if (id === 0) {
        const staticPaths = [
            '', '/faq', '/about-us', '/allnovel', '/article', '/campaign', 
            '/howto', '/ranking', '/search', '/how-payment', '/policy-conditions', 
            '/policy-privacy', '/writer-nc-policy', '/contact', '/events', '/news',
            '/novel-pack', '/fiction-novel', '/translated-novel', '/book-updates',
            '/store', '/other-policy', '/thread', '/rank'
        ];

        staticPaths.forEach((route) => {
            staticRoutes.push({
                url: `${BASE_URL}${route}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1,
            });
        });

        const articlesData = await getCachedArticles();
        if (articlesData?.list) {
            articleRoutes = articlesData.list.map((article) => ({
                url: `${BASE_URL}/article/${article.id}`,
                lastModified: new Date(article.update_at || new Date()),
                changeFrequency: 'weekly',
                priority: 0.7,
            }));
        }

        const categories = await getCachedCategories();
        if (categories) {
            categoryRoutes = categories.map((cat) => ({
                url: `${BASE_URL}/cat/${cat.id}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.7,
            }));
        }

        const threadsData = await getCachedThreads();
        if (threadsData?.data?.list) {
            threadRoutes = threadsData.data.list.map((thread) => ({
                url: `${BASE_URL}/thread/${thread.topic_id}`,
                lastModified: new Date(thread.date_at || new Date()),
                changeFrequency: 'daily',
                priority: 0.6,
            }));
        }
    }

    // 2. Dynamic Routes: Books (Chunked)
    const { resolveBookId } = await import('@/services/apiServices');

    const bookRoutes: MetadataRoute.Sitemap = await Promise.all(chunkedBooks.map(async (book) => {
        let finalBookId = book.book_id;
        if (typeof book.book_id === 'string' && isNaN(Number(book.book_id))) {
            const resolved = await resolveBookId(book.book_id);
            if (resolved?.data?.book_id) {
                finalBookId = resolved.data.book_id;
            }
        }
        return {
            url: `${BASE_URL}/book/${finalBookId}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        };
    }));

    // 6. Dynamic Routes: Read First Episode (Chunked)
    const readRoutesRaw = await Promise.all(chunkedBooks.map(async (book) => {
        let finalBookId = book.book_id;
        if (typeof book.book_id === 'string' && isNaN(Number(book.book_id))) {
            const resolved = await resolveBookId(book.book_id);
            if (resolved?.data?.book_id) {
                finalBookId = resolved.data.book_id;
            }
        }

        try {
            const episodes = await fetchBookEpisodes(finalBookId);
            const firstEp = episodes?.groups?.[0]?.list?.[0];
            if (firstEp && firstEp.ep_id) {
                return {
                    url: `${BASE_URL}/read/${finalBookId}/${firstEp.ep_id}`,
                    lastModified: new Date(firstEp.update_at || new Date()),
                    changeFrequency: 'weekly' as const,
                    priority: 0.8,
                };
            }
        } catch {
            return null;
        }
        return null;
    }));
    const readRoutes = readRoutesRaw.filter((route): route is NonNullable<typeof route> => route !== null);

    // 7. Dynamic Routes: Writers (Chunked based on books in this chunk)
    const writerIds = new Set<number>();
    chunkedBooks.forEach(book => {
        const writerId = book["writer.user_id"];
        if (writerId) writerIds.add(writerId);
    });

    const writerRoutes: MetadataRoute.Sitemap = Array.from(writerIds).map((writerId) => ({
        url: `${BASE_URL}/wprofile?id=${writerId}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
    }));

    return [...staticRoutes, ...bookRoutes, ...articleRoutes, ...categoryRoutes, ...threadRoutes, ...readRoutes, ...writerRoutes];
}
