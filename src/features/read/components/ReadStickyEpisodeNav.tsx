"use client";

type ReadStickyEpisodeNavProps = {
  showNav: boolean;
  currentBg: any;
  prevEpId: string | number | null | undefined;
  nextEpId: string | number | null | undefined;
  bookId: string;
  episodeId: string;
  navigateToEpisode: (episodeId: string | number) => void;
  log: (action: string, targetType: string, targetId: string, metadata?: Record<string, unknown>) => void;
};

export function ReadStickyEpisodeNav({
  showNav,
  currentBg,
  prevEpId,
  nextEpId,
  bookId,
  episodeId,
  navigateToEpisode,
  log,
}: ReadStickyEpisodeNavProps) {
  if (!showNav) return null;

  const borderColor = currentBg?.key === "dark" ? "#333333" : "rgba(0,0,0,0.05)";

  return (
    <div
      className={`w-full cursor-pointer border-t grid grid-cols-2 items-center sticky bottom-0 z-[999] transition-all duration-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ${currentBg?.paper || currentBg?.bg}`}
      data-reader-ignore-toggle="true"
      style={{ borderColor }}
    >
      <div
        className={`group w-full p-4 flex flex-row gap-2 items-center justify-center border-r hover:bg-black/5 transition-all ${!prevEpId ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
        style={{ borderColor }}
        onClick={(event) => {
          event.stopPropagation();
          if (prevEpId && bookId) {
            log("prev_episode", "book", bookId, { from_episode: episodeId, to_episode: prevEpId });
            navigateToEpisode(prevEpId);
          }
        }}
      >
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <div className="flex flex-col items-start leading-none gap-0.5">
          <span className="text-[10px] opacity-60 font-normal">ตอนก่อนหน้า</span>
          <span className="font-semibold text-sm">ก่อนหน้า</span>
        </div>
      </div>
      <div
        className={`group w-full p-4 flex flex-row gap-2 items-center justify-center hover:bg-black/5 transition-all ${!nextEpId ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
        onClick={(event) => {
          event.stopPropagation();
          if (nextEpId && bookId) {
            log("next_episode", "book", bookId, { from_episode: episodeId, to_episode: nextEpId });
            navigateToEpisode(nextEpId);
          }
        }}
      >
        <div className="flex flex-col items-end leading-none gap-0.5">
          <span className="text-[10px] opacity-60 font-normal">ตอนต่อไป</span>
          <span className="font-semibold text-sm">ถัดไป</span>
        </div>
        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
