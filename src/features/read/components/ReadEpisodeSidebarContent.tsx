import type { ReadEpisodeListGroup } from "../readerContentUtils";

type ReadEpisodeSidebarContentProps = {
  episodeGroups: ReadEpisodeListGroup[];
  currentEpisodeId: string;
  isGroupExpanded: (group: ReadEpisodeListGroup) => boolean;
  toggleGroupExpanded: (group: ReadEpisodeListGroup) => void;
  onNavigateToEpisode: (nextEpisodeId: string | number, options?: { closeList?: boolean; closeSidebar?: boolean }) => void;
};

export function ReadEpisodeSidebarContent({
  episodeGroups,
  currentEpisodeId,
  isGroupExpanded,
  toggleGroupExpanded,
  onNavigateToEpisode,
}: ReadEpisodeSidebarContentProps) {
  if (episodeGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">ไม่พบรายการตอน</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {episodeGroups.map((group) => {
        const isExpanded = isGroupExpanded(group);

        return (
          <div key={group.groupKey} className="bg-white">
            <button onClick={() => toggleGroupExpanded(group)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <h3 className="text-xs font-semibold text-gray-700 text-left uppercase tracking-wide">{group.groupName}</h3>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isExpanded && (
              <div className="divide-y divide-gray-50">
                {group.episodes.map((ep) => {
                  const isCurrentEpisode = ep.rawEpisodeId === currentEpisodeId;

                  return (
                    <button
                      key={ep.listKey}
                      onClick={() => {
                        onNavigateToEpisode(ep.rawEpisodeId, { closeSidebar: true });
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left ${isCurrentEpisode ? "bg-red-50/50 border-l-2 border-red-500" : ""}`}>
                      <div className="flex-1 min-w-0 pr-3">
                        <p className={`text-sm truncate ${isCurrentEpisode ? "text-red-600 font-medium" : "text-gray-700"}`}>{ep.name}</p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {ep.isBuy && <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                        {!ep.isBuy && ep.isDiscountFree ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[11px] font-semibold text-emerald-700">ตอนฟรี</span>
                            {ep.freeUntilLabel && (
                              <span className="text-[10px] text-emerald-700">{`ถึง ${ep.freeUntilLabel}`}</span>
                            )}
                          </div>
                        ) : (ep.displayCoinPrice > 0 && !ep.isBuy && (
                          <span className="text-xs text-gray-500">{ep.displayCoinPrice}</span>
                        ))}
                      </div>
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
