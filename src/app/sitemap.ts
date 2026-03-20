import { MetadataRoute } from 'next';
import { fetchBookTrans, fetchLatestArticles, fetchBookCategoryAll, fetchThreads, fetchBookEpisodes } from '@/services/apiServices';

const BASE_URL = 'https://enjoybook.co';

export const revalidate = 3600; // Cache sitemap for 1 hour to prevent N+1 query flooding

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = [
        '',
        '/faq',
        '/about-us',
        '/allnovel',
        '/article',
        '/campaign',
        '/howto',
        '/ranking',
        '/search',
        '/how-payment',
        '/policy-conditions',
        '/policy-privacy',
        '/writer-nc-policy',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    // 2. Dynamic Routes: Books
    const books = await fetchBookTrans();
    const { resolveBookId } = await import('@/services/apiServices');

    const bookRoutes = await Promise.all(books.map(async (book) => {
        let finalBookId = book.book_id;

        // Check if book_id is legacy (non-numeric string)
        if (typeof book.book_id === 'string' && isNaN(Number(book.book_id))) {
            const resolved = await resolveBookId(book.book_id);
            if (resolved?.data?.book_id) {
                finalBookId = resolved.data.book_id;
            }
        }

        return {
            url: `${BASE_URL}/book/${finalBookId}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        };
    }));

    // 3. Dynamic Routes: Articles
    const articlesData = await fetchLatestArticles(1, 100);
    const articleRoutes = articlesData.list.map((article) => ({
        url: `${BASE_URL}/article/${article.id}`,
        lastModified: new Date(article.update_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // 4. Dynamic Routes: Categories
    const categories = await fetchBookCategoryAll();
    const categoryRoutes = categories.map((cat) => ({
        url: `${BASE_URL}/cat/${cat.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // 5. Dynamic Routes: Threads (Recent 100)
    const threadsData = await fetchThreads({ limit: 100 });
    const threadRoutes = (threadsData?.data?.list || []).map((thread) => ({
        url: `${BASE_URL}/thread/${thread.topic_id}`,
        lastModified: new Date(thread.date_at || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.6,
    }));

    // 6. Dynamic Routes: Read First Episode (One per book)
    const readRoutesRaw = await Promise.all(books.map(async (book) => {
        let finalBookId = book.book_id;

        // Resolve ID if legacy
        if (typeof book.book_id === 'string' && isNaN(Number(book.book_id))) {
            const resolved = await resolveBookId(book.book_id);
            if (resolved?.data?.book_id) {
                finalBookId = resolved.data.book_id;
            }
        }

        try {
            const episodes = await fetchBookEpisodes(finalBookId);
            // Get first episode of the first group
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
            // Ignore errors for specific books to avoid breaking the whole sitemap
            return null;
        }
        return null;
    }));

    const readRoutes = readRoutesRaw.filter((route): route is any => route !== null);

    return [...staticRoutes, ...bookRoutes, ...articleRoutes, ...categoryRoutes, ...threadRoutes, ...readRoutes];
}
