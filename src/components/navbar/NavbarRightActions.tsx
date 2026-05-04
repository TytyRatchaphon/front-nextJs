"use client";

import type { ReactNode } from "react";

import NavbarCartTrigger from "./NavbarCartTrigger";
import NavbarNotificationTrigger from "./NavbarNotificationTrigger";
import NavbarSearchLink from "./NavbarSearchLink";
import NavbarUserTrigger from "./NavbarUserTrigger";

type NavbarRightActionsProps = {
  isLoggedIn: boolean;
  hasUser: boolean;
  cartItemCount: number;
  isCartOpen: boolean;
  onCartOpenChange: (open: boolean) => void;
  isMobileViewport: boolean;
  unreadCount: number;
  isNotificationOpen: boolean;
  onNotificationOpenChange: (open: boolean) => void;
  onOpenMobileNotification: () => void;
  userFullname: string;
  hasRankRewardNotification: boolean;
  userMenuContent: ReactNode;
  isUserMenuOpen: boolean;
  onUserMenuOpenChange: (open: boolean) => void;
  onOpenMobileUserDrawer: () => void;
};

export default function NavbarRightActions({
  isLoggedIn,
  hasUser,
  cartItemCount,
  isCartOpen,
  onCartOpenChange,
  isMobileViewport,
  unreadCount,
  isNotificationOpen,
  onNotificationOpenChange,
  onOpenMobileNotification,
  userFullname,
  hasRankRewardNotification,
  userMenuContent,
  isUserMenuOpen,
  onUserMenuOpenChange,
  onOpenMobileUserDrawer,
}: NavbarRightActionsProps) {
  return (
    <div className="flex flex-row gap-x-4 items-center">
      <NavbarSearchLink />
      <NavbarCartTrigger
        isLoggedIn={isLoggedIn}
        cartItemCount={cartItemCount}
        isOpen={isCartOpen}
        onOpenChange={onCartOpenChange}
      />
      <NavbarNotificationTrigger
        isLoggedIn={isLoggedIn}
        hasUser={hasUser}
        isMobileViewport={isMobileViewport}
        unreadCount={unreadCount}
        isOpen={isNotificationOpen}
        onOpenChange={onNotificationOpenChange}
        onOpenMobile={onOpenMobileNotification}
      />
      <NavbarUserTrigger
        isLoggedIn={isLoggedIn}
        hasUser={hasUser}
        userFullname={userFullname}
        hasRankRewardNotification={hasRankRewardNotification}
        userMenuContent={userMenuContent}
        isOpen={isUserMenuOpen}
        onOpenChange={onUserMenuOpenChange}
        onOpenMobile={onOpenMobileUserDrawer}
      />
    </div>
  );
}
