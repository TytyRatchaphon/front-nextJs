"use client";

import { Drawer } from "antd";

import NotificationList from "./NotificationList";

type NavbarNotificationDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function NavbarNotificationDrawer({
  open,
  onClose,
}: NavbarNotificationDrawerProps) {
  return (
    <Drawer
      placement="right"
      closable={true}
      onClose={onClose}
      open={open}
      key="mobile-notification-drawer"
      styles={{ body: { padding: 0 } }}
      width="100vw"
      zIndex={1320}
    >
      <NotificationList mode="drawer" onClose={onClose} />
    </Drawer>
  );
}
