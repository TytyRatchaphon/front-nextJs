"use client";

import { Drawer } from "antd";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { ActiveCategory } from "@/services/api/miscApi";
import { resolveSettingsImageSrc } from "@/utils/imageUtils";
import {
  MobileNovelCategoryBlock,
  type NavbarNovelContentType,
} from "./NovelCategoryMenus";

type PromotionGroup = {
  id: string | number;
  name: string;
};

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  logoSrc?: string | null;
  pathname: string;
  promotingGroups?: PromotionGroup[];
  translatedNovelCategories: ActiveCategory[];
  isLoadingTranslatedNovelCategories: boolean;
  fictionNovelCategories: ActiveCategory[];
  isLoadingFictionNovelCategories: boolean;
  openMobileNovelType: NavbarNovelContentType | null;
  onNovelTypeChange: (type: NavbarNovelContentType | null) => void;
};

const getMobileLinkClasses = (isActive: boolean) => (
  `reader-mobile-nav-link flex items-center rounded-2xl px-4 py-3 text-[15px] font-medium transition-colors ${
    isActive ? "bg-[#f7f3f2] !text-[#111111]" : "!text-[#111111] hover:bg-[#f8f4f2]"
  }`
);

export default function MobileNavDrawer({
  open,
  onClose,
  logoSrc,
  pathname,
  promotingGroups,
  translatedNovelCategories,
  isLoadingTranslatedNovelCategories,
  fictionNovelCategories,
  isLoadingFictionNovelCategories,
  openMobileNovelType,
  onNovelTypeChange,
}: MobileNavDrawerProps) {
  return (
    <Drawer
      placement="left"
      closable={false}
      onClose={onClose}
      open={open}
      key="mobile-nav-drawer"
      width={320}
      zIndex={1320}
      classNames={{ body: "reader-mobile-nav-drawer-body" }}
      styles={{
        body: { padding: 0, background: "#fffdfc" },
        mask: { backdropFilter: "blur(8px)", background: "rgba(22, 16, 18, 0.28)" },
      }}
    >
      <div className="reader-mobile-nav-drawer-content flex h-full flex-col">
        <div className="reader-mobile-nav-header border-b border-[#f1e7e4] px-5 pb-4 pt-5">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={onClose} className="flex items-center gap-3">
              <div className="reader-mobile-nav-logo-shell flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#f1e8e4] bg-white shadow-[0_10px_28px_rgba(27,18,20,0.06)]">
                <Image
                  className="h-full w-full object-contain"
                  src={resolveSettingsImageSrc(logoSrc, "/images/default-avatar.png")}
                  unoptimized
                  alt="Logo"
                  width={44}
                  height={44}
                  style={{ color: "transparent" }}
                />
              </div>
              <div>
                <p className="hidden">Navigation</p>
                <p className="text-sm font-semibold text-[#1f1a1c]">เมนูหลัก</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดเมนู"
              className="reader-mobile-nav-close flex h-10 w-10 items-center justify-center rounded-2xl border border-[#f0e4e0] bg-white text-[#2b2325] transition-colors hover:bg-[#fff4f2]"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            <Link href="/" onClick={onClose} className={getMobileLinkClasses(pathname === "/")}>
              <span>หน้าหลัก</span>
            </Link>
            <Link href="/novel-pack" onClick={onClose} className={getMobileLinkClasses(pathname === "/novel-pack")}>
              <span>มัดแพ็ค</span>
            </Link>
            <MobileNovelCategoryBlock
              label="นิยายแปล"
              href="/translated-novel"
              type="tran"
              categories={translatedNovelCategories}
              isLoading={isLoadingTranslatedNovelCategories}
              isOpen={openMobileNovelType === "tran"}
              onToggle={() => onNovelTypeChange(openMobileNovelType === "tran" ? null : "tran")}
              onClose={onClose}
              pathname={pathname}
            />
            <MobileNovelCategoryBlock
              label="นิยายแต่ง"
              href="/fiction-novel"
              type="write"
              categories={fictionNovelCategories}
              isLoading={isLoadingFictionNovelCategories}
              isOpen={openMobileNovelType === "write"}
              onToggle={() => onNovelTypeChange(openMobileNovelType === "write" ? null : "write")}
              onClose={onClose}
              pathname={pathname}
            />
            <Link href="/ranking" onClick={onClose} className={getMobileLinkClasses(pathname.startsWith("/ranking"))}>
              <span>จัดอันดับ</span>
            </Link>
            <Link href="/article" onClick={onClose} className={getMobileLinkClasses(pathname.startsWith("/article"))}>
              <span>บทความ</span>
            </Link>
            {promotingGroups?.map((group) => (
              <Link
                key={group.id}
                href={`/promotion/${group.id}`}
                onClick={onClose}
                className="reader-mobile-nav-link flex items-center rounded-2xl px-4 py-3 text-[15px] font-medium !text-[#111111] transition-colors hover:bg-[#f8f4f2]"
              >
                <span className="truncate">{group.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
