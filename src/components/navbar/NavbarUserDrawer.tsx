"use client";

import { Drawer } from "antd";

import type { RankItem } from "@/services/api/userApi";
import UserMenuPopover from "./UserMenuPopover";

type NavbarUser = {
  coin?: number | string | null;
  freecoin?: number | string | null;
  fast_ticket?: number | string | null;
  stamp?: number | string | null;
};

type NavbarUserDrawerProps = {
  open: boolean;
  onClose: () => void;
  avatarSrc: string | null;
  currentRank: RankItem | null;
  enableGifModeToggle: boolean;
  hasRankRewardNotification: boolean;
  isGifModeEnabled: boolean;
  onGifModeChange: (enabled: boolean) => void;
  onLogout: () => void;
  onClearCache?: () => void;
  rpIconSrc?: string | null;
  rpValue: number;
  user: NavbarUser | null | undefined;
  userFrameImage: string | null;
  userFullname: string;
};

export default function NavbarUserDrawer({
  open,
  onClose,
  avatarSrc,
  currentRank,
  enableGifModeToggle,
  hasRankRewardNotification,
  isGifModeEnabled,
  onGifModeChange,
  onLogout,
  onClearCache,
  rpIconSrc,
  rpValue,
  user,
  userFrameImage,
  userFullname,
}: NavbarUserDrawerProps) {
  return (
    <Drawer
      placement="right"
      closable={true}
      onClose={onClose}
      open={open}
      key="mobile-user-drawer"
      styles={{ body: { padding: 0 } }}
      width="100vw"
      zIndex={1320}
      rootClassName="reader-user-popover reader-user-drawer"
    >
      <UserMenuPopover
        avatarSrc={avatarSrc}
        currentRank={currentRank}
        enableGifModeToggle={enableGifModeToggle}
        hasRankRewardNotification={hasRankRewardNotification}
        isGifModeEnabled={isGifModeEnabled}
        onClose={onClose}
        onGifModeChange={onGifModeChange}
        onLogout={onLogout}
        onClearCache={onClearCache}
        rpIconSrc={rpIconSrc}
        rpValue={rpValue}
        user={user}
        userFrameImage={userFrameImage}
        userFullname={userFullname}
        variant="drawer"
      />
    </Drawer>
  );
}
