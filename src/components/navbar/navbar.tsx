"use client";
import * as React from "react";

import { App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { useLineLogin } from '@/hooks/useLineLogin';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import '@/assets/images/icon.png';
import SmartAppBanner from '@/components/utility/SmartAppBanner';
import { useNavbarNotifications } from './hooks/useNavbarNotifications';
import { useNavbarRankRewards } from './hooks/useNavbarRankRewards';
import { useNavbarData } from './hooks/useNavbarData';
import { useNavbarGifMode } from './hooks/useNavbarGifMode';
import { useNavbarLifecycle } from './hooks/useNavbarLifecycle';
import UserMenuPopover from './UserMenuPopover';
import type { NavbarNovelContentType } from './NovelCategoryMenus';
import MobileNavDrawer from './MobileNavDrawer';
import NavbarLogo from './NavbarLogo';
import DesktopNavMenu from './DesktopNavMenu';
import NavbarRightActions from './NavbarRightActions';
import NavbarUserDrawer from './NavbarUserDrawer';
import NavbarNotificationDrawer from './NavbarNotificationDrawer';
import { getMobileSectionLabel } from './navbarNavigationUtils';



function Navbar() {
  const { user, isLoggedIn, hasMounted, logout, setMounted, token } = useAuthStore();
  const { initLIFF } = useLineLogin();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [isMobileNotificationOpen, setIsMobileNotificationOpen] = React.useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
  const [openMobileNovelType, setOpenMobileNovelType] = React.useState<NavbarNovelContentType | null>(null);
  const ENABLE_GIF_MODE_TOGGLE = true;
  const { settings } = useWebsiteSettings();

  const { notification: api } = App.useApp();
  const queryClient = useQueryClient();
  const { isMobileViewport } = useNavbarLifecycle({ setMounted, initLIFF });
  const { isGifModeEnabled, handleToggleGifMode } = useNavbarGifMode(api);
  const { unreadCount } = useNavbarNotifications({ isLoggedIn, user });
  const {
    promotingGroups,
    translatedNovelCategories,
    isLoadingTranslatedNovelCategories,
    fictionNovelCategories,
    isLoadingFictionNovelCategories,
    cartItemCount,
  } = useNavbarData(isLoggedIn);

  const navigateToRankRewards = React.useCallback(() => {
    setIsUserMenuOpen(false);
    setIsMobileDrawerOpen(false);
    const targetPath = `/mprofile?openRankShowcase=1&rankRefreshTs=${Date.now()}`;
    if (pathname === '/mprofile') {
      router.replace(targetPath, { scroll: false });
      return;
    }
    router.push(targetPath);
  }, [pathname, router]);
  const {
    currentRank,
    hasRankRewardNotification,
    rpValue,
  } = useNavbarRankRewards({
    isLoggedIn,
    token,
    user,
    onNavigateToRankRewards: navigateToRankRewards,
  });

  const avatarSrc = user?.img ?? user?.profileImage ?? null;
  const userFrameImage = user?.frame?.img ?? null;
  const userFullname = user?.fullname || 'User';

  const closeMobileNavDrawer = () => {
    setIsMobileMenuOpen(false);
    setOpenMobileNovelType(null);
  };

  const mobileSectionLabel = React.useMemo(() => getMobileSectionLabel(pathname), [pathname]);

  const handleLogout = React.useCallback(() => {
    logout();
    queryClient.clear();
    router.push('/');
    setIsUserMenuOpen(false);
    setIsMobileDrawerOpen(false);
    api.success({
      message: 'ออกจากระบบสำเร็จ',
      description: 'คุณได้ออกจากระบบเรียบร้อยแล้ว',
      placement: 'topRight',
    });
  }, [api, logout, queryClient, router]);

  const handleClearCache = React.useCallback(() => {
    queryClient.clear();
    setIsUserMenuOpen(false);
    setIsMobileDrawerOpen(false);
    api.success({
      message: 'ล้างแคชสำเร็จ',
      description: 'เคลียร์ข้อมูลที่ค้างอยู่ในระบบเรียบร้อยแล้ว',
      placement: 'topRight',
    });
    // Optional: window.location.reload() if you want a full fresh state
  }, [api, queryClient]);

  const userMenuProps = {
    avatarSrc,
    currentRank,
    enableGifModeToggle: ENABLE_GIF_MODE_TOGGLE,
    hasRankRewardNotification,
    isGifModeEnabled,
    onGifModeChange: handleToggleGifMode,
    onLogout: handleLogout,
    onClearCache: handleClearCache,
    rpIconSrc: settings?.rp,
    rpValue,
    user,
    userFrameImage,
    userFullname,
  };

  const userMenuContent = (
    <UserMenuPopover {...userMenuProps} onClose={() => setIsUserMenuOpen(false)} variant="popover" />
  );

  // Prevent hydration mismatch
  if (!hasMounted) {
    return null;
  }

  return (
    <>
      <span className="hidden" aria-hidden="true">{mobileSectionLabel}</span>
      <SmartAppBanner />
      <div id="GlobalNavbarWrapper" className="sticky top-0 z-[1200] w-full flex flex-col">
        <div
        className="select-none flex justify-center items-center h-[60px] lg:h-[80px] header bg-white text-gray-700 shadow-sm w-full"
        id="Navbar"
        style={{
          backgroundImage: "url('https://img.enjoybook.co/img/')",
          backgroundSize: "auto",
          backgroundPosition: "center bottom",
          backgroundRepeat: "repeat-x",
          alignItems: "center"
        }}
      >
        <div className="flex flex-row items-center justify-between px-4 md:px-5 lg:px-0 gap-3 max-w-[1200px] w-full h-full">
          <NavbarLogo
            logoSrc={settings?.logo}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          <DesktopNavMenu
            pathname={pathname}
            promotingGroups={promotingGroups}
            translatedNovelCategories={translatedNovelCategories}
            isLoadingTranslatedNovelCategories={isLoadingTranslatedNovelCategories}
            fictionNovelCategories={fictionNovelCategories}
            isLoadingFictionNovelCategories={isLoadingFictionNovelCategories}
          />
          <NavbarRightActions
              isLoggedIn={isLoggedIn}
              hasUser={Boolean(user)}
              cartItemCount={cartItemCount}
              isCartOpen={isCartOpen}
              onCartOpenChange={setIsCartOpen}
              isMobileViewport={isMobileViewport}
              unreadCount={unreadCount}
              isNotificationOpen={isNotificationOpen}
              onNotificationOpenChange={setIsNotificationOpen}
              onOpenMobileNotification={() => setIsMobileNotificationOpen(true)}
              userFullname={userFullname}
              hasRankRewardNotification={hasRankRewardNotification}
              userMenuContent={userMenuContent}
              isUserMenuOpen={isUserMenuOpen}
              onUserMenuOpenChange={setIsUserMenuOpen}
              onOpenMobileUserDrawer={() => setIsMobileDrawerOpen(true)}
          />
        </div>
      </div>

      <MobileNavDrawer
        open={isMobileMenuOpen}
        onClose={closeMobileNavDrawer}
        logoSrc={settings?.logo}
        pathname={pathname}
        promotingGroups={promotingGroups}
        translatedNovelCategories={translatedNovelCategories}
        isLoadingTranslatedNovelCategories={isLoadingTranslatedNovelCategories}
        fictionNovelCategories={fictionNovelCategories}
        isLoadingFictionNovelCategories={isLoadingFictionNovelCategories}
        openMobileNovelType={openMobileNovelType}
        onNovelTypeChange={setOpenMobileNovelType}
      />
      </div>
      <NavbarUserDrawer
        open={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        {...userMenuProps}
      />
      <NavbarNotificationDrawer
        open={isMobileNotificationOpen}
        onClose={() => setIsMobileNotificationOpen(false)}
      />
    </>
  );
}

export default Navbar;
