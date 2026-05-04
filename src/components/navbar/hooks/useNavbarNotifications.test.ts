import { describe, expect, it } from "vitest";

import {
  formatNavbarNotificationBadgeCount,
  getNavbarUnreadNotificationCount,
} from "./useNavbarNotifications";
import type { NotificationData } from "@/services/api/miscApi";

const createNotification = (readed: "Y" | "N"): NotificationData => ({
  id: Math.random(),
  user_id: 1,
  noti_type_id: 1,
  create_at: "2026-04-28T00:00:00.000Z",
  update_at: "2026-04-28T00:00:00.000Z",
  readed,
  NotiType: {
    noti_type_id: 1,
    category: "system",
    type: "system",
    title: "System",
    subtitle: "System notification",
    status: "active",
    create_at: "2026-04-28T00:00:00.000Z",
  },
});

describe("getNavbarUnreadNotificationCount", () => {
  it("counts only unread navbar notifications", () => {
    expect(getNavbarUnreadNotificationCount([
      createNotification("N"),
      createNotification("Y"),
      createNotification("N"),
    ])).toBe(2);
  });

  it("returns zero for an empty notification list", () => {
    expect(getNavbarUnreadNotificationCount([])).toBe(0);
  });
});

describe("formatNavbarNotificationBadgeCount", () => {
  it("shows the exact count up to 9", () => {
    expect(formatNavbarNotificationBadgeCount(0)).toBe("0");
    expect(formatNavbarNotificationBadgeCount(5)).toBe("5");
    expect(formatNavbarNotificationBadgeCount(9)).toBe("9");
  });

  it("caps double-digit counts as 9+", () => {
    expect(formatNavbarNotificationBadgeCount(10)).toBe("9+");
    expect(formatNavbarNotificationBadgeCount(25)).toBe("9+");
  });
});
