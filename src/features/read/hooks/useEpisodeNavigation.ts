import { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query";
import { fetchBookEpisodes } from '@/services/apiServices';

export function useEpisodeNavigation(bookId: string, episodeId: string, episode: any) {
    // Fetch Raw Group Data
    const {
        data: episodesData,
        error: episodesError,
        isLoading: isListLoading
    } = useQuery({
        queryKey: queryKeys.book.episodes(bookId),
        queryFn: () => fetchBookEpisodes(bookId),
        enabled: !!bookId,
        staleTime: 5 * 60 * 1000,
    });

    // Derive Flat List
    const allEpisodes = useMemo(() => {
        if (!episodesData?.groups) return [];

        const all: any[] = [];
        const sortedGroups = [...episodesData.groups].sort(
            (a: any, b: any) => (a.group_id || 0) - (b.group_id || 0)
        );

        sortedGroups.forEach((group: any, groupIndex: number) => {
            if (group.list && Array.isArray(group.list)) {
                const episodesWithGroupInfo = group.list.map((ep: any) => ({
                    ...ep,
                    _groupId: group.group_id,
                    _groupIndex: groupIndex,
                    _groupName: group.name,
                }));
                all.push(...episodesWithGroupInfo);
            }
        });

        return all.sort((a: any, b: any) => {
            if (a._groupIndex !== b._groupIndex) {
                return a._groupIndex - b._groupIndex;
            }
            return (a.order_by || 0) - (b.order_by || 0);
        });
    }, [episodesData]);

    const isMatch = (ep: any, targetId: string) => {
        const target = String(targetId);
        return String(ep?.ep_id ?? "") === target || String(ep?.epID ?? "") === target;
    };

    // Compute Navigation Info
    const { displayTitle, prevEpId, nextEpId } = useMemo(() => {
        const result = {
            displayTitle: "",
            prevEpId: null as string | null,
            nextEpId: null as string | null
        };

        if (isListLoading) {
            result.displayTitle = "กำลังโหลด...";
            return result;
        }

        let flatList: any[] = [];
        if (allEpisodes) {
            if ((allEpisodes as any).groups && Array.isArray((allEpisodes as any).groups)) {
                (allEpisodes as any).groups.forEach((g: any) => {
                    if (g.list) flatList.push(...g.list);
                });
            } else if (Array.isArray(allEpisodes)) {
                flatList = allEpisodes;
            }
        }

        let currentIndex = flatList.findIndex((ep: any) => isMatch(ep, episodeId));

        if (currentIndex === -1 && episode) {
            const ep = episode as any;
            if (ep.ep_id) currentIndex = flatList.findIndex((x: any) => isMatch(x, String(ep.ep_id)));
            if (currentIndex === -1 && ep.epID) currentIndex = flatList.findIndex((x: any) => isMatch(x, String(ep.epID)));
        }

        if (currentIndex !== -1) {
            result.displayTitle = flatList[currentIndex].name?.trim();
            if (currentIndex > 0) {
                const prev = flatList[currentIndex - 1];
                result.prevEpId = String(prev.ep_id || prev.epID);
            }
            if (currentIndex < flatList.length - 1) {
                const next = flatList[currentIndex + 1];
                result.nextEpId = String(next.ep_id || next.epID);
            }
        } else {
            const ep = episode as any;
            if (ep) {
                const candidates = [ep.name, ep.title];
                for (const c of candidates) {
                    if (c && String(c).trim() !== "" && !String(c).startsWith("EP20")) {
                        result.displayTitle = String(c).trim();
                        break;
                    }
                }
                if (!result.displayTitle) {
                    result.displayTitle = String(ep.ep_id ?? ep.epID ?? "");
                }
            }
        }

        return result;
    }, [allEpisodes, episode, episodeId, isListLoading]);

    return { episodesData, allEpisodes, displayTitle, prevEpId, nextEpId, isListLoading, episodesError };
}
