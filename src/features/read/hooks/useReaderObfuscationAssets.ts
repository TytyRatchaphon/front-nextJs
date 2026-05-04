import { useEffect, useMemo, useState, type RefObject } from "react";
import {
  useReadingTheme,
  type ReadingThemeFontOption,
} from "@/hooks/reader/useReadingTheme";
import {
  READER_OBFUSCATION_CSS_ID,
  READER_OBFUSCATION_CSS_PRELOAD_ID,
  READER_PREFERRED_DEFAULT_FONT_KEYS,
  READER_SAFE_OBFUSCATION_FONT_KEYS,
  READER_TEMP_DISABLED_FONT_KEYS,
  normalizeReaderConfigFont,
  type ReaderConfigFont,
  type ReaderConfigPayload,
} from "../readerContentUtils";
import {
  resolveReaderAssetUrl,
  resolveReaderCssUrl,
} from "../readerAssetUtils";

type UseReaderObfuscationAssetsParams = {
  contentRef: RefObject<HTMLElement | null>;
  episodeId: string;
  episode: unknown;
};

export function useReaderObfuscationAssets({
  contentRef,
  episodeId,
  episode,
}: UseReaderObfuscationAssetsParams) {
  const readerConfig = useMemo<ReaderConfigPayload | null>(() => {
    const config = (episode as any)?.readerConfig;
    if (!config || typeof config !== "object") return null;
    return config as ReaderConfigPayload;
  }, [episode]);

  const normalizedReaderFonts = useMemo<ReaderConfigFont[]>(() => {
    if (!Array.isArray(readerConfig?.fonts)) return [];

    const uniqueByKey = new Map<string, ReaderConfigFont>();
    readerConfig.fonts.forEach((item) => {
      const normalized = normalizeReaderConfigFont(item);
      if (!normalized) return;
      if (READER_TEMP_DISABLED_FONT_KEYS.includes(normalized.key as (typeof READER_TEMP_DISABLED_FONT_KEYS)[number])) {
        return;
      }
      if (!uniqueByKey.has(normalized.key)) {
        uniqueByKey.set(normalized.key, normalized);
      }
    });

    return Array.from(uniqueByKey.values());
  }, [readerConfig]);

  const readerFontFamilies = useMemo<ReadingThemeFontOption[]>(() => {
    return normalizedReaderFonts.map((font) => ({
      key: font.key,
      label: font.label,
      family: font.fontFamily,
    }));
  }, [normalizedReaderFonts]);

  const readerDefaultFontKey = useMemo(() => {
    if (readerFontFamilies.length === 0) return "sarabun";
    const candidate = readerConfig?.defaultFontKey;
    if (
      typeof candidate === "string"
      && readerFontFamilies.some((font) => font.key === candidate)
      && !READER_TEMP_DISABLED_FONT_KEYS.includes(candidate as (typeof READER_TEMP_DISABLED_FONT_KEYS)[number])
      && READER_SAFE_OBFUSCATION_FONT_KEYS.includes(candidate as (typeof READER_SAFE_OBFUSCATION_FONT_KEYS)[number])
    ) {
      return candidate;
    }

    const preferredDefault = READER_PREFERRED_DEFAULT_FONT_KEYS.find((preferredKey) =>
      readerFontFamilies.some((font) => font.key === preferredKey),
    );
    if (preferredDefault) return preferredDefault;

    const safeFallback = READER_SAFE_OBFUSCATION_FONT_KEYS.find((safeKey) =>
      readerFontFamilies.some((font) => font.key === safeKey),
    );
    if (safeFallback) return safeFallback;

    return readerFontFamilies[0].key;
  }, [readerConfig, readerFontFamilies]);

  const readerAssetCacheVersion = useMemo(() => {
    if (!readerConfig) return episodeId;

    const sharedCharacters = Number.isFinite(readerConfig.sharedCharacters)
      ? String(readerConfig.sharedCharacters)
      : "";
    const defaultFontKey = typeof readerConfig.defaultFontKey === "string"
      ? readerConfig.defaultFontKey.trim().toLowerCase()
      : "";
    const fontSignature = Array.isArray(readerConfig.fonts)
      ? readerConfig.fonts
        .map((font) => {
          const data = font as { key?: unknown; file?: unknown; source?: unknown };
          const key = typeof data.key === "string" ? data.key.trim().toLowerCase() : "";
          const file = typeof data.file === "string" ? data.file.trim() : "";
          const source = typeof data.source === "string" ? data.source.trim() : "";
          if (!key && !file && !source) return "";
          return `${key}:${file || source}`;
        })
        .filter(Boolean)
        .join("|")
      : "";

    return [sharedCharacters, defaultFontKey, fontSignature]
      .filter(Boolean)
      .join(":");
  }, [episodeId, readerConfig]);

  const readerCssHref = useMemo(() => {
    if (!readerConfig?.cssUrl || typeof readerConfig.cssUrl !== "string") return "";
    return resolveReaderCssUrl(readerConfig.cssUrl, readerAssetCacheVersion);
  }, [readerConfig, readerAssetCacheVersion]);

  const hasReaderObfuscationConfig = readerFontFamilies.length > 0 && Boolean(readerCssHref);
  const [isReaderCssReady, setIsReaderCssReady] = useState(false);
  const [isReaderAssetsReady, setIsReaderAssetsReady] = useState(false);

  const readingTheme = useReadingTheme(contentRef, {
    fontFamilies: hasReaderObfuscationConfig ? readerFontFamilies : undefined,
    defaultFontKey: hasReaderObfuscationConfig ? readerDefaultFontKey : undefined,
  });

  const readerFontFileByKey = useMemo(() => {
    const fileByKey = new Map<string, string>();
    normalizedReaderFonts.forEach((font) => {
      if (!font.file) return;
      fileByKey.set(font.key, font.file);
    });
    return fileByKey;
  }, [normalizedReaderFonts]);

  const activeReaderFontFile = useMemo(() => {
    if (readerFontFileByKey.size === 0) return "";
    const selectedKey = typeof readingTheme.fontFamily === "string" && readingTheme.fontFamily.trim().length > 0
      ? readingTheme.fontFamily.trim().toLowerCase()
      : "";
    if (selectedKey && readerFontFileByKey.has(selectedKey)) {
      return readerFontFileByKey.get(selectedKey) || "";
    }
    return readerFontFileByKey.get(readerDefaultFontKey) || "";
  }, [readingTheme.fontFamily, readerDefaultFontKey, readerFontFileByKey]);

  const readerFontAssetHrefs = useMemo(() => {
    if (!activeReaderFontFile) return [];
    const href = resolveReaderAssetUrl(activeReaderFontFile);
    return href ? [href] : [];
  }, [activeReaderFontFile]);

  useEffect(() => {
    const oldNode = document.getElementById(READER_OBFUSCATION_CSS_ID) as HTMLLinkElement | null;
    const oldPreloadNode = document.getElementById(READER_OBFUSCATION_CSS_PRELOAD_ID) as HTMLLinkElement | null;

    if (!readerCssHref) {
      oldNode?.remove();
      oldPreloadNode?.remove();
      setIsReaderCssReady(false);
      return;
    }

    setIsReaderCssReady(false);

    if (oldPreloadNode?.href !== readerCssHref) {
      oldPreloadNode?.remove();
      const preload = document.createElement("link");
      preload.id = READER_OBFUSCATION_CSS_PRELOAD_ID;
      preload.rel = "preload";
      preload.as = "style";
      preload.href = readerCssHref;
      document.head.appendChild(preload);
    }

    if (oldNode?.href === readerCssHref) {
      setIsReaderCssReady(true);
      return;
    }
    oldNode?.remove();

    const link = document.createElement("link");
    link.id = READER_OBFUSCATION_CSS_ID;
    link.rel = "stylesheet";
    link.href = readerCssHref;
    const handleLoad = () => setIsReaderCssReady(true);
    const handleError = () => setIsReaderCssReady(false);
    link.addEventListener("load", handleLoad);
    link.addEventListener("error", handleError);
    document.head.appendChild(link);

    return () => {
      link.removeEventListener("load", handleLoad);
      link.removeEventListener("error", handleError);
      const currentNode = document.getElementById(READER_OBFUSCATION_CSS_ID);
      if (currentNode === link) currentNode.remove();
      const currentPreloadNode = document.getElementById(READER_OBFUSCATION_CSS_PRELOAD_ID);
      if (currentPreloadNode) currentPreloadNode.remove();
    };
  }, [readerCssHref]);

  useEffect(() => {
    if (readerFontAssetHrefs.length === 0) return;

    const createdLinks: HTMLLinkElement[] = [];
    readerFontAssetHrefs.forEach((href) => {
      const existing = document.querySelector(`link[rel="preload"][as="font"][href="${href}"]`) as HTMLLinkElement | null;
      if (existing) return;

      const preload = document.createElement("link");
      preload.rel = "preload";
      preload.as = "font";
      preload.href = href;
      preload.crossOrigin = "anonymous";

      const lowerHref = href.toLowerCase();
      if (lowerHref.endsWith(".woff2")) preload.type = "font/woff2";
      else if (lowerHref.endsWith(".woff")) preload.type = "font/woff";
      else if (lowerHref.endsWith(".ttf")) preload.type = "font/ttf";
      else if (lowerHref.endsWith(".otf")) preload.type = "font/otf";

      document.head.appendChild(preload);
      createdLinks.push(preload);
    });

    return () => {
      createdLinks.forEach((link) => link.remove());
    };
  }, [readerFontAssetHrefs]);

  useEffect(() => {
    if (!hasReaderObfuscationConfig) {
      setIsReaderAssetsReady(true);
      return;
    }

    setIsReaderAssetsReady(false);
    if (!isReaderCssReady) return;

    const activeFontFamily = readingTheme.currentFontFamily?.family
      || readerFontFamilies.find((font) => font.key === readerDefaultFontKey)?.family
      || "";
    if (!activeFontFamily) {
      setIsReaderAssetsReady(true);
      return;
    }

    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setIsReaderAssetsReady(true);
    };

    const loadActiveFont = async () => {
      try {
        const fontApi = (document as any).fonts;
        if (!fontApi?.load) {
          markReady();
          return;
        }

        try {
          await Promise.race([
            fontApi.load(`1em ${activeFontFamily}`),
            new Promise((_, reject) => setTimeout(() => reject(new Error("font-load-timeout")), 2500)),
          ]);
        } catch {
          // best effort
        }

        try {
          await Promise.race([
            fontApi.ready,
            new Promise((resolve) => setTimeout(resolve, 700)),
          ]);
        } catch {
          // ignore
        }
      } finally {
        markReady();
      }
    };

    loadActiveFont();
    return () => {
      cancelled = true;
    };
  }, [
    hasReaderObfuscationConfig,
    isReaderCssReady,
    readingTheme.currentFontFamily?.family,
    readerFontFamilies,
    readerDefaultFontKey,
    episodeId,
  ]);

  return {
    ...readingTheme,
    readerConfig,
    normalizedReaderFonts,
    readerFontFamilies,
    readerDefaultFontKey,
    hasReaderObfuscationConfig,
    isReaderAssetsReady,
  };
}
