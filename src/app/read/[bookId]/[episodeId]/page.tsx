import ReadEpisodeClient from "@/features/read/ReadEpisodeClient";

type Params = {
  params: { bookId: string; episodeId: string };
};

export default async function Page({ params }: Params) {
  const { bookId, episodeId } = await params as { bookId: string; episodeId: string };
  return <ReadEpisodeClient bookId={String(bookId)} episodeId={String(episodeId)} />;
}