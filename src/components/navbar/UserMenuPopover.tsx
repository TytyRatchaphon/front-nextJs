"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Switch } from "antd";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Library,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  Store,
  Ticket,
  Trophy,
  User,
} from "lucide-react";

import AmountPill from "@/components/utility/AmountPill";
import FastTicketPill from "@/components/utility/FastTicketPill";
import FreeCoinPill from "@/components/utility/FreeCoinPill";
import RPPill from "@/components/utility/RPPill";
import StampPill from "@/components/utility/StampPill";
import FrameOverlayImage from "@/components/ui/FrameOverlayImage";
import type { RankItem } from "@/services/api/userApi";

type NavbarUser = {
  coin?: number | string | null;
  freecoin?: number | string | null;
  fast_ticket?: number | string | null;
  stamp?: number | string | null;
};

type UserMenuPopoverProps = {
  avatarSrc: string | null;
  currentRank: RankItem | null;
  enableGifModeToggle?: boolean;
  hasRankRewardNotification: boolean;
  isGifModeEnabled: boolean;
  onClose: () => void;
  onGifModeChange: (enabled: boolean) => void;
  onLogout: () => void;
  onClearCache?: () => void;
  rpIconSrc?: string | null;
  rpValue: number;
  user: NavbarUser | null | undefined;
  userFrameImage: string | null;
  userFullname: string;
  variant?: "popover" | "drawer";
};

const profileMenuItem = { href: "/mprofile", label: "ข้อมูลของฉัน", icon: User } as const;

const menuItems = [
  { href: "/store", label: "ร้านค้า", icon: Store },
  { href: "/wallet/history", label: "ประวัติ", icon: Clock3 },
  { href: "/shelve", label: "ชั้นหนังสือ", icon: Library },
  { href: "/w/mybook", label: "นิยายของฉัน", icon: BookOpen },
  { href: "/event", label: "กิจกรรม", icon: CalendarDays },
  { href: "/achievement", label: "ความสำเร็จ", icon: Trophy },
  { href: "/redeem", label: "กรอกโค๊ด", icon: Ticket },
  { href: "/coupon", label: "คูปอง", icon: Ticket },
] as const;

function UserAvatar({
  avatarSrc,
  userFrameImage,
}: {
  avatarSrc: string | null;
  userFrameImage: string | null;
}) {
  return (
    <div className="reader-user-popover-avatar-shell relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white shadow-sm">
      <Image
        src={avatarSrc || "/images/default-avatar.png"}
        alt="User Avatar"
        fill
        sizes="48px"
        className="rounded-full object-cover"
        unoptimized
      />
      {userFrameImage && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <FrameOverlayImage src={userFrameImage} alt="Frame" className="object-contain" />
        </div>
      )}
    </div>
  );
}

