"use client";

import Link from "next/link";

import type { ActiveCategory } from "@/services/api/miscApi";
import { DesktopNovelDropdown } from "./NovelCategoryMenus";

type PromotionGroup = {
  id: string | number;
  name: string;
};

type DesktopNavMenuProps = {
  pathname: string;
  promotingGroups?: PromotionGroup[];
  translatedNovelCategories: ActiveCategory[];
  isLoadingTranslatedNovelCategories: boolean;
  fictionNovelCategories: ActiveCategory[];
  isLoadingFictionNovelCategories: boolean;
};

export default function DesktopNavMenu({
  pathname,
  promotingGroups,
  translatedNovelCategories,
  isLoadingTranslatedNovelCategories,
  fictionNovelCategories,
  isLoadingFictionNovelCategories,
}: DesktopNavMenuProps) {
  const getLinkClasses = (path: string) => {
    if (pathname === path) {
      return "text-[15px] lg:text-[17px] leading-6 font-primary font-medium text-red-600 relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-[2px] after:bg-red-600 after:rounded-full after:w-full after:content-['']";
    }
    return "text-[15px] lg:text-[17px] leading-6 font-primary font-medium text-gray-800 hover:text-red-600 transition-colors";
  };

  return (
    <div className="hidden lg:flex flex-1 justify-center items-center gap-x-10">
      <Link href="/" className={getLinkClasses("/")}>หน้าหลัก</Link>
      <Link href="/novel-pack" className={getLinkClasses("/novel-pack")}>มัดแพ็ค</Link>
      <DesktopNovelDropdown
        label="นิยายแปล"
        href="/translated-novel"
        type="tran"
        categories={translatedNovelCategories}
        isLoading={isLoadingTranslatedNovelCategories}
        getLinkClasses={getLinkClasses}
      />
      <DesktopNovelDropdown
        label="นิยายแต่ง"
        href="/fiction-novel"
        type="write"
        categories={fictionNovelCategories}
        isLoading={isLoadingFictionNovelCategories}
        getLinkClasses={getLinkClasses}
      />
      {/* <Link href="/news" className={getLinkClasses('/news')}>นิยายใหม่</Link> */}
      <Link href="/ranking" className={getLinkClasses("/ranking")}>จัดอันดับ</Link>
      <Link href="/article" className={getLinkClasses("/article")}>บทความ</Link>
      {/* <Link href="/campaign" className={getLinkClasses('/campaign')}>แคมเปญ</Link> */}

      {promotingGroups?.map((group) => (
        <Link key={group.id} href={`/promotion/${group.id}`} className={getLinkClasses(`/promotion/${group.id}`)}>
          {group.name}
        </Link>
      ))}
      {/* <Link href="/reel" className={getLinkClasses('/reel')}>Reel</Link> */}
    </div>
  );
}
