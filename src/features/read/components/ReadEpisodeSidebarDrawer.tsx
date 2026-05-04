"use client";

import type { ReadEpisodeListGroup } from "../readerContentUtils";
import { ReadEpisodeSidebarContent } from "./ReadEpisodeSidebarContent";

type ReadEpisodeSidebarDrawerProps = {
  open: boolean;
  episodeGroups: ReadEpisodeListGroup[];
  currentEpisodeId: string;
  isGroupExpanded: (group: ReadEpisodeListGroup) => boolean;
  toggleGroupExpanded: (group: ReadEpisodeListGroup) => void;
  onNavigateToEpisode: (episodeId: string | number, options?: { closeList?: boolean; closeSidebar?: boolean }) => void;
  onClose: () => void;
};

export function ReadEpisodeSidebarDrawer({
  open,
  episodeGroups,
  currentEpisodeId,
  isGroupExpanded,
  toggleGroupExpanded,
  onNavigateToEpisode,
  onClose,
}: ReadEpisodeSidebarDrawerProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-80 bg-white shadow-xl z-[70] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ReadEpisodeSidebarContent
          episodeGroups={episodeGroups}
          currentEpisodeId={currentEpisodeId}
          isGroupExpanded={isGroupExpanded}
          toggleGroupExpanded={toggleGroupExpanded}
          onNavigateToEpisode={onNavigateToEpisode}
        />
      </div>
    </>
  );
}
