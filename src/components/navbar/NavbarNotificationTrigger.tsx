"use client";

import { Popover } from "antd";

import NotificationList from "./NotificationList";
import { formatNavbarNotificationBadgeCount } from "./hooks/useNavbarNotifications";

type NavbarNotificationTriggerProps = {
  isLoggedIn: boolean;
  hasUser: boolean;
  isMobileViewport: boolean;
  unreadCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenMobile: () => void;
};

function BellIconWithBadge({ unreadCount }: { unreadCount: number }) {
  return (
    <div className="relative">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12.02 2.91016C8.70997 2.91016 6.01997 5.60016 6.01997 8.91016V11.8002C6.01997 12.4102 5.75997 13.3402 5.44997 13.8602L4.29997 15.7702C3.58997 16.9502 4.07997 18.2602 5.37997 18.7002C9.68997 20.1402 14.34 20.1402 18.65 18.7002C19.86 18.3002 20.39 16.8702 19.73 15.7702L18.58 13.8602C18.28 13.3402 18.02 12.4102 18.02 11.8002V8.91016C18.02 5.61016 15.32 2.91016 12.02 2.91016Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" />
        <path d="M13.87 3.19994C13.56 3.10994 13.24 3.03994 12.91 2.99994C11.95 2.87994 11.03 2.94994 10.17 3.19994C10.46 2.45994 11.18 1.93994 12.02 1.93994C12.86 1.93994 13.58 2.45994 13.87 3.19994Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.02 19.0601C15.02 20.7101 13.67 22.0601 12.02 22.0601C11.2 22.0601 10.44 21.7201 9.90002 21.1801C9.36002 20.6401 9.02002 19.8801 9.02002 19.0601" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white ring-2 ring-white">
          {formatNavbarNotificationBadgeCount(unreadCount)}
        </span>
      )}
    </div>
  );
}

export default function NavbarNotificationTrigger({
  isLoggedIn,
  hasUser,
  isMobileViewport,
  unreadCount,
  isOpen,
  onOpenChange,
  onOpenMobile,
}: NavbarNotificationTriggerProps) {
  if (!isLoggedIn || !hasUser) return null;

  if (isMobileViewport) {
    return (
      <button
        type="button"
        onClick={onOpenMobile}
        className="mr-2 lg:mr-0 text-black hover:text-red-600 transition-colors duration-300 cursor-pointer relative"
      >
        <BellIconWithBadge unreadCount={unreadCount} />
      </button>
    );
  }

  return (
    <Popover
      content={<NotificationList onClose={() => onOpenChange(false)} />}
      trigger="click"
      placement="bottom"
      open={isOpen}
      onOpenChange={onOpenChange}
      arrow={false}
      classNames={{ root: "reader-notification-popover" }}
      styles={{ body: { padding: 0 } }}
      zIndex={1220}
    >
      <span className="mr-2 lg:mr-0 text-black hover:text-red-600 transition-colors duration-300 cursor-pointer relative">
        <BellIconWithBadge unreadCount={unreadCount} />
      </span>
    </Popover>
  );
}
