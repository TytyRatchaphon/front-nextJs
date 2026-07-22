"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ConfigProvider, Empty, Pagination, Select } from "antd";
import {
  fetchLeaderboardUserRank,
  fetchLeaderboardUsers,
  fetchRankingBooks,
  RankingTimeRange,
} from "@/services/apiServices";
import { useActiveCategories } from "@/features/Home/hooks/useHomeQueries";
import { TagSwiper } from "@/components/swiper/ImageSlider";
import GifLoader from "@/components/utility/GifLoader";
import { useAuthStore } from "@/stores/authStore";
import { resolveBookCoverImageSrc } from "@/utils/imageUtils";

type RankingMode = "books" | "users";

const PAGE_SIZE = 10;

const RANGE_OPTIONS: Array<{ value: RankingTimeRange; label: string }> = [
  { value: "week", label: "สัปดาห์" },
  { value: "month", label: "เดือน" },
  { value: "year", label: "ปี" },
  { value: "all", label: "ตลอดกาล" },
];

const MODE_OPTIONS: Array<{ value: RankingMode; label: string }> = [
  { value: "books", label: "จัดอันดับนิยาย" },
  { value: "users", label: "จัดอันดับผู้ใช้" },
];

const formatNumber = (value: number | null | undefined): string => Number(value || 0).toLocaleString();

