import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query";
import { formatScheduledPublishCountdown } from "../readerContentUtils";

type UseReadScheduledReleaseParams = {
  bookId: string;
  episodeId: string;
  episodePublishDatetime?: string | null;
  currentEpisodePublishDatetime?: string | null;
};

export function useReadScheduledRelease({
  bookId,
  episodeId,
  episodePublishDatetime,
  currentEpisodePublishDatetime,
}: UseReadScheduledReleaseParams) {
  const queryClient = useQueryClient();
  const [scheduleNowMs, setScheduleNowMs] = useState(() => Date.now());

  const scheduledPublishAt = useMemo(() => {
    const rawValue = episodePublishDatetime ?? currentEpisodePublishDatetime;
    if (!rawValue) return null;

    const parsedDate = new Date(rawValue);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }, [episodePublishDatetime, currentEpisodePublishDatetime]);

  const isScheduledReleasePending = Boolean(
    scheduledPublishAt && scheduledPublishAt.getTime() > scheduleNowMs,
  );

  const scheduledReleaseCountdown = useMemo(
    () => (scheduledPublishAt ? formatScheduledPublishCountdown(scheduledPublishAt, scheduleNowMs) : null),
    [scheduledPublishAt, scheduleNowMs],
  );

  useEffect(() => {
    if (!scheduledPublishAt || scheduledPublishAt.getTime() <= Date.now()) return;

    setScheduleNowMs(Date.now());
    const intervalId = window.setInterval(() => {
      setScheduleNowMs(Date.now());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [scheduledPublishAt]);

  useEffect(() => {
    if (!scheduledPublishAt) return;

    const remainingMs = scheduledPublishAt.getTime() - Date.now();
    if (remainingMs <= 0) return;

    const timeoutId = window.setTimeout(() => {
      setScheduleNowMs(Date.now());
      queryClient.invalidateQueries({ queryKey: queryKeys.read.episodeContent(episodeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.book.episodes(bookId) });
    }, Math.min(remainingMs + 1000, 2147483647));

    return () => window.clearTimeout(timeoutId);
  }, [scheduledPublishAt, queryClient, episodeId, bookId]);

  return {
    scheduledPublishAt,
    isScheduledReleasePending,
    scheduledReleaseCountdown,
  };
}
