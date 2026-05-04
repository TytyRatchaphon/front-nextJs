"use client";

import * as React from "react";

import { readGifModePreference, writeGifModePreference } from "@/utils/gifPreference";

type NotificationApi = {
  success: (config: {
    message: string;
    description: string;
    placement: "topRight";
  }) => void;
};

export function useNavbarGifMode(api: NotificationApi) {
  const [isGifModeEnabled, setIsGifModeEnabled] = React.useState(true);

  React.useEffect(() => {
    setIsGifModeEnabled(readGifModePreference(true));
  }, []);

  const handleToggleGifMode = (enabled: boolean) => {
    setIsGifModeEnabled(enabled);
    writeGifModePreference(enabled);
    api.success({
      message: enabled ? "เปิดโหมดแสดง GIF แล้ว" : "ปิดโหมดแสดง GIF แล้ว",
      description: enabled ? "ระบบจะแสดงภาพเคลื่อนไหวตามปกติ" : "ระบบจะพยายามแสดงภาพปกแบบนิ่งแทน GIF",
      placement: "topRight",
    });

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        window.location.reload();
      }, 180);
    }
  };

  return {
    isGifModeEnabled,
    handleToggleGifMode,
  };
}
