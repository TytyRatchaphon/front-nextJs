import type { ReadEpisodeListGroup } from "../readerContentUtils";

type ReadEpisodeListContentProps = {
  episodeGroups: ReadEpisodeListGroup[];
  currentEpisodeId: string;
  isGroupExpanded: (group: ReadEpisodeListGroup) => boolean;
  toggleGroupExpanded: (group: ReadEpisodeListGroup) => void;
  collapseAllGroups: () => void;
  onNavigateToEpisode: (nextEpisodeId: string | number, options?: { closeList?: boolean; closeSidebar?: boolean }) => void;
};

export function ReadEpisodeListContent({
  episodeGroups,
  currentEpisodeId,
  isGroupExpanded,
  toggleGroupExpanded,
  collapseAllGroups,
  onNavigateToEpisode,
}: ReadEpisodeListContentProps) {
  if (episodeGroups.length === 0) return <div className="p-4">ไม่พบรายการตอน</div>;

  return (
    <div id="episode-list-container" className="max-h-64 w-72 overflow-auto">
      <div className="px-3 py-2 flex justify-end">
        <button type="button" onClick={collapseAllGroups} className="text-xs px-2 py-1 bg-gray-100 rounded">
          ย่อทั้งหมด
        </button>
      </div>
      {episodeGroups.map((group) => {
        const isExpanded = isGroupExpanded(group);
        return (
          <div key={group.groupKey} className="border-b last:border-b-0">
            <button onClick={() => toggleGroupExpanded(group)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500">
              <span className="truncate">{group.groupName}</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isExpanded && (
              <div>
                {group.episodes.map((ep) => {
                  const isCurrent = ep.rawEpisodeId === currentEpisodeId;
                  return (
                    <button
                      key={ep.listKey}
                      id={isCurrent ? "active-episode-item" : undefined}
                      onClick={() => {
                        onNavigateToEpisode(ep.rawEpisodeId, { closeList: true });
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${isCurrent ? "bg-red-50 text-red-600 font-medium" : "text-gray-700"}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm">{ep.name}</div>
                        {ep.isDiscountFree && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">ตอนฟรี</span>
                        )}
                      </div>
                      {ep.isDiscountFree && ep.freeUntilLabel && (
                        <div className="mt-0.5 truncate text-[10px] text-emerald-700">{`อ่านฟรีถึง ${ep.freeUntilLabel}`}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
