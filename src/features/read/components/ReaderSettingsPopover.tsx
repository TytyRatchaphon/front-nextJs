"use client";

import { useCallback, useMemo } from "react";
import { ConfigProvider, Popover, Select, Slider, Switch } from "antd";

type ReaderSettingsPopoverProps = {
  zIndex: number;
  currentBg: any;
  fontSize: number;
  setFontSize: (updater: (prev: number) => number) => void;
  fontFamily: string;
  setFontFamily: (fontFamily: string) => void;
  bgColor: string;
  setBgColor: (bgColor: string) => void;
    textColorKey: string;
  setTextColorKey: (key: string) => void;
  themeTextColors: Record<string, { key: string; label: string; hex: string }[]>;
  isBold: boolean;
  setIsBold: (enabled: boolean) => void;
  textAlign: "left" | "center" | "justify";
  setTextAlign: (align: "left" | "center" | "justify") => void;
  isAutoScroll: boolean;
  setIsAutoScroll: (enabled: boolean) => void;
  scrollSpeed: number;
  setScrollSpeed: (speed: number) => void;
  fontFamilies: Array<{ key: string; label: string; family: string }>;
  bgColors: Array<{ key: string; label: string; bg: string; border: string }>;
  readerDefaultFontKey: string;
  hasReaderObfuscationConfig: boolean;
  showTrackedParagraphLabel: boolean;
  setShowTrackedParagraphLabel: (enabled: boolean) => void;
  showTrackedParagraphArrow: boolean;
  setShowTrackedParagraphArrow: (enabled: boolean) => void;
};

export function getReaderMenuTheme(currentBgKey?: string) {
  if (currentBgKey === "dark") {
    return {
      panelBg: "#1a1a1a",
      panelBorder: "#333333",
      text: "#9ca3af",
      muted: "#6b7280",
      hoverBg: "hover:bg-white/5",
      activeBg: "#2b2224",
      activeText: "#fca5a5",
      subtleBg: "#242426",
    };
  }

  if (currentBgKey === "sepia") {
    return {
      panelBg: "#f4efe3",
      panelBorder: "#e6dbc4",
      text: "#5b4636",
      muted: "#8b735c",
      hoverBg: "hover:bg-[#ede5d5]",
      activeBg: "#efe2d0",
      activeText: "#8c2f39",
      subtleBg: "#efe6d6",
    };
  }

  return {
    panelBg: "#ffffff",
    panelBorder: "#e5e7eb",
    text: "#1f2937",
    muted: "#6b7280",
    hoverBg: "hover:bg-gray-50",
    activeBg: "#fef2f2",
    activeText: "#dc2626",
    subtleBg: "#f3f4f6",
  };
}

const textAlignOptions = [
  { key: "left", label: "ชิดซ้าย" },
  { key: "center", label: "กึ่งกลาง" },
  { key: "justify", label: "เต็มบรรทัด" },
] as const;

