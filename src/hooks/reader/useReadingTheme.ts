import { useState, useEffect, useRef } from 'react';

export type ReadingThemeFontOption = {
    key: string;
    label: string;
    family: string;
};

const defaultFontFamilies: ReadingThemeFontOption[] = [
    { key: "sarabun", label: "Sarabun", family: "var(--font-sarabun), sans-serif" },
    { key: "thsarabun", label: "THSarabunNew", family: "THSarabunNew, sans-serif" },
    { key: "mali", label: "Mali", family: "var(--font-mali), cursive" },
    { key: "trirong", label: "Trirong", family: "var(--font-trirong), serif" },
    { key: "maitree", label: "Maitree", family: "var(--font-maitree), serif" },
    { key: "taviraj", label: "Taviraj", family: "var(--font-taviraj), serif" },
    { key: "kodchasan", label: "Kodchasan", family: "var(--font-kodchasan), sans-serif" },
    { key: "chakrapetch", label: "ChakraPetch", family: "var(--font-chakra-petch), sans-serif" },
];

const bgColors = [
    { key: "white", label: "ปกติ", bg: "bg-[#ffffff]", paper: "bg-white", text: "text-gray-800", border: "#e5e7eb", sliderColor: "#e6e6e6" },
    { key: "sepia", label: "ถนอมสายตา", bg: "bg-[#f4efe3]", paper: "bg-[#f4efe3]", text: "text-[#5b4636]", border: "#e6dbc4", sliderColor: "#d3c4a9" },
    { key: "dark", label: "มืด", bg: "bg-[#1a1a1a]", paper: "bg-[#1a1a1a]", text: "text-[#d1d5db]", border: "#333333", sliderColor: "#333333" },
];

type UseReadingThemeOptions = {
    fontFamilies?: ReadingThemeFontOption[];
    defaultFontKey?: string;
};

