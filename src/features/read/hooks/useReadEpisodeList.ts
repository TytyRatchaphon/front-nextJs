import { useCallback, useEffect, useMemo, useState } from "react";
import { useEpisodeNavigation } from '@/features/read/hooks/useEpisodeNavigation';
import { isEpisodeSequentiallyUnlockable } from "@/utils/earlyAccessUtils";
import {
  getEpisodeFreeMeta,
  getEpisodeStableId,
  type ReadEpisodeListGroup,
  type ReadEpisodeListItem,
} from "../readerContentUtils";

type UseReadEpisodeListParams = {
  bookId: string;
  episodeId: string;
  episode: unknown;
};

export function useReadEpisodeList({
  bookId,
  episodeId,
  episode,
}: UseReadEpisodeListParams) {
  const { episodesData, displayTitle, prevEpId, nextEpId } = useEpisodeNavigation(bookId, episodeId, episode);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
  const currentEpisodeId = String(episodeId);
  const episodeGroupsRaw = episodesData?.groups;

  const episodeGroups = useMemo<ReadEpisodeListGroup[]>(() => {
    const groups = Array.isArray(episodeGroupsRaw) ? episodeGroupsRaw : [];
    return groups.map((group: any, groupIndex: number) => {
      const groupName = typeof group?.name === "string" ? group.name : `เล่ม ${groupIndex + 1}`;
      const groupRawKey = group?.group_id ?? group?.groupID ?? groupIndex;
      const normalizedExpandKey = Number(group?.group_id ?? groupIndex);
      const expandKey = Number.isFinite(normalizedExpandKey) ? normalizedExpandKey : groupIndex;
      const list = Array.isArray(group?.list) ? group.list : [];
      const episodes = list.map((ep: any, episodeIndex: number) => {
        const rawEpisodeId = getEpisodeStableId(ep);
        const listKey = rawEpisodeId || `${groupRawKey}-${episodeIndex}`;
        const { isDiscountFree, freeUntilLabel, displayCoinPrice } = getEpisodeFreeMeta(ep);

        return {
          rawEpisodeId,
          listKey,
          name: typeof ep?.name === "string" ? ep.name.trim() : "",
          publishDatetime: typeof ep?.publish_datetime === "string" ? ep.publish_datetime : null,
          isBuy: Boolean(ep?.isBuy),
          view: Number(ep?.view ?? 0),
          isDiscountFree,
          freeUntilLabel,
          displayCoinPrice,
        };
      });

      return {
        groupName,
        groupKey: String(groupRawKey),
        expandKey,
        defaultExpanded: groupIndex === 0,
        episodes,
      };
    });
  }, [episodeGroupsRaw]);

  const currentEpisodeMeta = useMemo<ReadEpisodeListItem | null>(() => {
    for (const group of episodeGroups) {
      const found = group.episodes.find((ep) => ep.rawEpisodeId === currentEpisodeId);
      if (found) return found;
    }
    return null;
  }, [episodeGroups, currentEpisodeId]);

  const isCurrentEpisodeSequentiallyUnlocked = useMemo(() => {
    const groups = Array.isArray(episodeGroupsRaw) ? episodeGroupsRaw : [];
    if (groups.length === 0) return true;

    const orderedEpisodes: any[] = [];
    for (const group of groups) {
      const list = Array.isArray(group?.list) ? group.list : [];
      orderedEpisodes.push(...list);
    }

    const currentIndex = orderedEpisodes.findIndex(
      (ep: any) => String(ep?.ep_id ?? ep?.epID) === String(episodeId),
    );
    if (currentIndex !== -1) {
      return isEpisodeSequentiallyUnlockable(
        orderedEpisodes[currentIndex],
        currentIndex,
        orderedEpisodes,
      );
    }

    return true;
  }, [episodeGroupsRaw, episodeId]);

  const isGroupExpanded = useCallback(
    (group: ReadEpisodeListGroup) =>
      expandedGroups[group.expandKey] ?? group.defaultExpanded,
    [expandedGroups],
  );

  const toggleGroupExpanded = useCallback((group: ReadEpisodeListGroup) => {
    setExpandedGroups((prev) => {
      const nextExpanded = !(prev[group.expandKey] ?? group.defaultExpanded);
      return { ...prev, [group.expandKey]: nextExpanded };
    });
  }, []);

  const collapseAllGroups = useCallback(() => {
    if (episodeGroups.length === 0) return;
    const map: Record<number, boolean> = {};
    episodeGroups.forEach((group) => {
      map[group.expandKey] = false;
    });
    setExpandedGroups(map);
  }, [episodeGroups]);

  useEffect(() => {
    if (!currentEpisodeId || episodeGroups.length === 0) return;
    const targetGroup = episodeGroups.find((group) =>
      group.episodes.some((ep) => ep.rawEpisodeId === currentEpisodeId),
    );
    if (!targetGroup) return;

    setExpandedGroups((prev) =>
      prev[targetGroup.expandKey] ? prev : { ...prev, [targetGroup.expandKey]: true },
    );
  }, [episodeGroups, currentEpisodeId]);

  return {
    episodesData,
    displayTitle,
    prevEpId,
    nextEpId,
    currentEpisodeId,
    episodeGroups,
    currentEpisodeMeta,
    isCurrentEpisodeSequentiallyUnlocked,
    isGroupExpanded,
    toggleGroupExpanded,
    collapseAllGroups,
  };
}