export default function Rank() {
  const [mode, setMode] = useState<RankingMode>("books");
  const [range, setRange] = useState<RankingTimeRange>("week");
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<number | string | undefined>(undefined);
  const myUserId = useAuthStore((state) => state.user?.user_id);

  const { data: categoryData } = useActiveCategories("all", { enabled: true });

  const categoryOptions = useMemo(() => {
    if (!categoryData) return [];
    return categoryData.map((cat) => ({
      label: cat.name,
      value: cat.id,
    }));
  }, [categoryData]);

  useEffect(() => {
    if (mode !== "books") return;
    if (categoryData && categoryData.length > 0 && categoryId === undefined) {
      setCategoryId(categoryData[0].id);
    }
  }, [mode, categoryData, categoryId]);

  const rankingBooksQuery = useQuery({
    queryKey: ["rankingBooks", range, page, categoryId],
    queryFn: () => fetchRankingBooks(range, page, PAGE_SIZE, categoryId),
    enabled: mode === "books",
  });

  const rankingUsersQuery = useQuery({
    queryKey: ["rankingUsers", range, page],
    queryFn: () => fetchLeaderboardUsers(range, page, PAGE_SIZE),
    enabled: mode === "users",
  });

  const myRankQuery = useQuery({
    queryKey: ["rankingUserSelf", myUserId, range],
    queryFn: () => fetchLeaderboardUserRank(myUserId as number, range),
    enabled: mode === "users" && !!myUserId,
  });

  const books = rankingBooksQuery.data?.books || [];
  const booksPagination = rankingBooksQuery.data?.pagination;
  const users = rankingUsersQuery.data?.users || [];
  const usersPagination = rankingUsersQuery.data?.pagination;

  const isLoading = mode === "books" ? rankingBooksQuery.isLoading : rankingUsersQuery.isLoading;
  const totalItems = mode === "books" ? booksPagination?.total || 0 : usersPagination?.total || 0;
  const pageSize = mode === "books" ? booksPagination?.limit || PAGE_SIZE : usersPagination?.limit || PAGE_SIZE;

  const handleRangeChange = (newRange: RankingTimeRange) => {
    setRange(newRange);
    setPage(1);
  };

  const handleModeChange = (newMode: RankingMode) => {
    setMode(newMode);
    setPage(1);
  };

  const handleCategoryChange = (val: number | string) => {
    setCategoryId(val);
    setPage(1);
  };

  const renderBookList = () => {
    if (books.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Empty description="ไม่พบข้อมูลการจัดอันดับนิยายในช่วงเวลานี้" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {books.map((book) => (
          <div
            key={book.book_id}
            className="flex gap-4 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:gap-6"
          >
            <div className="relative aspect-[2/3] w-[100px] shrink-0 md:w-[140px]">
              <Link href={`/book/${book.book_id}`} className="group relative block h-full w-full overflow-hidden rounded-md">
                <div className="absolute -left-2 -top-2 z-10">
                  <div className="relative h-8 w-8 md:h-10 md:w-10">
                    <div
                      className={`flex h-full w-full items-center justify-center rounded-full border bg-white text-xs font-bold shadow-sm md:text-sm ${
                        book.rank === 1
                          ? "border-yellow-400 text-yellow-500"
                          : book.rank === 2
                            ? "border-gray-400 text-gray-500"
                            : book.rank === 3
                              ? "border-orange-400 text-orange-500"
                              : "border-gray-200 text-gray-400"
                      }`}
                    >
                      #{book.rank}
                    </div>
                  </div>
                </div>

                {book.end === "end" && (
                  <div className="absolute right-2 top-2 z-10 rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white shadow">
                    จบ
                  </div>
                )}

                <Image
                  src={resolveBookCoverImageSrc(book, '/images/ejb.png')}
                  alt={book.name}
                  fill
                  className="rounded-md object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              </Link>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-start py-1">
              <Link href={`/book/${book.book_id}`}>
                <h2 className="mb-1 line-clamp-1 text-lg font-bold text-black transition-colors hover:text-red-600 md:text-xl">
                  {book.name}
                </h2>
              </Link>
              <div className="mb-2 text-sm font-medium text-gray-600">{book.writer_name || "Unknown Author"}</div>

              <div className="mb-2 line-clamp-2 text-sm text-gray-500">{book.title}</div>

              <div className="mb-auto w-full overflow-hidden">
                <TagSwiper
                  tags={
                    Array.isArray(book.tag)
                      ? book.tag
                      : typeof book.tag === "string"
                        ? book.tag.split(",").filter((tag) => tag.trim() !== "")
                        : []
                  }
                  classImport="whitespace-nowrap rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] text-red-500 md:text-xs"
                />
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 md:text-sm">
                <div className="flex items-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
                      fill="#9CA3AF"
                    />
                  </svg>
                  <span>{formatNumber(book.view)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM19 11H13V13H19V11ZM19 7H13V9H19V7ZM19 15H13V17H19V15Z"
                      fill="#9CA3AF"
                    />
                  </svg>
                  <span>{formatNumber(book.chapter)} ตอน</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderUserList = () => {
    if (users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 shadow-sm">
          <Empty description="ไม่พบข้อมูลการจัดอันดับผู้ใช้ในช่วงเวลานี้" />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {myUserId && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            {myRankQuery.isLoading ? (
              <p className="text-sm text-gray-500">กำลังโหลดอันดับของคุณ...</p>
            ) : myRankQuery.data ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">อันดับของฉัน</p>
                  <p className="line-clamp-1 text-sm font-semibold text-gray-800">
                    {myRankQuery.data.user?.fullname || "ผู้ใช้"}
                  </p>
                  {myRankQuery.data.current_rank ? (
                    <p className="mt-1 line-clamp-1 text-xs font-medium text-red-600">
                      {myRankQuery.data.current_rank.name}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">อันดับ</p>
                  <p className="text-lg font-bold text-red-600">
                    {myRankQuery.data.rank ? `#${myRankQuery.data.rank}` : "-"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">ยังไม่มีอันดับในช่วงเวลานี้</p>
            )}
          </div>
        )}

        {users.map((row, index) => {
          const rankLabel = row.rank ? `#${row.rank}` : `#${index + 1}`;
          const user = row.user || {};
          const userId = user.user_id;
          const fullname = user.fullname || "ผู้ใช้";
          const avatar = user.img || "/images/default-avatar.png";

          return (
            <div
              key={`${userId || "unknown"}-${row.rank || index}`}
              className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-red-200 hover:shadow-md md:p-4"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-sm font-bold text-red-600 md:h-11 md:w-11 md:text-base">
                  {rankLabel}
                </div>

                <Link
                  href={userId ? `/profile/${userId}` : "#"}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100"
                >
                  <Image src={avatar} alt={fullname} fill className="object-cover" unoptimized />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={userId ? `/profile/${userId}` : "#"}
                    className="line-clamp-1 text-sm font-semibold text-gray-800 hover:text-red-600 md:text-base"
                  >
                    {fullname}
                  </Link>
                </div>

                {row.current_rank ? (
                  <div className="flex shrink-0 items-center gap-2 rounded-xl border border-red-100 bg-red-50/70 px-2.5 py-2 sm:px-3">
                    {row.current_rank.rank_img ? (
                      <div className="relative h-8 w-8 shrink-0">
                        <Image
                          src={row.current_rank.rank_img}
                          alt={row.current_rank.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <p className="hidden text-[11px] font-normal text-gray-500 sm:block">ระดับนักอ่าน</p>
                      <p className="max-w-[76px] truncate text-[11px] font-semibold text-red-600 sm:max-w-[170px] sm:text-xs">
                        {row.current_rank.name}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1124px] px-4 py-8">
      <div className="mb-8 flex flex-col items-center justify-between border-b-2 border-gray-200 pb-4 md:flex-row">
        <div className="flex items-center gap-3">
          <Image
            src="/images/warning_cat.png"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            unoptimized
            alt="icon"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <h1 className="text-3xl font-bold text-black">จัดอันดับ</h1>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 md:mt-0">
          {mode === "books" && categoryOptions.length > 0 && (
            <Select value={categoryId} onChange={handleCategoryChange} options={categoryOptions} className="w-[150px]" />
          )}

          <div className="flex rounded-lg bg-gray-100 p-1">
            {MODE_OPTIONS.map((item) => (
              <button
                key={item.value}
                onClick={() => handleModeChange(item.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === item.value ? "bg-white text-black shadow" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg bg-gray-100 p-1">
            {RANGE_OPTIONS.map((item) => (
              <button
                key={item.value}
                onClick={() => handleRangeChange(item.value)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  range === item.value ? "bg-white text-black shadow" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? <GifLoader /> : mode === "books" ? renderBookList() : renderUserList()}

      {totalItems > pageSize && (
        <div className="mt-8 flex items-center justify-center">
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#DC2626",
              },
            }}
          >
            <Pagination
              current={page}
              total={totalItems}
              pageSize={pageSize}
              onChange={(nextPage) => setPage(nextPage)}
              showSizeChanger={false}
            />
          </ConfigProvider>
        </div>
      )}
    </div>
  );
}
