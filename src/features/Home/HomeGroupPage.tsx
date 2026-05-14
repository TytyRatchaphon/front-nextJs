"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import parse from "html-react-parser";
import { useQuery } from "@tanstack/react-query";

import CardBook from "@/components/novelCard/CardBook";
import RecommendCard from "@/components/novelCard/RecommendCard";
import GifLoader from "@/components/utility/GifLoader";
import { fetchHomeData, trackUserBookhomeSectionClick } from "@/services/apiServices";
import { useAuthStore } from "@/stores/authStore";
import { parseJwtToken } from "@/utils/jwtParser";
import { getBookhomeSectionId, isUserBookhomeSection } from "@/utils/userBookhomeSection";

const HIDDEN_GROUP_TYPES = new Set(["ranking", "image", "article", "spotlight", "recommend_admin"]);

const getGroupTitle = (group: any) => group?.name_web || group?.name || "รายการหนังสือ";

const getPlainText = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getBackHref = (contentType?: string | null) => {
  if (contentType === "novel_pack") return "/novel-pack";
  if (contentType === "trancn") return "/translated-novel";
  if (contentType === "fiction") return "/fiction-novel";
  return "/";
};

const hasHomeGroups = (homeData: Awaited<ReturnType<typeof fetchHomeData>> | null | undefined) =>
  Array.isArray(homeData?.data?.groupBookHome) && homeData.data.groupBookHome.length > 0;

const getBackLabel = (contentType?: string | null) => {
  if (contentType === "novel_pack") return "กลับไปหน้ามัดแพ็ค";
  if (contentType === "trancn") return "กลับไปหน้านิยายแปล";
  if (contentType === "fiction") return "กลับไปหน้านิยายแต่ง";
  return "กลับไปหน้าหลัก";
};

export default function HomeGroupPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const contentType = searchParams.get("content_type") || undefined;
  const sectionKind = searchParams.get("section");
  const { token, isLoggedIn, hasMounted, user } = useAuthStore();
  const authToken = parseJwtToken(token);
  const shouldFetchAuthenticatedHome = hasMounted && isLoggedIn && Boolean(authToken);

  const { data: homeData, isLoading } = useQuery({
    queryKey: [
      "homeGroupPage",
      params.id,
      contentType || "default",
      shouldFetchAuthenticatedHome ? `auth:${user?.user_id ?? "user"}` : "guest",
    ],
    queryFn: async () => {
      const data = await fetchHomeData(
        shouldFetchAuthenticatedHome ? authToken : undefined,
        contentType,
        { skipAuth: !shouldFetchAuthenticatedHome },
      );
      if (hasHomeGroups(data)) return data;
      if (shouldFetchAuthenticatedHome) {
        const publicData = await fetchHomeData(undefined, contentType, { skipAuth: true });
        if (hasHomeGroups(publicData)) return publicData;
      }
      return data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: shouldFetchAuthenticatedHome ? 0 : 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const group = React.useMemo(() => {
    const groups = homeData?.data?.groupBookHome || [];
    return groups.find((item: any) => {
      const isRequestedUserSection = sectionKind === "user";
      const isMatchingKind = isRequestedUserSection ? isUserBookhomeSection(item) : !isUserBookhomeSection(item);
      return (
        isMatchingKind &&
        String(getBookhomeSectionId(item)) === String(params.id) &&
        !HIDDEN_GROUP_TYPES.has(item?.type)
      );
    });
  }, [homeData?.data?.groupBookHome, params.id, sectionKind]);

  const items = React.useMemo(() => (Array.isArray(group?.list) ? group.list : []), [group]);
  const books = React.useMemo(
    () => items.map((item: any) => item?.book || item).filter((book: any) => book?.book_id || book?.id),
    [items],
  );
  const isRecommendGroup = group?.type === "recommend";
  const title = getGroupTitle(group);

  const handleUserSectionBookClick = (book: any) => {
    if (!isLoggedIn || !authToken || !isUserBookhomeSection(group)) return;

    const bookId = book?.book_id ?? book?.id;
    if (!group?.user_bookhome_section || !bookId) return;

    void trackUserBookhomeSectionClick({
      userBookhomeSection: group.user_bookhome_section,
      bookId,
      token: authToken,
    });
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[520px] items-center justify-center bg-white">
        <GifLoader />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white font-primary">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-[156px] lg:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={getBackHref(contentType)}
            className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 transition hover:border-red-200 hover:bg-red-100"
          >
            {getBackLabel(contentType)}
          </Link>
        </div>

        <section className="mb-8 rounded-[28px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-white px-5 py-6 shadow-[0_24px_60px_-48px_rgba(220,38,38,0.45)] sm:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-red-500">Book Group</p>
          <h1 className="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl [&_*]:m-0">
            {group ? parse(title) : "ไม่พบรายการหนังสือ"}
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-500">
            {group ? `ทั้งหมด ${books.length.toLocaleString("th-TH")} เล่ม` : "รายการนี้อาจถูกปิดหรือไม่มีข้อมูลแล้ว"}
          </p>
        </section>

        {group && books.length > 0 ? (
          isRecommendGroup ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {items
                .filter((item: any) => item?.book)
                .map((item: any, index: number) => (
                  <RecommendCard
                    key={item.rec_id || item.book?.book_id || index}
                    data={item}
                    onBookClick={handleUserSectionBookClick}
                  />
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {books.map((book: any, index: number) => (
                <CardBook
                  key={`${book.book_id ?? book.id ?? "book"}-${book.parent_book_id ?? "root"}-${index}`}
                  book={book}
                  onBookClick={handleUserSectionBookClick}
                />
              ))}
            </div>
          )
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center text-sm font-medium text-slate-500">
            {group ? `ยังไม่มีหนังสือในกลุ่ม ${getPlainText(title)}` : "ไม่พบข้อมูล group นี้"}
          </div>
        )}
      </div>
    </main>
  );
}