export function useReadingTheme(
    contentRef: React.RefObject<HTMLElement | null>,
    options?: UseReadingThemeOptions,
) {
    const resolvedFontFamilies = options?.fontFamilies?.length
        ? options.fontFamilies
        : defaultFontFamilies;
    const initialFontKey = resolvedFontFamilies.find((font) => font.key === options?.defaultFontKey)?.key
        || resolvedFontFamilies[0]?.key
        || "sarabun";
    const [fontSize, setFontSize] = useState<number>(20);
    const [fontFamily, setFontFamily] = useState(initialFontKey);
    const [bgColor, setBgColor] = useState("sepia");
    const [isBold, setIsBold] = useState(false);
    const [textAlign, setTextAlign] = useState<"left" | "center" | "justify">("left");
    const [isLoaded, setIsLoaded] = useState(false);

    // Auto Scroll State
    const [isAutoScroll, setIsAutoScroll] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(0.3);
    const scrollAccumulator = useRef(0);

    // Load Theme
    useEffect(() => {
        try {
            const key = "reading_theme_v2";
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed) {
                    if (parsed.bgColor && bgColors.find((b) => b.key === parsed.bgColor)) setBgColor(parsed.bgColor);
                    if (parsed.fontSize && typeof parsed.fontSize === 'number') setFontSize(parsed.fontSize);
                    if (parsed.fontFamily && resolvedFontFamilies.find((ff) => ff.key === parsed.fontFamily)) {
                        setFontFamily(parsed.fontFamily);
                    } else {
                        setFontFamily(initialFontKey);
                    }
                    if (typeof parsed.isBold === 'boolean') setIsBold(parsed.isBold);
                    if (parsed.textAlign && ["left", "center", "justify"].includes(parsed.textAlign)) setTextAlign(parsed.textAlign as any);
                    if (parsed.fontSize && typeof parsed.fontSize === 'string') setFontSize(20);
                } else {
                    setFontFamily(initialFontKey);
                }
            } else {
                setFontFamily(initialFontKey);
            }
        } catch { } finally {
            setIsLoaded(true);
        }
    }, [resolvedFontFamilies, initialFontKey]);

    useEffect(() => {
        if (!resolvedFontFamilies.find((ff) => ff.key === fontFamily)) {
            setFontFamily(initialFontKey);
        }
    }, [fontFamily, resolvedFontFamilies, initialFontKey]);

    // Save Theme
    useEffect(() => {
        if (!isLoaded) return;
        try {
            const key = "reading_theme_v2";
            const payload = { bgColor, fontSize, fontFamily, isBold, textAlign };
            localStorage.setItem(key, JSON.stringify(payload));
        } catch { }
    }, [bgColor, fontSize, fontFamily, isBold, textAlign, isLoaded]);

    // Navbar Style Override
    useEffect(() => {
        const colorMap: Record<string, { bg: string; text: string; border: string }> = {
            white: { bg: "#ffffff", text: "#000000", border: "#e5e7eb" },
            sepia: { bg: "#fdfaee", text: "#000000", border: "#e6dbc4" },
            dark: { bg: "#1c1c1e", text: "#ffffff", border: "#333333" },
        };

        const colors = colorMap[bgColor] ?? colorMap.white;
        const currentBg = bgColors.find(b => b.key === bgColor) || bgColors[0];
        const episodeHoverBg = bgColor === 'dark'
            ? 'rgba(255,255,255,0.05)'
            : bgColor === 'sepia'
                ? '#ede5d5'
                : '#f9fafb';
        const episodeSubtleBg = bgColor === 'dark'
            ? '#242426'
            : bgColor === 'sepia'
                ? '#efe6d6'
                : '#f3f4f6';
        const episodeActiveBg = bgColor === 'dark'
            ? '#2b2224'
            : bgColor === 'sepia'
                ? '#efe2d0'
                : '#fef2f2';
        const episodeActiveText = bgColor === 'dark'
            ? '#fca5a5'
            : bgColor === 'sepia'
                ? '#8c2f39'
                : '#dc2626';
        const userPopoverCss = bgColor === 'dark'
            ? `
         .reader-user-popover .ant-popover-inner {
            background-color: ${colors.bg} !important;
            border: 1px solid ${colors.border} !important;
            box-shadow: 0 18px 48px rgba(0,0,0,0.45) !important;
         }
         .reader-user-popover .ant-popover-arrow::before,
         .reader-user-popover .ant-popover-arrow::after {
            background-color: ${colors.bg} !important;
         }
         .reader-user-popover .reader-user-popover-panel {
            background-color: ${episodeSubtleBg} !important;
            color: ${colors.text} !important;
         }
         .reader-user-popover .reader-user-popover-profile-card,
         .reader-user-popover .reader-user-popover-rank,
         .reader-user-popover .reader-user-popover-toggle,
         .reader-user-popover .reader-user-popover-avatar-shell,
         .reader-user-popover .reader-user-popover-pill,
         .reader-user-popover .reader-user-popover-rp-pill,
         .reader-user-popover .reader-user-popover-rank-image-shell {
            background: ${colors.bg} !important;
            border-color: ${colors.border} !important;
            color: ${colors.text} !important;
            box-shadow: none !important;
         }
         .reader-user-popover .reader-user-popover-name,
         .reader-user-popover .reader-user-popover-dots,
         .reader-user-popover .reader-user-popover-link,
         .reader-user-popover .reader-user-popover-link span,
         .reader-user-popover .reader-user-popover-toggle span,
         .reader-user-popover .reader-user-popover-rank p,
         .reader-user-popover .reader-user-popover-rank span,
         .reader-user-popover .reader-user-popover-pill .amount-pill-text,
         .reader-user-popover .reader-user-popover-pill .freecoin-pill-text,
         .reader-user-popover .reader-user-popover-rp-value,
         .reader-user-popover .reader-user-popover-rank-name {
            color: ${colors.text} !important;
         }
         .reader-user-popover .reader-user-popover-link:hover,
         .reader-user-popover .reader-user-popover-dots:hover {
            background-color: ${episodeHoverBg} !important;
         }
         .reader-user-popover .reader-user-popover-rank-copy p:first-child,
         .reader-user-popover .reader-user-popover-toggle .text-gray-500,
         .reader-user-popover .reader-user-popover-toggle .text-gray-800,
         .reader-user-popover .reader-user-popover-rank .text-gray-400,
         .reader-user-popover .reader-user-popover-rank .text-gray-700,
         .reader-user-popover .reader-user-popover-rank .text-gray-800 {
            color: #a1a1aa !important;
         }
         .reader-user-popover .reader-user-popover-rank-cta {
            color: ${episodeActiveText} !important;
         }
         .reader-user-popover .reader-user-popover-divider {
            background-color: ${colors.border} !important;
         }
         .reader-user-popover .reader-user-popover-link svg *,
         .reader-user-popover .reader-user-popover-dots svg * {
            stroke: currentColor !important;
         }
         .reader-user-popover .reader-user-popover-link svg path[fill='white'],
         .reader-user-popover .reader-user-popover-link svg circle[fill='white'] {
            fill: transparent !important;
         }
         .reader-user-popover .reader-user-popover-link svg path[fill='#B01F1F'],
         .reader-user-popover .reader-user-popover-link svg circle[fill='#B01F1F'] {
            fill: currentColor !important;
         }
         .reader-user-popover .reader-user-popover-logout:hover {
            background-color: rgba(220,38,38,0.12) !important;
         }`
            : '';
        const navbarAuxPopoverCss = bgColor === 'dark'
            ? `
         .reader-cart-popover .ant-popover-inner,
         .reader-notification-popover .ant-popover-inner {
            background-color: ${colors.bg} !important;
            border: 1px solid ${colors.border} !important;
            box-shadow: 0 18px 48px rgba(0,0,0,0.45) !important;
         }
         .reader-cart-popover .reader-cart-popover-panel,
         .reader-notification-popover .reader-notification-panel,
         .reader-cart-popover .reader-cart-popover-header,
         .reader-cart-popover .reader-cart-popover-list,
         .reader-cart-popover .reader-cart-popover-footer,
         .reader-cart-popover .reader-cart-popover-empty,
         .reader-notification-popover .reader-notification-header,
         .reader-notification-popover .reader-notification-tabs,
         .reader-notification-popover .reader-notification-list,
         .reader-notification-popover .reader-notification-footer,
         .reader-notification-popover .reader-notification-empty {
            background-color: ${colors.bg} !important;
            color: ${colors.text} !important;
            border-color: ${colors.border} !important;
         }
         .reader-cart-popover .reader-cart-popover-empty-icon,
         .reader-notification-popover .reader-notification-empty-icon,
         .reader-cart-popover .reader-cart-popover-collapse .ant-collapse-header,
         .reader-cart-popover .reader-cart-popover-item .bg-white,
         .reader-cart-popover .reader-cart-popover-item .bg-gray-100,
         .reader-notification-popover .reader-notification-item,
         .reader-notification-popover .reader-notification-item.bg-white,
         .reader-notification-popover .reader-notification-item.bg-slate-50\\/50 {
            background-color: ${episodeSubtleBg} !important;
            border-color: ${colors.border} !important;
         }
         .reader-cart-popover .reader-cart-popover-item:hover,
         .reader-notification-popover .reader-notification-item:hover {
            background-color: ${episodeHoverBg} !important;
         }
         .reader-cart-popover .reader-cart-popover-panel,
         .reader-cart-popover .reader-cart-popover-panel h3,
         .reader-cart-popover .reader-cart-popover-panel h4,
         .reader-cart-popover .reader-cart-popover-panel p,
         .reader-cart-popover .reader-cart-popover-panel span,
         .reader-cart-popover .reader-cart-popover-panel button,
         .reader-notification-popover .reader-notification-panel,
         .reader-notification-popover .reader-notification-panel h3,
         .reader-notification-popover .reader-notification-panel h4,
         .reader-notification-popover .reader-notification-panel p,
         .reader-notification-popover .reader-notification-panel span,
         .reader-notification-popover .reader-notification-panel button {
            color: ${colors.text} !important;
         }
         .reader-cart-popover .reader-cart-popover-panel .text-gray-400,
         .reader-cart-popover .reader-cart-popover-panel .text-gray-500,
         .reader-cart-popover .reader-cart-popover-panel .text-gray-700,
         .reader-cart-popover .reader-cart-popover-panel .text-gray-800,
         .reader-cart-popover .reader-cart-popover-panel .text-gray-900,
         .reader-notification-popover .reader-notification-panel .text-gray-400,
         .reader-notification-popover .reader-notification-panel .text-gray-500,
         .reader-notification-popover .reader-notification-panel .text-gray-600,
         .reader-notification-popover .reader-notification-panel .text-gray-800,
         .reader-notification-popover .reader-notification-panel .text-gray-900 {
            color: ${colors.text === '#ffffff' ? '#d1d5db' : colors.text} !important;
         }
         .reader-notification-popover .reader-notification-type-badge,
         .reader-notification-popover .reader-notification-type-badge .anticon,
         .reader-notification-popover .reader-notification-type-badge svg {
            color: #ffffff !important;
         }
         .reader-notification-popover .reader-notification-type-card .anticon,
         .reader-notification-popover .reader-notification-type-card svg {
            color: currentColor !important;
         }
         .reader-notification-popover .reader-notification-type-card-book {
            background-color: rgba(59,130,246,0.14) !important;
            border-color: rgba(96,165,250,0.28) !important;
            color: #93c5fd !important;
         }
         .reader-notification-popover .reader-notification-type-card-system {
            background-color: rgba(239,68,68,0.14) !important;
            border-color: rgba(248,113,113,0.28) !important;
            color: #fca5a5 !important;
         }
         .reader-notification-popover .reader-notification-type-card-comment {
            background-color: rgba(249,115,22,0.14) !important;
            border-color: rgba(251,146,60,0.28) !important;
            color: #fdba74 !important;
         }
         .reader-notification-popover .reader-notification-type-badge-book {
            background-color: #2563eb !important;
         }
         .reader-notification-popover .reader-notification-type-badge-system {
            background-color: #dc2626 !important;
         }
         .reader-notification-popover .reader-notification-type-badge-comment {
            background-color: #ea580c !important;
         }
         .reader-notification-popover .reader-notification-type-tag {
            border: 1px solid transparent !important;
            box-shadow: none !important;
         }
         .reader-notification-popover .reader-notification-type-tag-book {
            background-color: rgba(59,130,246,0.14) !important;
            color: #93c5fd !important;
         }
         .reader-notification-popover .reader-notification-type-tag-system {
            background-color: rgba(239,68,68,0.14) !important;
            color: #fca5a5 !important;
         }
         .reader-notification-popover .reader-notification-type-tag-comment {
            background-color: rgba(249,115,22,0.14) !important;
            color: #fdba74 !important;
         }
         .reader-notification-popover .reader-notification-type-tag-default {
            background-color: rgba(255,255,255,0.08) !important;
            color: #d1d5db !important;
         }
         .reader-cart-popover .reader-cart-popover-panel .border-gray-50,
         .reader-cart-popover .reader-cart-popover-panel .border-gray-100,
         .reader-cart-popover .reader-cart-popover-panel .border-gray-200,
         .reader-notification-popover .reader-notification-panel .border-gray-100,
         .reader-notification-popover .reader-notification-panel .border-gray-200 {
            border-color: ${colors.border} !important;
         }
         .reader-cart-popover .reader-cart-popover-panel .ant-btn,
         .reader-notification-popover .reader-notification-panel .ant-btn {
            box-shadow: none !important;
         }
         .reader-cart-popover .reader-cart-popover-panel .ant-collapse,
         .reader-cart-popover .reader-cart-popover-panel .ant-collapse-content,
         .reader-cart-popover .reader-cart-popover-panel .ant-collapse-content-box,
         .reader-notification-popover .reader-notification-panel .ant-tabs-content-holder {
            background-color: transparent !important;
            border-color: ${colors.border} !important;
         }
         .reader-cart-popover .reader-cart-popover-panel .ant-collapse-expand-icon,
         .reader-notification-popover .reader-notification-panel .ant-tabs-tab,
         .reader-notification-popover .reader-notification-panel .ant-tabs-nav,
         .reader-notification-popover .reader-notification-panel .ant-tabs-ink-bar {
            color: ${colors.text} !important;
            border-color: ${colors.border} !important;
         }
         .reader-notification-popover .reader-notification-panel .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: ${episodeActiveText} !important;
         }
         .reader-notification-popover .reader-notification-panel .ant-tag {
            border-color: transparent !important;
         }`
            : '';
        const styleId = "navbar-theme-override";
        let observer: MutationObserver | null = null;
        let frameId: number | null = null;
        let cancelled = false;

        const css = `#GlobalNavbarWrapper, #Navbar { position: relative !important; }
        #Navbar { background-color: ${colors.bg} !important; color: ${colors.text} !important; border-bottom-color: ${colors.border} !important; }
        #Navbar > div, #Navbar a, #Navbar button, #Navbar .text-gray-800, #Navbar svg, #Navbar span { color: ${colors.text} !important; border-color: ${colors.border} !important; }
        #Navbar a:hover, #Navbar button:hover, #Navbar .group:hover > a { color: #dc2626 !important; }
        #Navbar svg * { stroke: ${colors.text} !important; fill: none !important; }
        #Navbar #UserProfileDropdown { border-color: ${currentBg?.key === 'dark' ? '#ffffff' : '#000000'} !important; }
        #Navbar #NovelMegaMenu > div { background-color: ${colors.bg} !important; border-color: ${colors.border} !important; }
        #Navbar #NovelMegaMenu > div > div { background-color: ${colors.bg} !important; border-color: ${colors.border} !important; }
        #Navbar #NovelMegaMenu .text-gray-600, #Navbar #NovelMegaMenu .text-gray-500, #Navbar #NovelMegaMenu button, #Navbar #NovelMegaMenu a { color: ${colors.text} !important; }
        #Navbar #NovelMegaMenu .text-red-600 { color: #dc2626 !important; }
        #Navbar #NovelMegaMenu button:hover, #Navbar #NovelMegaMenu a:hover { background-color: ${colors.border} !important; color: #dc2626 !important; }
         #Navbar #NovelMegaMenu button.shadow-sm { background-color: ${colors.border} !important; color: #dc2626 !important; }
         #Navbar #NovelMegaMenu svg { color: inherit !important; }
         #Navbar .reader-mobile-nav-trigger { background-color: ${episodeSubtleBg} !important; border-color: ${colors.border} !important; color: ${colors.text} !important; }
         #Navbar .reader-mobile-nav-trigger:hover { background-color: ${episodeHoverBg} !important; border-color: ${colors.border} !important; color: ${colors.text} !important; }
         .reader-mobile-nav-drawer-body,
         .reader-mobile-nav-drawer-content { background-color: ${colors.bg} !important; color: ${colors.text} !important; }
         .reader-mobile-nav-drawer-content .reader-mobile-nav-header { border-bottom-color: ${colors.border} !important; }
         .reader-mobile-nav-drawer-content .reader-mobile-nav-logo-shell,
         .reader-mobile-nav-drawer-content .reader-mobile-nav-close { background-color: ${episodeSubtleBg} !important; border-color: ${colors.border} !important; color: ${colors.text} !important; box-shadow: none !important; }
         .reader-mobile-nav-drawer-content .reader-mobile-nav-link,
         .reader-mobile-nav-drawer-content .reader-mobile-nav-accordion,
         .reader-mobile-nav-drawer-content .reader-mobile-nav-link span,
         .reader-mobile-nav-drawer-content .reader-mobile-nav-accordion p,
         .reader-mobile-nav-drawer-content .reader-mobile-nav-accordion svg,
         .reader-mobile-nav-drawer-content .reader-mobile-nav-link svg { color: ${colors.text} !important; }
         .reader-mobile-nav-drawer-content .reader-mobile-nav-link:hover,
         .reader-mobile-nav-drawer-content .reader-mobile-nav-accordion:hover { background-color: ${episodeHoverBg} !important; }
         ${userPopoverCss}
         ${navbarAuxPopoverCss}
         .reader-episode-popover .ant-popover-inner { background-color: ${colors.bg} !important; border: 1px solid ${colors.border} !important; box-shadow: ${bgColor === 'dark' ? '0 18px 48px rgba(0,0,0,0.45)' : '0 18px 48px rgba(15,23,42,0.16)'} !important; }
         .reader-episode-popover .ant-popover-title { background-color: ${colors.bg} !important; border-bottom-color: ${colors.border} !important; color: ${colors.text} !important; }
         .reader-settings-popover .ant-popover-inner,
         .reader-bookmark-popover .ant-popover-inner { background-color: ${colors.bg} !important; border: 1px solid ${colors.border} !important; box-shadow: ${bgColor === 'dark' ? '0 18px 48px rgba(0,0,0,0.45)' : '0 18px 48px rgba(15,23,42,0.16)'} !important; }
         .reader-settings-popover .ant-popover-title,
         .reader-bookmark-popover .ant-popover-title { background-color: ${colors.bg} !important; border-bottom-color: ${colors.border} !important; color: ${colors.text} !important; }
         .reader-settings-panel,
         .reader-bookmark-panel { background-color: ${colors.bg} !important; color: ${colors.text} !important; }
         .reader-settings-popover .reader-settings-neutral-button:hover,
         .reader-bookmark-popover .reader-bookmark-item:hover { background-color: ${episodeHoverBg} !important; }
         .reader-settings-popover .reader-settings-card { background-color: ${episodeSubtleBg} !important; border-color: ${colors.border} !important; }
         .reader-settings-popover .reader-settings-label,
         .reader-bookmark-popover .reader-bookmark-note,
         .reader-bookmark-popover .reader-bookmark-empty { color: ${colors.text === '#f3f4f6' ? '#9ca3af' : colors.text === '#5b4636' ? '#8b735c' : '#6b7280'} !important; }
         .reader-bookmark-popover .reader-bookmark-heading,
         .reader-settings-popover .reader-settings-title { color: ${colors.text} !important; }
         .reader-settings-popover .reader-settings-select .ant-select-selector { background-color: ${episodeSubtleBg} !important; border-color: ${colors.border} !important; color: ${colors.text} !important; box-shadow: none !important; }
         .reader-settings-popover .reader-settings-select .ant-select-selection-item,
         .reader-settings-popover .reader-settings-select .ant-select-arrow { color: ${colors.text} !important; }
         #episode-list-container { background-color: ${colors.bg} !important; color: ${colors.text} !important; }
         #episode-list-container > div:first-child { border-bottom: 1px solid ${colors.border} !important; }
         #episode-list-container > div:first-child button { background-color: ${episodeSubtleBg} !important; color: ${colors.text} !important; }
         #episode-list-container > div[style] { border-bottom-color: ${colors.border} !important; }
         #episode-list-container button { color: ${colors.text} !important; }
         #episode-list-container button:hover { background-color: ${episodeHoverBg} !important; }
         #episode-list-container #active-episode-item { background-color: ${episodeActiveBg} !important; color: ${episodeActiveText} !important; }
         #episode-list-container svg { color: ${colors.text} !important; }
         footer { background-color: ${colors.bg} !important; color: ${colors.text} !important; border-top-color: ${colors.border} !important; margin-top: 0 !important; }
        footer, footer * { color: ${colors.text} !important; border-color: ${colors.border} !important; }
        footer svg, footer svg * { stroke: ${colors.text} !important; fill: none !important; }
        footer a { color: ${colors.text} !important; }
        footer .text-gray-700, footer .text-gray-500, footer .text-gray-400 { color: ${colors.text} !important; }
         .reader-font-surface,
         .reader-font-surface * {
            color: ${colors.text} !important;
            background-color: transparent !important;
            border-color: ${colors.border} !important;
            font-family: ${resolvedFontFamilies.find(f => f.key === fontFamily)?.family || "var(--font-sarabun), sans-serif"} !important;
         }
         .episode-content {
            color: ${colors.text} !important;
            border-color: ${colors.border} !important;
         }
          .prose, .prose * { font-family: ${resolvedFontFamilies.find(f => f.key === fontFamily)?.family || "var(--font-sarabun), sans-serif"} !important; }
       `;

        const applyStyles = () => {
            if (cancelled) return false;
            const nav = document.getElementById("Navbar");
            const navbarWrapper = document.getElementById("GlobalNavbarWrapper");
            if (!nav || !navbarWrapper) return false;

            let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
            if (!styleEl) {
                styleEl = document.createElement("style");
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            styleEl.innerHTML = css;
            return true;
        };

        const tryApply = () => {
            if (applyStyles()) {
                observer?.disconnect();
                observer = null;
                if (frameId) cancelAnimationFrame(frameId);
                frameId = null;
                return;
            }
            frameId = requestAnimationFrame(tryApply);
        };

        tryApply();

        observer = new MutationObserver(() => {
            if (applyStyles()) {
                observer?.disconnect();
                observer = null;
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            cancelled = true;
            if (frameId) cancelAnimationFrame(frameId);
            observer?.disconnect();
            const s = document.getElementById(styleId);
            if (s) s.remove();
        };
    }, [bgColor, fontFamily, resolvedFontFamilies]);

    // Auto Scroll Logic
    useEffect(() => {
        let animationFrameId: number;
        const autoScroll = () => {
            if (contentRef.current) {
                const element = contentRef.current;
                const contentBottom = element.getBoundingClientRect().bottom + window.scrollY;
                const stopPosition = contentBottom - window.innerHeight;
                if (window.scrollY >= stopPosition - 1) {
                    setIsAutoScroll(false);
                    return;
                }
            } else {
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                if (window.scrollY >= maxScroll - 1) {
                    setIsAutoScroll(false);
                    return;
                }
            }

            scrollAccumulator.current += scrollSpeed;
            if (scrollAccumulator.current >= 1) {
                const pixelsToScroll = Math.floor(scrollAccumulator.current);
                window.scrollBy(0, pixelsToScroll);
                scrollAccumulator.current -= pixelsToScroll;
            }
            animationFrameId = requestAnimationFrame(autoScroll);
        };

        if (isAutoScroll) {
            scrollAccumulator.current = 0;
            animationFrameId = requestAnimationFrame(autoScroll);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isAutoScroll, scrollSpeed, contentRef]);

    const currentBg = bgColors.find((bg) => bg.key === bgColor) || bgColors[0];
    const currentFontFamily = resolvedFontFamilies.find((ff) => ff.key === fontFamily) || resolvedFontFamilies[0];

    return {
        fontSize, setFontSize,
        fontFamily, setFontFamily,
        bgColor, setBgColor,
        isBold, setIsBold,
        textAlign, setTextAlign,
        isAutoScroll, setIsAutoScroll,
        scrollSpeed, setScrollSpeed,
        currentBg, currentFontFamily,
        fontFamilies: resolvedFontFamilies, bgColors
    };
}
