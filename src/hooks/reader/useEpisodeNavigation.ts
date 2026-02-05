import { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import apiClient from '@/services/apiClient';

export function useEpisodeNavigation(bookId: string, episodeId: string, episode: any) {
    // Fetch Raw Group Data
    const {
        data: episodesData,
        error: episodesError,
        isLoading: isListLoading
    } = useQuery({
        queryKey: ["bookEpisodesRaw", bookId],
        queryFn: async () => {
            try {
                const res = await apiClient.get(`/bookgroup/${bookId}`);
                return res.data?.code === 200 ? res.data.data : null;
            } catch (err) {
                return null; // Return null on error
            }
        },
        enabled: !!bookId,
        staleTime: 10 * 60 * 1000,
    });

    // Normalize Groups - Separate Normal vs Pack
    const normalGroups = useMemo(() => {
        return episodesData?.novel || episodesData?.normal || episodesData?.groups || [];
    }, [episodesData]);

    const packGroups = useMemo(() => {
        return episodesData?.novel_packpack || episodesData?.novel_pack || episodesData?.pack || [];
    }, [episodesData]);

    // Determine Context & Derive Flat List
    const { allEpisodes, groups } = useMemo(() => {
        const flatten = (gs: any[]) => {
            if (!gs || !Array.isArray(gs)) return [];
            const all: any[] = [];
            const sorted = [...gs].sort((a: any, b: any) => (a.group_id || 0) - (b.group_id || 0));
            sorted.forEach((g: any, gIdx: number) => {
                if (g.list && Array.isArray(g.list)) {
                    all.push(...g.list.map((ep: any) => ({
                        ...ep,
                        _groupId: g.group_id,
                        _groupIndex: gIdx,
                        _groupName: g.name
                    })));
                }
            });
            return all.sort((a: any, b: any) => {
                if (a._groupIndex !== b._groupIndex) return a._groupIndex - b._groupIndex;
                return (a.order_by || 0) - (b.order_by || 0);
            });
        };

        const flatNormal = flatten(normalGroups);
        const flatPack = flatten(packGroups);

        // Check where the current episode is
        const isMatch = (ep: any) => String(ep?.ep_id ?? ep?.epID ?? "") === String(episodeId);
        const inPack = flatPack.some(isMatch);
        const inNormal = flatNormal.some(isMatch);

        // If found in Pack, prioritize Pack context. Otherwise default to Normal.
        if (inPack) {
            return { allEpisodes: flatPack, groups: packGroups };
        } else {
            return { allEpisodes: flatNormal, groups: normalGroups };
        }
    }, [normalGroups, packGroups, episodeId]);

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

        let currentIndex = allEpisodes.findIndex((ep: any) => isMatch(ep, episodeId));

        if (currentIndex === -1 && episode) {
             const ep = episode as any;
             if (ep.ep_id) currentIndex = allEpisodes.findIndex((x: any) => isMatch(x, String(ep.ep_id)));
             if (currentIndex === -1 && ep.epID) currentIndex = allEpisodes.findIndex((x: any) => isMatch(x, String(ep.epID)));
        }

        if (currentIndex !== -1) {
            result.displayTitle = allEpisodes[currentIndex].name?.trim();
            if (currentIndex > 0) {
                const prev = allEpisodes[currentIndex - 1];
                result.prevEpId = String(prev.ep_id || prev.epID);
            }
            if (currentIndex < allEpisodes.length - 1) {
                const next = allEpisodes[currentIndex + 1];
                result.nextEpId = String(next.ep_id || next.epID);
            }
        } else {
            // Fallback Title
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

    return { episodesData, groups, allEpisodes, displayTitle, prevEpId, nextEpId, isListLoading, episodesError };
}