export function ReaderSettingsPopover({
  zIndex,
  currentBg,
  fontSize: _fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  bgColor,
  setBgColor,
  textColorKey,
  setTextColorKey,
  themeTextColors,
  isBold,
  setIsBold,
  textAlign,
  setTextAlign,
  isAutoScroll,
  setIsAutoScroll,
  scrollSpeed,
  setScrollSpeed,
  fontFamilies,
  bgColors,
  readerDefaultFontKey,
  hasReaderObfuscationConfig,
  showTrackedParagraphLabel,
  setShowTrackedParagraphLabel,
  showTrackedParagraphArrow,
  setShowTrackedParagraphArrow,
}: ReaderSettingsPopoverProps) {
  const readerMenuTheme = useMemo(() => getReaderMenuTheme(currentBg?.key), [currentBg?.key]);

  
  const validTextColors = themeTextColors?.[currentBg?.key || "white"] || themeTextColors?.white || [];
  const activeTextHex = validTextColors.find((t: any) => t.key === textColorKey)?.hex || validTextColors[0]?.hex || "#000000";

  const fontFamilyOptions = useMemo(
    () => fontFamilies.map((font) => ({
      value: font.key,
      label: (
        <span style={hasReaderObfuscationConfig ? undefined : { fontFamily: font.family }}>
          ฟอนต์ {font.label}
        </span>
      ),
    })),
    [fontFamilies, hasReaderObfuscationConfig],
  );

  const resetReaderSettings = useCallback(() => {
    setFontSize(() => 20);
    setFontFamily(readerDefaultFontKey);
    setBgColor("sepia");
    setTextColorKey("");
    setIsBold(false);
    setTextAlign("left");
    setIsAutoScroll(false);
    setScrollSpeed(0.3);
    setShowTrackedParagraphLabel(true);
    setShowTrackedParagraphArrow(true);
  }, [
    readerDefaultFontKey,
    setTextColorKey,
    setBgColor,
    setFontFamily,
    setFontSize,
    setIsAutoScroll,
    setIsBold,
    setScrollSpeed,
    setShowTrackedParagraphArrow,
    setShowTrackedParagraphLabel,
    setTextAlign,
  ]);

  return (
    <Popover
      placement="bottomRight"
      zIndex={zIndex}
      getPopupContainer={(triggerNode) => (triggerNode ? (triggerNode.parentElement as HTMLElement) : document.body)}
      classNames={{ root: "reader-settings-popover" }}
      styles={{ body: { padding: 0 } }}
      content={
        <div
          className="reader-settings-panel w-72 flex flex-col gap-4 p-1"
          style={{ backgroundColor: readerMenuTheme.panelBg, color: readerMenuTheme.text, overscrollBehavior: "contain" }}
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className="reader-settings-title flex items-center justify-between border-b px-3 pt-3 pb-2"
            style={{ borderBottomColor: readerMenuTheme.panelBorder, color: readerMenuTheme.text }}
          >
            <span className="text-base font-semibold">ตั้งค่าการอ่าน</span>
            <button onClick={resetReaderSettings} className="text-xs !text-red-500 !hover:text-red-700 font-medium cursor-pointer">
              ค่าเริ่มต้น
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 px-3">
            {textAlignOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTextAlign(key)}
                title={label}
                aria-label={label}
                className="reader-settings-neutral-button flex min-h-[48px] items-center justify-center rounded border px-2 py-2 transition-all"
                style={{
                  borderColor: textAlign === key ? "#E31C3D" : readerMenuTheme.panelBorder,
                  backgroundColor: textAlign === key ? readerMenuTheme.activeBg : readerMenuTheme.subtleBg,
                  color: textAlign === key ? readerMenuTheme.activeText : readerMenuTheme.text,
                  boxShadow: textAlign === key ? "inset 0 0 0 1px rgba(227,28,61,0.12)" : "none",
                }}
              >
                {key === "left" && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M4 6h16M4 12h10M4 18h16" /></svg>}
                {key === "center" && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M4 6h16M7 12h10M4 18h16" /></svg>}
                {key === "justify" && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M4 6h16M4 12h16M4 18h16" /></svg>}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 px-3">
            <button
              onClick={() => setFontSize((prev) => Math.max(12, prev - 2))}
              className="reader-settings-neutral-button flex items-center justify-center p-2 rounded border active:scale-95 transition-transform"
              style={{ borderColor: readerMenuTheme.panelBorder, backgroundColor: readerMenuTheme.subtleBg, color: readerMenuTheme.text }}
            >
              <span className="text-sm">A-</span>
            </button>
            <button
              onClick={() => setFontSize((prev) => Math.min(64, prev + 2))}
              className="reader-settings-neutral-button flex items-center justify-center p-2 rounded border active:scale-95 transition-transform"
              style={{ borderColor: readerMenuTheme.panelBorder, backgroundColor: readerMenuTheme.subtleBg, color: readerMenuTheme.text }}
            >
              <span className="text-lg">A+</span>
            </button>
          </div>

          <div
            className="reader-settings-card mx-3 flex flex-col gap-2 p-3 rounded-lg border"
            style={{ backgroundColor: readerMenuTheme.subtleBg, borderColor: readerMenuTheme.panelBorder }}
          >
            <div className="flex items-center justify-between">
              <span className="reader-settings-label text-sm font-medium" style={{ color: readerMenuTheme.text }}>เลื่อนอัตโนมัติ</span>
              <Switch checked={isAutoScroll} onChange={setIsAutoScroll} size="small" className="bg-gray-300" style={{ backgroundColor: isAutoScroll ? "#E31C3D" : undefined }} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">🐢</span>
              <div className="flex-1">
                <ConfigProvider theme={{ components: { Slider: { colorPrimary: "#E31C3D", handleColor: "#E31C3D", trackBg: "#E31C3D", handleActiveColor: "#C41230" } } }}>
                  <Slider min={0.1} max={2.0} step={0.1} value={scrollSpeed} onChange={setScrollSpeed} tooltip={{ open: false }} />
                </ConfigProvider>
              </div>
              <span className="text-lg">🐇</span>
            </div>
          </div>

          <div className="px-3">
            <Select
              value={fontFamily}
              onChange={setFontFamily}
              style={{ width: "100%" }}
              options={fontFamilyOptions}
              className="reader-settings-select h-10"
              popupClassName="reader-font-select-dropdown"
              getPopupContainer={(triggerNode) => (triggerNode ? (triggerNode.parentElement as HTMLElement) : document.body)}
            />
          </div>

          <div className="mt-1 flex items-center justify-center gap-4 px-3">
            {bgColors.map((bg) => (
              <button key={bg.key} onClick={() => setBgColor(bg.key)} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${bg.key === bgColor ? "border-[#E31C3D] scale-110" : "border-transparent hover:scale-105"}`} title={bg.label}>
                <div className={`w-8 h-8 rounded-full border ${bg.bg} ${bg.border !== "transparent" ? "border shadow-sm" : ""}`} style={{ borderColor: bg.border }} />
              </button>
            ))}
          </div>

                    <div className="flex items-center justify-between px-4 mt-2 mb-1">
            <span className="reader-settings-label text-sm" style={{ color: readerMenuTheme.muted }}>สีตัวอักษร</span>
            <div className="flex items-center gap-2">
              {(themeTextColors[bgColor] || themeTextColors.white).map((t) => {
                const isSelected = t.key === textColorKey || (!textColorKey && t.key === (themeTextColors[bgColor] || themeTextColors.white)[0].key);
                return (
                  <button
                    key={t.key}
                    onClick={() => setTextColorKey(t.key)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-[#E31C3D] scale-110" : "border-transparent hover:scale-105"}`}
                    title={t.label}
                  >
                    <div className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: t.hex }} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between px-4">
            <span className="reader-settings-label text-sm" style={{ color: readerMenuTheme.muted }}>ตัวหนา</span>
            <Switch checked={isBold} onChange={setIsBold} size="small" style={{ backgroundColor: isBold ? "#E31C3D" : undefined }} />
          </div>
          <div className="flex items-center justify-between px-4">
            <span className="reader-settings-label text-sm" style={{ color: readerMenuTheme.muted }}>แสดงย่อหน้า</span>
            <Switch checked={showTrackedParagraphLabel} onChange={setShowTrackedParagraphLabel} size="small" style={{ backgroundColor: showTrackedParagraphLabel ? "#E31C3D" : undefined }} />
          </div>
          <div className="flex items-center justify-between px-4 pb-3">
            <span className="reader-settings-label text-sm" style={{ color: readerMenuTheme.muted }}>แสดง &gt;</span>
            <Switch checked={showTrackedParagraphArrow} onChange={setShowTrackedParagraphArrow} size="small" style={{ backgroundColor: showTrackedParagraphArrow ? "#E31C3D" : undefined }} />
          </div>
        </div>
      }
      trigger="click"
    >
      <div className="flex items-center gap-2 cursor-pointer">
        <span className={`text-sm font-semibold ${currentBg?.key === "dark" ? "text-[#9ca3af]" : "text-gray-600"}`}>ตั้งค่าการอ่าน</span>
        <button className={`p-2 rounded-full transition-colors font-serif font-bold text-lg flex items-center justify-center w-10 h-10 ${currentBg?.text} ${currentBg?.key === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"}`} title="ตั้งค่าการอ่าน" style={{ color: activeTextHex }}>
          Aa
        </button>
      </div>
    </Popover>
  );
}
