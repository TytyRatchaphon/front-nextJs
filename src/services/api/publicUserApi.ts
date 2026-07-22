import apiClient from '../apiClient';
import type { CollectionBook } from './collectionApi';

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
    return response.data.data;
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

const normalizeCollectionBooks = (value: unknown): CollectionBook[] => {
    if (!Array.isArray(value)) return [];

    return value.map((entry) => {
        if (!entry || typeof entry !== 'object') return entry as CollectionBook;

        const relation = entry as Record<string, unknown>;
        const nestedBook = relation.book ?? relation.Book ?? relation.book_detail ?? relation.book_data;
        if (!nestedBook || typeof nestedBook !== 'object' || Array.isArray(nestedBook)) {
            return relation as unknown as CollectionBook;
        }

        const book = nestedBook as Record<string, unknown>;
        return {
            ...relation,
            ...book,
            order_index: relation.order_index ?? book.order_index,
            collection_book_id: relation.collection_book_id ?? book.collection_book_id,
            collection_id: relation.collection_id ?? book.collection_id,
        } as unknown as CollectionBook;
    });
};

export const getPublicUserCollectionDetail = async (userId: string, collectionId: string | number): Promise<CollectionBook[]> => {
    const response = await apiClient.get(`/public/users/${userId}/collections/${collectionId}`);
    const payload = response.data?.data;

    if (Array.isArray(payload)) return normalizeCollectionBooks(payload);
    if (!payload || typeof payload !== 'object') return [];

    // The collection-detail endpoint can return a paginated/object payload
    // instead of the array returned by older API versions.
    const nestedPayload = payload as {
        books?: unknown;
        list?: unknown;
        items?: unknown;
        data?: unknown;
    };
    const books = nestedPayload.books ?? nestedPayload.list ?? nestedPayload.items ?? nestedPayload.data;

    return normalizeCollectionBooks(books);
};

export const getPublicUserAchievementDetail = async (userId: string, achievementId: string | number): Promise<PublicUserAchievementDetail | null> => {
    const response = await apiClient.get(`/public/users/${userId}/achievements/${achievementId}`);
    return response.data?.data ?? null;
};
