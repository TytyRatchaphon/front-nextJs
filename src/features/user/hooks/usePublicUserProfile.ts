import { useQuery } from '@tanstack/react-query';
import {
    getPublicUserProfile,
    getPublicUserRank,
    getPublicUserAchievements,
    getPublicUserCollections
} from '@/services/api/publicUserApi';

export const usePublicUserProfileData = (userId: string) => {
    const profileQuery = useQuery({
        queryKey: ['public-user-profile', userId],
        queryFn: () => getPublicUserProfile(userId),
        enabled: !!userId,
    });

    const rankQuery = useQuery({
        queryKey: ['public-user-rank', userId],
        queryFn: () => getPublicUserRank(userId),
        enabled: !!userId,
    });

    const achievementsQuery = useQuery({
        queryKey: ['public-user-achievements', userId],
        queryFn: () => getPublicUserAchievements(userId, 3),
        enabled: !!userId,
    });

    const collectionsQuery = useQuery({
        queryKey: ['public-user-collections', userId],
        queryFn: () => getPublicUserCollections(userId, 1, 20),
        enabled: !!userId,
    });

    const isLoading = profileQuery.isLoading || rankQuery.isLoading || achievementsQuery.isLoading || collectionsQuery.isLoading;
    const isError = profileQuery.isError || rankQuery.isError || achievementsQuery.isError || collectionsQuery.isError;

    return {
        profile: profileQuery.data,
        rank: rankQuery.data,
        achievements: achievementsQuery.data,
        collections: collectionsQuery.data,
        isLoading,
        isError,
        queries: {
            profileQuery,
            rankQuery,
            achievementsQuery,
            collectionsQuery
        }
    };
};
