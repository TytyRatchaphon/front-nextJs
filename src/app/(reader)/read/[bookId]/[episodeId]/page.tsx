import ReadEpisodeClient from "@/features/read/ReadEpisodeClient";
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { queryKeys } from '@/constants/query';
import { fetchEpisodeContent } from '@/features/read/readerApi';
import { fetchBookDetail } from '@/services/apiServices';

type Params = {
  params: { bookId: string; episodeId: string } | Promise<{ bookId: string; episodeId: string }>;
};

export default async function Page({ params }: Params) {
  const resolvedParams = await params;
  const bookId = String(resolvedParams.bookId);
  const episodeId = String(resolvedParams.episodeId);

  const queryClient = new QueryClient();

  try {
    // Prefetch for SSR Hydration
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.read.episodeContent(episodeId),
        queryFn: () => fetchEpisodeContent(episodeId)
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.book.detail(bookId),
        queryFn: () => fetchBookDetail(bookId)
      })
    ]);
  } catch (error) {
    console.error("Failed to prefetch read page data:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReadEpisodeClient bookId={bookId} episodeId={episodeId} />
    </HydrationBoundary>
  );
}
