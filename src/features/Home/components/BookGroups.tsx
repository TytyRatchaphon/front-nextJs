"use client";

import * as React from "react";
import BookSwiper from "@/features/Home/components/BookSwiper";
import TopRanking from "@/features/Home/components/TopRanking";
import ExclusiveSwiper from "@/components/swiper/ExclusiveSwiper";
import RecommendSwiper from "@/components/swiper/RecommendSwiper";
import ArticleSwiper from "@/components/swiper/ArticleSwiper";
import RewardSwiper from "@/components/swiper/RewardSwiper";
import ImgLeftBgBookGrid from "@/features/Home/components/ImgLeftBgBookGrid";
import Image from "next/image";
import Link from "next/link";
import { trackUserBookhomeSectionClick } from "@/services/apiServices";
import { useAuthStore } from "@/stores/authStore";
import { parseJwtToken } from "@/utils/jwtParser";
import { getBookhomeSectionId, isUserBookhomeSection } from "@/utils/userBookhomeSection";

interface BookGroupsProps {
  groupBookHome: any[];
  contentType?: string;
}

const MORE_LINK_MIN_BOOKS = 11;
const EXCLUDED_AUTO_MORE_GROUP_TYPES = new Set([
  "ranking",
  "image",
  "article",
  "spotlight",
  "recommend_admin",
]);

const buildHomeGroupMoreLink = (group: any, contentType?: string) => {
  if (group?.link) return group.link;

  const items = Array.isArray(group?.list) ? group.list : [];
  const groupId = getBookhomeSectionId(group);
  if (!groupId || items.length < MORE_LINK_MIN_BOOKS || EXCLUDED_AUTO_MORE_GROUP_TYPES.has(group?.type)) {
    return undefined;
  }

  const params = new URLSearchParams();
  if (contentType) params.set("content_type", contentType);
  if (isUserBookhomeSection(group)) params.set("section", "user");
  return `/home-group/${groupId}${params.size > 0 ? `?${params.toString()}` : ""}`;
};

export default function BookGroups({ groupBookHome, contentType }: BookGroupsProps) {
  const { token, isLoggedIn } = useAuthStore();
  const authToken = parseJwtToken(token);

  const handleUserSectionBookClick = (section: any, book: any) => {
    if (!isLoggedIn || !authToken || !isUserBookhomeSection(section)) return;

    const bookId = book?.book_id ?? book?.id;
    if (!section?.user_bookhome_section || !bookId) return;

    void trackUserBookhomeSectionClick({
      userBookhomeSection: section.user_bookhome_section,
      bookId,
      token: authToken,
    });
  };

  return (
    <div className="w-full mb-8">
      {groupBookHome
        .filter((group: any) => group.type !== 'spotlight' && group.type !== 'recommend_admin')
        .sort((a: any, b: any) => {
          const orderA = Number(a?.order_by);
          const orderB = Number(b?.order_by);
          const hasOrderA = Number.isFinite(orderA);
          const hasOrderB = Number.isFinite(orderB);

          if (hasOrderA && hasOrderB && orderA !== orderB) return orderA - orderB;
          if (hasOrderA && !hasOrderB) return -1;
          if (!hasOrderA && hasOrderB) return 1;

          const priority: { [key: string]: number } = { 'exclusive': 2, 'recommend': 1, 'article': 100 };
          const pA = priority[a.type] || 99;
          const pB = priority[b.type] || 99;
          return pA - pB;
        })
        .map((group: any, index: number) => {
          const moreLink = buildHomeGroupMoreLink(group, contentType);
          const onBookClick = isUserBookhomeSection(group)
            ? (book: any) => handleUserSectionBookClick(group, book)
            : undefined;

          if (group.type === 'ranking') {
            return (
              <div key={index} className="w-full -mt-4">
                <TopRanking rankingGroup={group} />
              </div>
            );
          }
          if (group.type === 'image' && group.img) {
            const imageContent = (
              <div className="w-full mb-6">
                <div className="relative w-full overflow-hidden rounded-xl">
                  <Image
                    src={group.img}
                    alt={group.name_web || group.name || 'home banner'}
                    width={1200}
                    height={300}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            );

            return group.link ? (
              <Link key={index} href={group.link} target={group.link.startsWith('http') ? '_blank' : undefined} rel={group.link.startsWith('http') ? 'noreferrer' : undefined} className="block">
                {imageContent}
              </Link>
            ) : (
              <div key={index}>{imageContent}</div>
            );
          }
          if (group.type === 'exclusive') {
            return (
              <div key={index} className="-mb-8">
                <ExclusiveSwiper
                  title={group.name_web || group.name}
                  items={group.list || []}
                  icon={group.img}
                  link={moreLink}
                  onBookClick={onBookClick}
                />
              </div>
            );
          }
          if (group.type === 'recommend') {
            return (
              <div key={index} className="-mb-1">
                <RecommendSwiper
                  title={group.name_web || group.name}
                  items={group.list || []}
                  icon={group.img}
                  link={moreLink}
                  onBookClick={onBookClick}
                />
              </div>
            );
          }
          if (group.type === 'article') {
            return (
              <div key={index} className="-mb-1">
                <ArticleSwiper
                  title={group.name_web || group.name}
                  items={group.list || []}
                  icon={group.img}
                  link={group.link || undefined}
                />
              </div>
            );
          }
          if (group.type === 'reward') {
            return (
              <div key={index} className="-mb-1">
                <RewardSwiper
                  title={group.name_web || group.name}
                  items={group.list || []}
                  icon={group.img}
                  link={moreLink}
                  onBookClick={onBookClick}
                  startDate={group.start_date}
                  endDate={group.end_date}
                  groupId={group.home_group_id}
                  canFollow={group.can_follow}
                  isInitiallyFollowed={group.is_followed}
                  initialNow={0}
                />
              </div>
            );
          }
          if (group.type === 'img_left_bg_book_grid_2row') {
            return (
              <div key={index} className="w-full mb-6 mt-6">
                <ImgLeftBgBookGrid
                  group={group}
                  link={moreLink}
                  onBookClick={onBookClick}
                />
              </div>
            );
          }
          return (
            <div key={index} className="-mb-1">
              <BookSwiper
                title={group.name_web || group.name}
                books={group.list || []}
                icon={group.img}
                link={moreLink}
                isCollection={group.type === 'user_collections'}
                onBookClick={onBookClick}
              />
            </div>
          );
        })}
    </div>
  );
}
