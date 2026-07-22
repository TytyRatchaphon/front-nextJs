import apiClient from '../apiClient';
import type { CollectionBook } from './collectionApi';

export interface PublicUserVipSummary {
    icon_url?: string | null;
    card_image_url?: string | null;
    color_config?: any | null;
}

export interface PublicUserProfile {
    user_id: number;
    fullname: string;
    img: string | null;
    banner: string | null;
    totalFollowers: number;
    totalBooksInShelf: number;
    aka: { name: string } | null;
    frame: {
        name: string;
        img: string;
    } | null;
    vip_summary?: PublicUserVipSummary | null;
}

export interface PublicUserRank {
    total_rp: number;
    rp_needed: number;
    current_rank: {
        rank_id: number;
        name: string;
        min_rp: number;
        max_rp: number;
        rank_img: string;
    };
    next_rank: {
        name: string;
        rank_img: string;
    } | null;
}

export interface PublicUserAchievement {
    achievement_id: number;
    title: string;
    icon_url: string;
    description: string;
    is_showcased: number;
    showcase_order: number;
    completed_at: string;
}

export interface PublicUserAchievementsResponse {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        nextPage: number | null;
        prevPage: number | null;
    };
    list: PublicUserAchievement[];
}

export interface PublicUserCollectionsResponse {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        nextPage: number | null;
        prevPage: number | null;
    };
    list: any[]; // Map to your CollectionItem type
}

export interface PublicUserAchievementDetail {
    achievement_id: number;
    title: string;
    description: string;
    icon_url: string;
    target_value: number;
    current_value: number;
    is_completed: number;
    completed_at: string | null;
    is_showcased: number;
}

export const getPublicUserProfile = async (userId: string): Promise<PublicUserProfile> => {
    const response = await apiClient.get(`/public/users/${userId}/profile`);
    const profile = response.data.data;
    if (profile?.vip_summary && typeof profile.vip_summary.color_config === 'string') {
        try { profile.vip_summary.color_config = JSON.parse(profile.vip_summary.color_config); } catch (e) {}
    }
    return profile;
};

export const getPublicUserRank = async (userId: string): Promise<PublicUserRank> => {
    const response = await apiClient.get(`/public/users/${userId}/rank`);
    return response.data.data;
};

export const getPublicUserAchievements = async (userId: string, limit: number = 3): Promise<PublicUserAchievementsResponse> => {
    const response = await apiClient.get(`/public/users/${userId}/achievements`, { params: { limit } });
    return response.data.data;
};

export const getPublicUserCollections = async (userId: string, page: number = 1, limit: number = 20): Promise<PublicUserCollectionsResponse> => {
    const response = await apiClient.get(`/public/users/${userId}/collections`, { params: { page, limit } });
    return response.data.data;
};

export const getPublicUserCollectionDetail = async (userId: string, collectionId: string | number): Promise<{ collection: any; books: CollectionBook[] } | null> => {
    const response = await apiClient.get(`/public/users/${userId}/collections/${collectionId}`);
    const payload = response.data?.data;
    
    if (payload && payload.collection && Array.isArray(payload.books)) {
        return payload;
    }
    
    if (Array.isArray(payload)) {
        console.warn("API returned old format for public collection detail, adapting locally...");
        return {
            collection: { id: collectionId, name: 'Collection', description: '', is_public: true, cover_image: null, is_pinned: false, order_index: 0, created_at: '', updated_at: '', book_count: payload.length },
            books: payload
        };
    }
    
    return null;
};

export const getPublicUserAchievementDetail = async (userId: string, achievementId: string | number): Promise<PublicUserAchievementDetail | null> => {
    const response = await apiClient.get(`/public/users/${userId}/achievements/${achievementId}`);
    return response.data?.data ?? null;
};
