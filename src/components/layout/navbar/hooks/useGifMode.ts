"use client";
import { useState, useEffect, useCallback } from "react";
import { App } from "antd";
import { readGifModePreference, writeGifModePreference } from "@/utils/gifPreference";

export function useGifMode() {
  const [isGifModeEnabled, setIsGifModeEnabled] = useState(true);
  const { notification: api } = App.useApp();

  useEffect(() => {
    setIsGifModeEnabled(readGifModePreference(true));
  }, []);

  const handleToggleGifMode = useCallback((enabled: boolean) => {
    setIsGifModeEnabled(enabled);
    writeGifModePreference(enabled);
    api.success({
      message: enabled ? 'เปิดโหมดแสดง GIF แล้ว' : 'ปิดโหมดแสดง GIF แล้ว',
      description: enabled ? 'ระบบจะแสดงภาพเคลื่อนไหวตามปกติ' : 'ระบบจะพยายามแสดงภาพปกแบบนิ่งแทน GIF',
      placement: 'topRight',
    });

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        window.location.reload();
      }, 180);
    }
  }, [api]);

  return { isGifModeEnabled, handleToggleGifMode };
}
