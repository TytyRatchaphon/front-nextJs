"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

import type { ActiveCategory } from "@/services/api/miscApi";

export type NavbarNovelContentType = "tran" | "write";

const getNovelCategoryHref = (type: NavbarNovelContentType, categoryId: string | number) => (
  `/cat/list?type=${type}&categoryId=${categoryId}&tab=bestseller&period=30&limit=10&page=1`
);

type NovelCategoryMenuBaseProps = {
  categories: ActiveCategory[];
  href: string;
  isLoading: boolean;
  label: string;
  type: NavbarNovelContentType;
};

type DesktopNovelDropdownProps = NovelCategoryMenuBaseProps & {
  getLinkClasses: (path: string) => string;
};

export function DesktopNovelDropdown({
  categories,
  getLinkClasses,
  href,
  isLoading,
  label,
  type,
}: DesktopNovelDropdownProps) {
  return (
    <div className="group relative flex h-full items-center">
      <Link href={href} className={`${getLinkClasses(href)} flex items-center gap-1.5`}>
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
      </Link>

      <div className="reader-novel-mega-menu invisible absolute left-1/2 top-[calc(100%-10px)] z-50 w-[520px] -translate-x-1/2 pt-[20px] opacity-0 transition-all duration-200 ease-out group-hover:visible group-hover:opacity-100">
        <div className="reader-novel-mega-menu-panel rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="mb-4 border-b border-gray-100 pb-2">
            <h3 className="text-lg font-bold text-gray-800">
              หมวดหมู่{label}
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="h-6 animate-pulse rounded-md bg-gray-100" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid max-h-[280px] grid-cols-3 gap-x-4 gap-y-3 overflow-y-auto pr-1">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={getNovelCategoryHref(type, category.id)}
                  prefetch={false}
                  title={category.name}
                  className="block truncate py-1 text-sm text-gray-600 transition-colors hover:!text-red-600"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-400">
              ยังไม่มีหมวดหมู่สำหรับ{label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type MobileNovelCategoryBlockProps = NovelCategoryMenuBaseProps & {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  pathname: string;
};

export function MobileNovelCategoryBlock({
  categories,
  href,
  isLoading,
  isOpen,
  label,
  onClose,
  onToggle,
  pathname,
  type,
}: MobileNovelCategoryBlockProps) {
  return (
    <div className="rounded-2xl">
      <div className={`reader-mobile-nav-link flex items-center rounded-2xl text-[15px] font-medium transition-colors ${
        pathname === href ? "bg-[#f7f3f2] !text-[#111111]" : "!text-[#111111] hover:bg-[#f8f4f2]"
      }`}>
        <Link
          href={href}
          onClick={onClose}
          className="flex-1 px-4 py-3 !text-[#111111]"
        >
          <span>{label}</span>
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-label={`เปิดหมวดหมู่${label}`}
          className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-white hover:text-red-600"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <div className="mt-1 rounded-2xl border border-red-50 bg-[#fff8f7] p-3">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-8 animate-pulse rounded-xl bg-red-50" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={getNovelCategoryHref(type, category.id)}
                  onClick={onClose}
                  prefetch={false}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-medium !text-gray-700 shadow-sm transition-colors hover:!text-red-600"
                >
                  <span className="line-clamp-1">{category.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-3 py-5 text-center text-sm text-gray-500">
              ยังไม่มีหมวดหมู่สำหรับ{label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

