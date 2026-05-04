"use client";

import { useEffect, useState } from "react";

import { readGifModePreference } from "@/utils/gifPreference";

export const useGifPreference = (defaultValue = true): boolean => {
  const [showGif, setShowGif] = useState(defaultValue);

  useEffect(() => {
    setShowGif(readGifModePreference(defaultValue));
  }, [defaultValue]);

  return showGif;
};
