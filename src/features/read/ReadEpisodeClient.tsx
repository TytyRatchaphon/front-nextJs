import React from "react";
import ReadEpisodePage from "./page.client.internal";
import ReadPageFonts from "@/components/fonts/ReadPageFonts";

type Props = {
  bookId: string;
  episodeId: string;
};

export default function ReadEpisodeClient({ bookId, episodeId }: Props) {
  return (
    <>
      <ReadPageFonts />
      <ReadEpisodePage bookId={bookId} episodeId={episodeId} />
    </>
  );
}