function RankSummary({
  currentRank,
  hasRankRewardNotification,
  onClose,
  rpValue,
}: Pick<UserMenuPopoverProps, "currentRank" | "hasRankRewardNotification" | "onClose" | "rpValue">) {
  if (!currentRank) return null;

  return (
    <Link
      href="/mprofile"
      onClick={onClose}
      className={`reader-user-popover-rank relative mt-2 flex items-center justify-between rounded-xl border px-3 py-2.5 transition-all duration-200 group ${
        hasRankRewardNotification
          ? "border-red-200 bg-gradient-to-r from-red-50 via-white to-gray-50 shadow-[0_8px_20px_rgba(220,38,38,0.10)]"
          : "border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 hover:border-gray-300"
      }`}
    >
      {hasRankRewardNotification && (
        <span className="pointer-events-none absolute right-2 top-2 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
        </span>
      )}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="reader-user-popover-rank-image-shell flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white p-1 shadow-sm">
          <Image
            src={currentRank.rank_img || "/images/rank_dummy.png"}
            alt={currentRank.name}
            width={32}
            height={32}
            className="object-contain"
            unoptimized
          />
        </div>
        <div className="reader-user-popover-rank-copy min-w-0">
          <p className="text-[10px] font-medium leading-tight text-gray-400">ระดับปัจจุบัน</p>
          <p className="truncate text-sm font-bold leading-tight text-gray-800">{currentRank.name}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <RPPill
          amount={rpValue}
          className="reader-user-popover-pill reader-user-popover-rp-pill !h-[30px] !min-w-[82px] !px-2.5"
        />
        <span className="reader-user-popover-rank-cta flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-red-500 group-hover:text-red-600">
          เพิ่มเติม
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

export default function UserMenuPopover({
  avatarSrc,
  currentRank,
  enableGifModeToggle = true,
  hasRankRewardNotification,
  isGifModeEnabled,
  onClose,
  onGifModeChange,
  onLogout,
  onClearCache,
  rpValue,
  user,
  userFrameImage,
  userFullname,
  variant = "popover",
}: UserMenuPopoverProps) {
  const isDrawer = variant === "drawer";
  const linkClass = "reader-user-popover-link group flex items-center gap-3 rounded-lg px-4 py-2.5 text-black transition-all duration-200 hover:bg-gray-100";
  const iconClass = "h-5 w-5 shrink-0 text-[#B01F1F]";
  const ProfileIcon = profileMenuItem.icon;

  return (
    <div
      className={`reader-user-popover-content overflow-hidden ${
        isDrawer ? "flex h-full w-full flex-col bg-white" : "flex max-h-[calc(100vh-96px)] w-[320px] flex-col bg-white"
      }`}
    >
      <div
        className={`reader-user-popover-panel rounded-lg p-2 ${isDrawer ? "mx-4 mt-4" : ""}`}
        style={{ width: isDrawer ? "auto" : "320px", backgroundColor: "#FFE8F0" }}
      >
        <div
          className="reader-user-popover-profile-card mb-2 h-[65px] w-full rounded-full bg-white shadow-sm"
          style={{ margin: isDrawer ? "0 auto 8px" : undefined }}
        >
          <div className="flex h-full items-center justify-between px-4">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar avatarSrc={avatarSrc} userFrameImage={userFrameImage} />
              <span className="reader-user-popover-name min-w-0 truncate py-0.5 font-primary text-base leading-[1.45] text-gray-900">
                {userFullname || "User00001"}
              </span>
            </div>
            <button className="reader-user-popover-dots ml-2 shrink-0 text-gray-800 hover:text-gray-600" aria-label="User menu">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-2 px-2">
          <div className="w-full">
            <FreeCoinPill amount={Number(user?.freecoin || 0)} className="reader-user-popover-pill reader-user-popover-pill-freecoin w-full" />
          </div>
          <div className="w-full">
            <AmountPill amount={Number(user?.coin || 0)} className="reader-user-popover-pill reader-user-popover-pill-amount w-full" />
          </div>
          <div className="w-full">
            <FastTicketPill amount={Number(user?.fast_ticket || 0)} className="reader-user-popover-pill reader-user-popover-pill-fastticket w-full" />
          </div>
          <div className="w-full">
            <StampPill amount={Number(user?.stamp || 0)} className="reader-user-popover-pill reader-user-popover-pill-stamp w-full" />
          </div>
        </div>

        <RankSummary
          currentRank={currentRank}
          hasRankRewardNotification={hasRankRewardNotification}
          onClose={onClose}
          rpValue={rpValue}
        />
      </div>

      <div className={`reader-user-popover-body flex-1 overflow-y-auto bg-white ${isDrawer ? "px-4 mt-2" : ""}`}>
        <div className={`${isDrawer ? "w-full" : "w-[274px] mx-auto"}`}>
          <Link href={profileMenuItem.href} onClick={onClose} className={linkClass}>
            <ProfileIcon className={iconClass} />
            <span className="font-primary text-black transition-colors group-hover:text-red-600">
              {profileMenuItem.label}
            </span>
          </Link>
        </div>

        <div className="my-2 flex justify-center">
          <div className={`reader-user-popover-divider h-[1px] bg-gray-300 ${isDrawer ? "w-full" : "w-[250px]"}`} />
        </div>

        <div className={`grid auto-rows-fr grid-cols-2 gap-x-2 ${isDrawer ? "w-full" : "w-[274px] mx-auto"}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose} className={linkClass}>
                <Icon className={iconClass} />
                <span className="font-primary whitespace-nowrap text-sm text-black transition-colors group-hover:text-red-600">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className={`${isDrawer ? "w-full" : "w-[274px] mx-auto"}`}>
          {enableGifModeToggle && (
            <div className="px-4 py-2">
              <div className="reader-user-popover-toggle flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="flex flex-col">
                  <span className="font-primary text-sm text-gray-800">โหมดแสดง GIF</span>
                  <span className="text-xs text-gray-500">ปิดเพื่อโหลดเฉพาะภาพปกนิ่ง</span>
                </div>
                <Switch
                  size="small"
                  checked={isGifModeEnabled}
                  onChange={onGifModeChange}
                  style={{ backgroundColor: isGifModeEnabled ? "#E31C3D" : undefined }}
                />
              </div>
            </div>
          )}

          <div className="reader-user-popover-divider my-2 h-[1px] bg-gray-200 w-full" />
          
          {onClearCache && (
            <button
              type="button"
              onClick={onClearCache}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-all duration-200 hover:bg-gray-100"
            >
              <RefreshCw className="h-5 w-5 shrink-0 text-gray-500" />
              <span className="font-primary w-full text-gray-700">ล้างแคช</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="reader-user-popover-logout flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-all duration-200 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 shrink-0 text-red-600" />
            <span className="font-primary w-full text-red-600">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
