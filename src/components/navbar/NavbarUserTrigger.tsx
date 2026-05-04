"use client";

import type { ReactNode } from "react";
import { Popover } from "antd";

import LoginButtonHeader from "./LoginButtonHeader";

type NavbarUserTriggerProps = {
  isLoggedIn: boolean;
  hasUser: boolean;
  userFullname: string;
  hasRankRewardNotification: boolean;
  userMenuContent: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenMobile: () => void;
};

export default function NavbarUserTrigger({
  isLoggedIn,
  hasUser,
  userFullname,
  hasRankRewardNotification,
  userMenuContent,
  isOpen,
  onOpenChange,
  onOpenMobile,
}: NavbarUserTriggerProps) {
  return (
    <div className="text-nowrap text-[15px] lg:text-[17px] leading-6 flex justify-end items-center cursor-pointer">
      {isLoggedIn && hasUser ? (
        <>
          <div className="hidden lg:block">
            <Popover
              content={userMenuContent}
              placement="bottomRight"
              trigger="click"
              open={isOpen}
              onOpenChange={onOpenChange}
              classNames={{ root: "reader-user-popover" }}
              styles={{ body: { padding: 0 } }}
              zIndex={1220}
            >
              <div id="UserProfileDropdownDesktop" className="relative flex items-center gap-2 px-2 lg:px-4 py-2 border-2 border-transparent hover:bg-gray-200 transition-colors duration-300 lg:border-gray-800 rounded-full h-[48px] outline-none">
                {hasRankRewardNotification && (
                  <span className="pointer-events-none absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
                <span className="font-primary font-medium text-gray-800">
                  {userFullname || "User"}
                </span>
              </div>
            </Popover>
          </div>

          <div className="block lg:hidden">
            <div
              id="UserProfileDropdownMobile"
              className="relative flex items-center gap-2 px-2 py-2 border-2 border-transparent hover:bg-gray-200 transition-colors duration-300 rounded-full h-[48px] outline-none"
              onClick={onOpenMobile}
            >
              {hasRankRewardNotification && (
                <span className="pointer-events-none absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[24px] h-[24px]">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.5901 22C20.5901 18.13 16.7402 15 12.0002 15C7.26015 15 3.41016 18.13 3.41016 22" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </>
      ) : (
        <LoginButtonHeader />
      )}
    </div>
  );
}
