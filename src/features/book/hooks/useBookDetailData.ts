import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys, QUERY_CONFIG } from "@/constants/query";
import {
    fetchBookDetail,
    fetchBookEpisodes,
    fetchUserShelve,
    fetchBookPurchaseDetails,
    fetchNovelPackCheck,
} from "@/services/apiServices";
import { resolveBookCoverImageSrc } from "@/utils/imageUtils";

export function useBookDetailData(bookId: string, token: string | null, isReady: boolean) {
    // Book Detail
    const {
        data: bookDetail,
        isLoading: isLoadingDetail,
        isError: isErrorDetail,
        error: errorDetail,
    } = useQuery({
        queryKey: queryKeys.book.detail(bookId),
        queryFn: async () => {
            const data = await fetchBookDetail(bookId);
            return data;
        },
        enabled: !!bookId && isReady,
        staleTime: QUERY_CONFIG.STALE_TIME_VERY_LONG,
        placeholderData: keepPreviousData,
    });

    // User Shelf
    const { data: userShelf } = useQuery({
        queryKey: queryKeys.user.shelf(token),
        queryFn: () => fetchUserShelve(),
        enabled: !!token && isReady,
        staleTime: QUERY_CONFIG.STALE_TIME_VERY_LONG,
    });

    // Episodes
    const { data: episodesData, isLoading: isLoadingEpisodes, isError: isErrorEpisodes } = useQuery({
        queryKey: queryKeys.book.episodes(bookId),
        queryFn: () => fetchBookEpisodes(bookId),
        enabled: !!bookId && isReady,
        staleTime: QUERY_CONFIG.STALE_TIME_VERY_LONG,
        placeholderData: keepPreviousData,
    });

    // Purchase Details
    const { data: purchaseDetails } = useQuery({
        queryKey: queryKeys.book.purchaseDetails(bookId, token),
        queryFn: () => fetchBookPurchaseDetails(bookId),
        enabled: !!bookId && isReady,
        staleTime: QUERY_CONFIG.STALE_TIME_VERY_LONG,
    });

    // Reading Mode (Episode vs Pack)
    const { data: novelPackCheck } = useQuery({
        queryKey: queryKeys.book.novelPackCheck(bookId),
        queryFn: () => fetchNovelPackCheck(bookId),
        enabled: !!bookId && isReady,
        staleTime: QUERY_CONFIG.STALE_TIME_VERY_LONG,
    });

    const firstEpisodeId = episodesData?.groups?.[0]?.list?.[0]?.ep_id;

    const isInShelf = userShelf && Array.isArray((userShelf as any).books)
        ? (userShelf as any).books.some((b: any) => String(b.book_id) === String(bookId))
        : false;

    // Calculate latest episode date
    let latestEpisodeDate = bookDetail?.update_at;

    if (episodesData?.groups) {
        let maxDate = bookDetail?.update_at ? new Date(bookDetail.update_at).getTime() : 0;
        episodesData.groups.forEach((group: any) => {
            if (group.list) {
                group.list.forEach((ep: any) => {
                    // Check various potential date fields
                    const dateStr = ep.publish_datetime || ep.date_at || ep.created_at || ep.update_at || ep.create_date;
                    if (dateStr) {
                        const t = new Date(dateStr).getTime();
                        if (!isNaN(t) && t > maxDate) {
                            maxDate = t;
                            latestEpisodeDate = dateStr;
                        }
                    }
                });
            }
        });
    }

    const book = useMemo(() => {
        return bookDetail
            ? {
                id: bookDetail.book_id,
                isAddedToShelf: (bookDetail as any).isAddedToShelf || bookDetail.isFollowing || isInShelf,
                img: bookDetail.img,
                img_full: bookDetail.img_full,
                img_gif: (bookDetail as any).img_gif,
                img_gif_full: (bookDetail as any).img_gif_full,
                cover: resolveBookCoverImageSrc(
                    {
                        img: bookDetail.img,
                        img_full: bookDetail.img_full,
                        img_gif: (bookDetail as any).img_gif,
                        img_gif_full: (bookDetail as any).img_gif_full,
                    },
                    '/images/book.png',
                    'book',
                ),
                title: bookDetail.name,
                tag: (bookDetail as any).category1?.name || bookDetail["category1.name"],
                category2: (bookDetail as any).category2?.name || bookDetail["category2.name"],
                writer: (bookDetail as any).writer ? {
                    user_id: (bookDetail as any).writer.user_id,
                    writer_name: (bookDetail as any).writer.writer_name || (bookDetail as any).writer.fullname || (bookDetail as any).writer_name || "Unknown",
                    img: (bookDetail as any).writer.img || (bookDetail as any).writer.user_img || "",
                    isFollowing: (bookDetail as any).writer.isFollowing || false,
                } : (bookDetail as any).user ? {
                    user_id: (bookDetail as any).user.user_id,
                    writer_name: (bookDetail as any).user.fullname,
                    img: (bookDetail as any).user.img,
                    isFollowing: (bookDetail as any).user.isFollowing || false,
                } : null,
                views: bookDetail.view,
                chapters: bookDetail.chapter,
                reviews: bookDetail.comment,
                hearts: bookDetail.heart,
                flowers: bookDetail.flower,
                remaining_paid_total: purchaseDetails?.remaining_paid_total ?? (bookDetail as any).remaining_paid_total ?? (bookDetail as any).remaining_paid?.total,
                remaining_paid_count: purchaseDetails?.remaining_paid_count ?? (bookDetail as any).remaining_paid_count ?? (bookDetail as any).remaining_paid?.count,
                total_remaining_count: purchaseDetails?.total_remaining_count ?? (bookDetail as any).total_remaining_count ?? (bookDetail as any).total_remaining?.count,
                total_remaining_total: purchaseDetails?.total_remaining_total ?? (bookDetail as any).total_remaining_total ?? (bookDetail as any).total_remaining?.total,
                price: (bookDetail as any).price ?? 2299,
                promotion: (purchaseDetails?.discount_full_book || (bookDetail as any).discount_full_book) ? {
                    id: (purchaseDetails?.discount_full_book?.dfb_id || (bookDetail as any).discount_full_book.dfb_id),
                    title: (purchaseDetails?.discount_full_book?.subject || (bookDetail as any).discount_full_book.subject),
                    startDate: (purchaseDetails?.discount_full_book?.start_date || (bookDetail as any).discount_full_book.start_date),
                    endDate: (purchaseDetails?.discount_full_book?.end_date || (bookDetail as any).discount_full_book.end_date),
                    percent: (purchaseDetails?.discount_full_book?.discount_percent || (bookDetail as any).discount_full_book.discount_percent),
                    price: (purchaseDetails?.remaining_promo_total_discount ?? (bookDetail as any).remaining_promo_total_discount ?? 0),
                    rewards: (purchaseDetails?.discount_full_book?.rewards || (bookDetail as any).discount_full_book.rewards || [])
                      .slice()
                      .sort((a: any, b: any) => Number(a?.order_by ?? 0) - Number(b?.order_by ?? 0)),
                } : undefined,
                description: bookDetail.title,
                tags: Array.isArray(bookDetail.tag)
                    ? bookDetail.tag
                    : typeof bookDetail.tag === "string"
                        ? (bookDetail.tag as string).split(",").filter((t: string) => t.trim() !== "")
                        : [],
                publishDate: bookDetail.date_at,
                end: bookDetail.end,
                rate: bookDetail.rate,
                star: bookDetail.star,
                firstEpisodeId: firstEpisodeId,
                fastTicket: purchaseDetails?.fast_ticket,
                use_freecoin: (bookDetail as any).use_freecoin,
                ep_purchase_reward: (bookDetail as any).ep_purchase_reward,
                // Pass raw data for Tabs using raw access - USE CALCULATED DATE
                update_at: latestEpisodeDate,
                des: bookDetail.des,
                category1: (bookDetail as any).category1,
                cat1: bookDetail.cat1,
                cat2: bookDetail.cat2,
                // Manual overrides for specific access patterns
                "category1.name": bookDetail["category1.name"],
                "category2.name": bookDetail["category2.name"],
                "writer.writer_name": (bookDetail as any)["writer.writer_name"],
                writer_name: (bookDetail as any).writer_name,
                status: bookDetail.status,
                video: bookDetail.video ?? null,
            }
            : null;
    }, [bookDetail, isInShelf, purchaseDetails, firstEpisodeId, latestEpisodeDate]);

    // Extract video data for trailer player
    const videoData = bookDetail?.video ?? null;

    return {
        bookDetail, // Raw object
        book,       // Transformed object
        episodesData,
        novelPackCheck,
        videoData,  // Video trailer and presentation data
        isLoading: isLoadingDetail,
        isLoadingEpisodes,
        isError: isErrorDetail || isErrorEpisodes,
        error: errorDetail,
    };
}
