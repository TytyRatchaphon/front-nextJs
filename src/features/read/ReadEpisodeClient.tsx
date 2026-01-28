"use client";

import React from "react";
import ReadEpisodePage from "./page.client.internal";

type Props = {
  bookId: string;
  episodeId: string;
};

export default function ReadEpisodeClient({ bookId, episodeId }: Props) {
  return <ReadEpisodePage bookId={bookId} episodeId={episodeId} />;
}
