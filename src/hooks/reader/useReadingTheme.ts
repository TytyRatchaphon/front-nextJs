import { useState, useEffect, useRef } from 'react';

const fontFamilies = [
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

export function useReadingTheme(contentRef: React.RefObject<HTMLElement>) {
    const [fontSize, setFontSize] = useState<number>(20);
    const [fontFamily, setFontFamily] = useState("sarabun");
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
                    if (parsed.fontFamily && fontFamilies.find((ff) => ff.key === parsed.fontFamily)) setFontFamily(parsed.fontFamily);
                    if (typeof parsed.isBold === 'boolean') setIsBold(parsed.isBold);
                    if (parsed.textAlign && ["left", "center", "justify"].includes(parsed.textAlign)) setTextAlign(parsed.textAlign as any);
                    if (parsed.fontSize && typeof parsed.fontSize === 'string') setFontSize(20);
                }
            }
        } catch (err) { } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save Theme
    useEffect(() => {
        if (!isLoaded) return;
        try {
            const key = "reading_theme_v2";
            const payload = { bgColor, fontSize, fontFamily, isBold, textAlign };
            localStorage.setItem(key, JSON.stringify(payload));
        } catch (err) { }
    }, [bgColor, fontSize, fontFamily, isBold, textAlign, isLoaded]);

    // Navbar Style Override
    useEffect(() => {
        try {
            const nav = document.getElementById("Navbar");
            if (!nav) return;

            const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                white: { bg: "#ffffff", text: "#000000", border: "#e5e7eb" },
                sepia: { bg: "#fdfaee", text: "#000000", border: "#e6dbc4" },
                dark: { bg: "#1c1c1e", text: "#ffffff", border: "#333333" },
            };

            const colors = colorMap[bgColor] ?? colorMap.white;
            const currentBg = bgColors.find(b => b.key === bgColor) || bgColors[0];

            const styleId = "navbar-theme-override";
            let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
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
        footer { background-color: ${colors.bg} !important; color: ${colors.text} !important; border-top-color: ${colors.border} !important; margin-top: 0 !important; }
        footer, footer * { color: ${colors.text} !important; border-color: ${colors.border} !important; }
        footer svg, footer svg * { stroke: ${colors.text} !important; fill: none !important; }
        footer a { color: ${colors.text} !important; }
        footer .text-gray-700, footer .text-gray-500, footer .text-gray-400 { color: ${colors.text} !important; }
        .episode-content, .episode-content * { color: ${colors.text} !important; background-color: transparent !important; border-color: ${colors.border} !important; }
        .episode-content-wrapper, .episode-content-wrapper * { font-family: ${fontFamilies.find(f => f.key === fontFamily)?.family || "var(--font-sarabun), sans-serif"} !important; }
        .prose, .prose * { font-family: ${fontFamilies.find(f => f.key === fontFamily)?.family || "var(--font-sarabun), sans-serif"} !important; }
      `;

            if (!styleEl) {
                styleEl = document.createElement("style");
                styleEl.id = styleId;
                styleEl.innerHTML = css;
                document.head.appendChild(styleEl);
            } else {
                styleEl.innerHTML = css;
            }

            return () => {
                const s = document.getElementById(styleId);
                if (s) s.remove();
            };
        } catch (err) { }
    }, [bgColor, fontFamily]);

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
    const currentFontFamily = fontFamilies.find((ff) => ff.key === fontFamily) || fontFamilies[0];

    return {
        fontSize, setFontSize,
        fontFamily, setFontFamily,
        bgColor, setBgColor,
        isBold, setIsBold,
        textAlign, setTextAlign,
        isAutoScroll, setIsAutoScroll,
        scrollSpeed, setScrollSpeed,
        currentBg, currentFontFamily,
        fontFamilies, bgColors
    };
}
