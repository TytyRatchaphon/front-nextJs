"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Spin, Alert, Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import parse from "html-react-parser";
import GetAppBanner from "@/components/GetAppBanner";
import Footer from "@/components/Footer";
import { BackToTopButton } from "@/components/BackToTopButton";
import ProtectedContent from "@/components/ProtectedContent";

import {
  fetchBookDetail,
  fetchBookEpisodes as fetchBookEpisodesAPI,
} from "@/services/apiServices";

// API function สำหรับดึงเนื้อหาตอน
const fetchEpisodeContent = async (episodeId: string) => {
  const token = localStorage.getItem("authToken");
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/readep/${episodeId}`;

  console.log("🔍 Fetching episode:", episodeId);
  console.log("🔗 API URL:", apiUrl);
  console.log("🔑 Token:", token ? "Found" : "Not found");

  const response = await fetch(apiUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  console.log("📡 Response status:", response.status);

  // ตรวจสอบทั้ง HTTP status และ response body
  const data = await response.json();
  console.log("📖 Episode Content Response:", data);

  // กรณีสำเร็จ
  if (data.code === 200 && data.data) {
    return data.data;
  }

  // กรณี error - แสดง message จาก API
  if (data.code === 401) {
    console.error("❌ 401 Error:", data.message);
    throw new Error(
      data.message || "คุณไม่มีสิทธิ์อ่านตอนนี้ กรุณาซื้อตอนก่อน"
    );
  }

  if (!response.ok) {
    console.error("❌ Response error:", data);
    throw new Error(
      data.message || `ไม่สามารถดึงข้อมูลตอนได้ (${response.status})`
    );
  }

  throw new Error(data.message || "ไม่พบข้อมูลตอน");
};

// API function สำหรับดึงรายการตอนทั้งหมด (เพื่อหา prev/next)
const fetchBookEpisodes = async (bookId: number | string) => {
  const token = localStorage.getItem("authToken");
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/bookgroup/${bookId}`;

  const response = await fetch(apiUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error("ไม่สามารถดึงรายการตอนได้");
  }

  const data = await response.json();

  if (data.code === 200 && data.data?.groups) {
    // รวมตอนทั้งหมดจากทุก group พร้อมเก็บ group_id และลำดับ group
    const allEpisodes: any[] = [];

    // เรียง groups ก่อน (ถ้ามี group_id หรือลำดับ)
    const sortedGroups = [...data.data.groups].sort(
      (a, b) => (a.group_id || 0) - (b.group_id || 0)
    );

    sortedGroups.forEach((group: any, groupIndex: number) => {
      if (group.list && Array.isArray(group.list)) {
        // เพิ่ม group_id และ groupIndex ให้แต่ละตอน
        const episodesWithGroupInfo = group.list.map((ep: any) => ({
          ...ep,
          _groupId: group.group_id,
          _groupIndex: groupIndex,
          _groupName: group.name,
        }));
        allEpisodes.push(...episodesWithGroupInfo);
      }
    });

    // เรียงตามลำดับ: groupIndex แล้วค่อย order_by
    return allEpisodes.sort((a, b) => {
      // เรียงตาม group ก่อน
      if (a._groupIndex !== b._groupIndex) {
        return a._groupIndex - b._groupIndex;
      }
      // ถ้าอยู่ group เดียวกัน เรียงตาม order_by
      return (a.order_by || 0) - (b.order_by || 0);
    });
  }

  return [];
};

// ตั้งค่าฟอนต์
const fontSizes = [
  { key: "xs", label: "เล็กมาก", size: "text-xs" },
  { key: "sm", label: "เล็ก", size: "text-sm" },
  { key: "base", label: "ปกติ", size: "text-base" },
  { key: "lg", label: "ใหญ่", size: "text-lg" },
  { key: "xl", label: "ใหญ่มาก", size: "text-xl" },
  { key: "2xl", label: "ใหญ่พิเศษ", size: "text-2xl" },
];

// ตั้งค่าสีพื้นหลัง
const bgColors = [
  { key: "white", label: "สว่าง", bg: "bg-white", text: "text-gray-900" },
  { key: "sepia", label: "สีเซเปีย", bg: "bg-amber-50", text: "text-gray-900" },
  { key: "dark", label: "มืด", bg: "bg-gray-900", text: "text-gray-100" },
  { key: "black", label: "ดำ", bg: "bg-black", text: "text-white" },
];

// ตั้งค่าฟอนต์ (5 แบบที่แตกต่างชัดแต่อ่านง่าย)
const fontFamilies = [
  { key: "sarabun", label: "Sarabun", family: "'Sarabun', sans-serif" },
  { key: "prompt", label: "Prompt", family: "'Prompt', sans-serif" },
  { key: "kanit", label: "Kanit", family: "'Kanit', sans-serif" },
  {
    key: "ibm-plex",
    label: "IBM Plex Sans Thai",
    family: "'IBM Plex Sans Thai', sans-serif",
  },
  { key: "mitr", label: "Mitr", family: "'Mitr', sans-serif" },
];

export default function ReadEpisodePage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const episodeId = params.episodeId as string;

  console.log(
    "🎯 ReadEpisodePage render - bookId:",
    bookId,
    "episodeId:",
    episodeId
  );

  // Debug: แสดง bookId และ episodeId ที่ได้รับจาก URL
  useEffect(() => {
    console.log("🎯 Page loaded with bookId:", bookId, "episodeId:", episodeId);
  }, [bookId, episodeId]);

  const [fontSize, setFontSize] = useState("base");
  const [fontFamily, setFontFamily] = useState("sarabun");
  const [bgColor, setBgColor] = useState("white");
  const [lineHeight, setLineHeight] = useState("relaxed");
  const [prevEpisode, setPrevEpisode] = useState<string | null>(null);
  const [nextEpisode, setNextEpisode] = useState<string | null>(null);
  const [prevEpisodeData, setPrevEpisodeData] = useState<any>(null);
  const [nextEpisodeData, setNextEpisodeData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(
    {}
  );

  // Fetch book detail to get correct book_id (number) - ใช้ apiServices
  const {
    data: bookDetail,
    isLoading: isLoadingBookDetail,
    error: bookDetailError,
  } = useQuery({
    queryKey: ["bookDetail", bookId],
    queryFn: () => {
      console.log("🔍 Fetching bookDetail for bookId:", bookId);
      return fetchBookDetail(bookId);
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  // Debug bookDetail
  useEffect(() => {
    console.log("� BookDetail State:");
    console.log("  - bookId:", bookId);
    console.log("  - isLoading:", isLoadingBookDetail);
    console.log("  - bookDetail:", bookDetail);
    console.log("  - book_id:", bookDetail?.book_id);
    console.log("  - error:", bookDetailError);
  }, [bookId, bookDetail, isLoadingBookDetail, bookDetailError]);

  // Fetch episode content
  const {
    data: episode,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["episodeContent", episodeId],
    queryFn: () => fetchEpisodeContent(episodeId),
    enabled: !!episodeId,
    staleTime: 10 * 60 * 1000, // Cache 10 นาที
  });

  // Fetch book episodes to find prev/next (ใช้ bookId จาก URL params)
  const { data: allEpisodes, error: episodesError } = useQuery({
    queryKey: ["bookEpisodes", bookId],
    queryFn: () => {
      console.log("🔍 fetchBookEpisodes called with bookId:", bookId);
      return fetchBookEpisodes(bookId);
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });

  // Debug: log episodes error
  useEffect(() => {
    if (episodesError) {
      console.error("❌ Episodes fetch error:", episodesError);
    }
    if (allEpisodes) {
      console.log("📦 Raw allEpisodes data:", allEpisodes);
    }
  }, [episodesError, allEpisodes]);

  // Fetch episodes with groups สำหรับ sidebar (ใช้ bookId จาก URL params)
  const { data: episodesData } = useQuery({
    queryKey: ["bookEpisodesGroups", bookId],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const url = `${process.env.NEXT_PUBLIC_API_URL}/bookgroup/${bookId}`;

      console.log("🔍 Fetching book groups:");
      console.log("  - bookId:", bookId);
      console.log("  - URL:", url);
      console.log(
        "  - Token:",
        token ? `${token.substring(0, 20)}...` : "❌ NO TOKEN"
      );

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      console.log("📡 Response status:", response.status, response.statusText);
      const data = await response.json();
      console.log("📦 Book groups response:", data);

      return data.code === 200 ? data.data : null;
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });

  // Debug: แสดง episode?.book_id เมื่อได้ข้อมูล
  useEffect(() => {
    if (episode) {
      console.log("📚 Episode loaded!");
      console.log("📖 Full Episode data:", episode);
      console.log("� Episode fields:", {
        book_id: episode.book_id,
        bookID: episode.bookID,
        book_trans_id: episode.book_trans_id,
        ep_id: episode.ep_id,
        epID: episode.epID,
      });
    }
  }, [episode]);

  // คำนวณ prev/next episode เมื่อมีข้อมูล
  useEffect(() => {
    console.log("🔄 Navigation effect triggered");
    console.log("allEpisodes:", allEpisodes?.length || 0);
    console.log("episodeId:", episodeId);

    if (
      !allEpisodes ||
      !Array.isArray(allEpisodes) ||
      allEpisodes.length === 0
    ) {
      console.warn("⚠️ No episodes data or not an array");
      return;
    }

    if (!episodeId) {
      console.warn("⚠️ No episodeId");
      return;
    }

    console.log("🔍 Finding navigation for episode:", episodeId);
    console.log("📚 Total episodes:", allEpisodes.length);
    console.log(
      "📝 First 3 epIDs:",
      allEpisodes.slice(0, 3).map((e: any) => e.epID)
    );

    // ใช้ epID เพราะ API /readep/ ต้องการ epID (เช่น "EP2025...")
    const currentIndex = allEpisodes.findIndex(
      (ep: any) => ep.epID === episodeId
    );

    console.log("📍 Current index:", currentIndex);

    if (currentIndex !== -1) {
      const currentEp = allEpisodes[currentIndex];
      console.log("📖 Current episode:", {
        name: currentEp.name,
        epID: currentEp.epID,
        group: currentEp._groupName,
        groupIndex: currentEp._groupIndex,
        order: currentEp.order_by,
      });

      // หาตอนก่อนหน้า
      if (currentIndex > 0) {
        const prevEp = allEpisodes[currentIndex - 1];
        setPrevEpisode(prevEp.epID); // ใช้ epID เพราะ API ต้องการ
        setPrevEpisodeData(prevEp); // เก็บข้อมูลตอนทั้งหมด
        console.log("⬅️ Prev episode:", {
          ep_id: prevEp.ep_id,
          epID: prevEp.epID,
          name: prevEp.name,
          group: prevEp._groupName,
          sameGroup: prevEp._groupIndex === currentEp._groupIndex,
        });
      } else {
        setPrevEpisode(null);
        setPrevEpisodeData(null);
        console.log("⬅️ No prev episode (first episode)");
      }

      // หาตอนถัดไป
      if (currentIndex < allEpisodes.length - 1) {
        const nextEp = allEpisodes[currentIndex + 1];
        setNextEpisode(nextEp.epID); // ใช้ epID เพราะ API ต้องการ
        setNextEpisodeData(nextEp); // เก็บข้อมูลตอนทั้งหมด
        console.log("➡️ Next episode:", {
          ep_id: nextEp.ep_id,
          epID: nextEp.epID,
          name: nextEp.name,
          group: nextEp._groupName,
          sameGroup: nextEp._groupIndex === currentEp._groupIndex,
        });
      } else {
        setNextEpisode(null);
        setNextEpisodeData(null);
        console.log("➡️ No next episode (last episode)");
      }
    } else {
      console.error("❌ Current episode not found in list!");
      console.error("Looking for epID:", episodeId);
      console.error(
        "Available epIDs:",
        allEpisodes.map((ep: any) => ep.epID)
      );
    }
  }, [allEpisodes, episodeId]);

  // 🔒 Advanced Protection: Disable DevTools and Console Access
  useEffect(() => {
    // Disable right-click
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts for DevTools
    const disableDevTools = (e: KeyboardEvent) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I / Cmd+Option+I
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U / Cmd+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S / Cmd+S (Save)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
      }
    };

    // Disable text selection shortcuts
    const disableSelection = (e: KeyboardEvent) => {
      // Ctrl+A / Cmd+A (Select All)
      if (e.ctrlKey && e.keyCode === 65) {
        e.preventDefault();
        return false;
      }
      // Ctrl+C / Cmd+C (Copy)
      if (e.ctrlKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
      }
      // Ctrl+X / Cmd+X (Cut)
      if (e.ctrlKey && e.keyCode === 88) {
        e.preventDefault();
        return false;
      }
    };

    // Detect DevTools opening
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        // DevTools detected - you can add custom action here
        document.body.innerHTML =
          '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-size:24px;color:red;">⚠️ กรุณาปิด Developer Tools</div>';
      }
    };

    // Disable console.log stealing and iframe bypass
    const protectContent = () => {
      // Override console methods to prevent content extraction
      // But keep console in development mode for debugging
      const noop = () => {};
      if (
        typeof window !== "undefined" &&
        process.env.NODE_ENV !== "development"
      ) {
        (window as any).console.log = noop;
        (window as any).console.info = noop;
        (window as any).console.warn = noop;
        (window as any).console.error = noop;
        (window as any).console.debug = noop;
      }

      // 🔥 BLOCK IFRAME CREATION - Prevent iframe console bypass
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = function (tagName: string) {
        if (typeof tagName === "string" && tagName.toLowerCase() === "iframe") {
          console.warn("⚠️ iframe creation blocked for security");
          throw new Error("iframe creation is not allowed on this page");
        }
        return originalCreateElement(tagName);
      } as any;

      // Block iframe insertion via innerHTML
      const blockIframeInsertion = () => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (
                node.nodeType === 1 &&
                (node as Element).tagName === "IFRAME"
              ) {
                console.warn("⚠️ iframe detected and removed");
                node.parentNode?.removeChild(node);
              }
            });
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        return observer;
      };

      const iframeObserver = blockIframeInsertion();

      // 🔥 DISABLE DANGEROUS DOM METHODS
      // Block appendChild for iframes
      const originalAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function (this: Node, child: any) {
        if (child?.tagName === "IFRAME") {
          console.warn("⚠️ iframe appendChild blocked");
          throw new Error("iframe insertion is not allowed");
        }
        return originalAppendChild.call(this, child);
      } as any;

      // Block insertBefore for iframes
      const originalInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function (
        this: Node,
        newNode: any,
        refNode: any
      ) {
        if (newNode?.tagName === "IFRAME") {
          console.warn("⚠️ iframe insertBefore blocked");
          throw new Error("iframe insertion is not allowed");
        }
        return originalInsertBefore.call(this, newNode, refNode);
      } as any;

      // Protect against element selection
      const contentElements = document.querySelectorAll(".episode-content");
      contentElements.forEach((element) => {
        try {
          // เช็คว่า property สามารถ redefine ได้หรือไม่
          const innerTextDesc = Object.getOwnPropertyDescriptor(
            element,
            "innerText"
          );
          const textContentDesc = Object.getOwnPropertyDescriptor(
            element,
            "textContent"
          );

          // Override innerText getter ถ้าทำได้
          if (!innerTextDesc || innerTextDesc.configurable !== false) {
            Object.defineProperty(element, "innerText", {
              get: () => "⚠️ เนื้อหาได้รับการปกป้อง",
              configurable: true,
            });
          }

          // Override textContent getter ถ้าทำได้
          if (!textContentDesc || textContentDesc.configurable !== false) {
            Object.defineProperty(element, "textContent", {
              get: () => "⚠️ เนื้อหาได้รับการปกป้อง",
              configurable: true,
            });
          }
        } catch (error) {
          // ถ้า define property ไม่ได้ ก็ข้ามไป
          console.warn("⚠️ Cannot protect element:", error);
        }
      });

      // Return cleanup function
      return () => {
        iframeObserver.disconnect();
      };
    };

    document.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("keydown", disableDevTools);
    document.addEventListener("keydown", disableSelection);

    // Run protection after content loads
    let cleanupProtection: (() => void) | undefined;
    const timer = setTimeout(() => {
      cleanupProtection = protectContent();
    }, 1000);

    // Check for DevTools periodically
    const devToolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("keydown", disableDevTools);
      document.removeEventListener("keydown", disableSelection);
      clearTimeout(timer);
      clearInterval(devToolsInterval);
      if (cleanupProtection) {
        cleanupProtection();
      }
    };
  }, [episode]);

  const currentBg = bgColors.find((bg) => bg.key === bgColor);
  const currentFontSize = fontSizes.find((fs) => fs.key === fontSize);
  const currentFontFamily = fontFamilies.find((ff) => ff.key === fontFamily);

  // Menu สำหรับ Dropdown ขนาดฟอนต์
  const fontSizeMenu: MenuProps["items"] = fontSizes.map((fs) => ({
    key: fs.key,
    label: fs.label,
    onClick: () => setFontSize(fs.key),
  }));

  // Menu สำหรับ Dropdown ประเภทฟอนต์
  const fontFamilyMenu: MenuProps["items"] = fontFamilies.map((ff) => ({
    key: ff.key,
    label: (
      <div style={{ fontFamily: ff.family }}>
        <span>{ff.label}</span>
      </div>
    ),
    onClick: () => setFontFamily(ff.key),
  }));

  // Menu สำหรับ Dropdown สีพื้นหลัง
  const bgColorMenu: MenuProps["items"] = bgColors.map((bg) => ({
    key: bg.key,
    label: (
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded ${bg.bg} border`}></div>
        <span>{bg.label}</span>
      </div>
    ),
    onClick: () => setBgColor(bg.key),
  }));

  // Loading State
  if (isLoading) {
    return (
      <div className={`min-h-screen ${currentBg?.bg || "bg-white"}`}>
        <GetAppBanner />
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <Spin size="large" />
          <p className={`mt-4 ${currentBg?.text || "text-gray-900"}`}>
            กำลังโหลดเนื้อหา...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  // Error State
  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : "ไม่สามารถโหลดเนื้อหาได้";
    const is401Error =
      errorMessage.includes("ไม่พบตอน") || errorMessage.includes("ไม่มีสิทธิ์");

    return (
      <div className="bg-gray-50 min-h-screen">
        <GetAppBanner />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Alert
            message={
              is401Error ? "ไม่สามารถเข้าถึงตอนนี้ได้" : "เกิดข้อผิดพลาด"
            }
            description={
              <div>
                <p>{errorMessage}</p>
                {is401Error && (
                  <p className="mt-2 text-sm">
                    กรุณาตรวจสอบว่า:
                    <br />• คุณได้ซื้อตอนนี้แล้วหรือไม่
                    (ถ้าเป็นตอนที่ต้องเสียเงิน)
                    <br />• คุณได้เข้าสู่ระบบแล้วหรือไม่
                    <br />• ลิงก์ที่คุณใช้ถูกต้องหรือไม่
                  </p>
                )}
                {process.env.NODE_ENV === "development" && (
                  <p className="mt-2 text-xs text-gray-500">
                    Debug: episodeId = {episodeId}
                  </p>
                )}
              </div>
            }
            type={is401Error ? "warning" : "error"}
            showIcon
          />
          <div className="mt-6 text-center space-x-4">
            <Button type="primary" onClick={() => router.back()}>
              ← กลับหน้าก่อนหน้า
            </Button>
            {is401Error && (
              <Button onClick={() => window.location.reload()}>
                🔄 ลองใหม่อีกครั้ง
              </Button>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // bookId มาจาก URL params แล้ว ไม่ต้องดึงจาก episode

  return (
    <div
      className={`min-h-screen ${currentBg?.bg} ${currentBg?.text} transition-colors duration-300 select-none`}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        minHeight: "100vh",
      }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={currentBg?.bg}>
        <GetAppBanner />
      </div>

      {/* Sidebar สารบัญ */}
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Minimal Sidebar */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-80 bg-white shadow-xl z-[70] overflow-y-auto">
            {/* Minimal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">สารบัญ</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Episodes List */}
            {episodesData &&
            episodesData.groups &&
            episodesData.groups.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {episodesData.groups.map((group: any, groupIndex: number) => {
                  const isExpanded =
                    expandedGroups[group.group_id] ?? groupIndex === 0;
                  const toggleGroup = () => {
                    setExpandedGroups((prev) => ({
                      ...prev,
                      [group.group_id]: !isExpanded,
                    }));
                  };

                  return (
                    <div key={group.group_id} className="bg-white">
                      {/* Minimal Group Header */}
                      <button
                        onClick={toggleGroup}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="text-xs font-semibold text-gray-700 text-left uppercase tracking-wide">
                          {group.name}
                        </h3>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Episodes List */}
                      {isExpanded && (
                        <div className="divide-y divide-gray-50">
                          {group.list.map((ep: any) => {
                            const isCurrentEpisode = ep.epID === episodeId;
                            return (
                              <button
                                key={ep.ep_id}
                                onClick={() => {
                                  setIsSidebarOpen(false);
                                  router.push(`/read/${bookId}/${ep.epID}`);
                                }}
                                className={`
                                  w-full flex items-center justify-between px-4 py-2.5
                                  hover:bg-gray-50 transition-colors text-left
                                  ${
                                    isCurrentEpisode
                                      ? "bg-red-50/50 border-l-2 border-red-500"
                                      : ""
                                  }
                                `}
                              >
                                {/* Episode Info - Minimal */}
                                <div className="flex-1 min-w-0 pr-3">
                                  <p
                                    className={`text-sm truncate ${
                                      isCurrentEpisode
                                        ? "text-red-600 font-medium"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {ep.name.trim()}
                                  </p>
                                </div>

                                {/* Price Badge - Minimal */}
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  {ep.isBuy && (
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                  )}
                                  {ep.coin > 0 && !ep.isBuy && (
                                    <span className="text-xs text-gray-500">
                                      {ep.coin}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">ไม่พบรายการตอน</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Minimal Header */}
      <div
        className={`sticky top-0 z-50 ${currentBg?.bg} border-b border-gray-100`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button - Minimal */}
            <button
              onClick={() =>
                bookId ? router.push(`/detail/${bookId}`) : router.back()
              }
              className={`p-2 rounded-full transition-colors ${currentBg?.text}`}
              style={{
                backgroundColor:
                  currentBg?.key === "white"
                    ? "#f3f4f6"
                    : currentBg?.key === "dark" || currentBg?.key === "black"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Episode Title - Minimal */}
            <h1 className="text-sm font-medium truncate mx-4 flex-1 text-center">
              {episode?.name || ""}
            </h1>

            {/* Settings - Minimal Icons Only */}
            <div className="flex items-center gap-1">
              {/* ขนาดตัวอักษร */}
              <Dropdown menu={{ items: fontSizeMenu }} placement="bottomRight">
                <button
                  className={`p-2 rounded-full transition-colors ${currentBg?.text}`}
                  style={{
                    backgroundColor:
                      currentBg?.key === "white"
                        ? "#f3f4f6"
                        : currentBg?.key === "dark" ||
                          currentBg?.key === "black"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                  }}
                  title="ขนาดตัวอักษร"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h8m-8 6h16"
                    />
                  </svg>
                </button>
              </Dropdown>

              {/* ประเภทฟอนต์ */}
              <Dropdown
                menu={{ items: fontFamilyMenu }}
                placement="bottomRight"
              >
                <button
                  className={`p-2 rounded-full transition-colors ${currentBg?.text}`}
                  style={{
                    backgroundColor:
                      currentBg?.key === "white"
                        ? "#f3f4f6"
                        : currentBg?.key === "dark" ||
                          currentBg?.key === "black"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                  }}
                  title="ประเภทฟอนต์"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                </button>
              </Dropdown>

              {/* สีพื้นหลัง */}
              <Dropdown menu={{ items: bgColorMenu }} placement="bottomRight">
                <button
                  className={`p-2 rounded-full transition-colors ${currentBg?.text}`}
                  style={{
                    backgroundColor:
                      currentBg?.key === "white"
                        ? "#f3f4f6"
                        : currentBg?.key === "dark" ||
                          currentBg?.key === "black"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </button>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Content */}
      <main className={`${currentBg?.bg} min-h-screen pb-20`}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <article
            className="episode-content-wrapper"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
          >
            <div
              className={currentFontSize?.size || "text-base"}
              style={{
                lineHeight: "1.8",
                fontFamily:
                  currentFontFamily?.family || "'Sarabun', sans-serif",
              }}
            >
              {episode?.des ? (
                <ProtectedContent
                  content={episode.des}
                  className="episode-content"
                />
              ) : episode?.content ? (
                <ProtectedContent
                  content={episode.content}
                  className="episode-content"
                />
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-sm">ไม่พบเนื้อหาตอนนี้</p>
                </div>
              )}
            </div>
          </article>
        </div>
      </main>

      {/* Minimal Navigation */}
      <div
        className={`sticky bottom-0 border-t border-gray-100 ${currentBg?.bg} backdrop-blur-sm`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {/* ปุ่มตอนก่อนหน้า - Minimal */}
            <button
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                !prevEpisode
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 active:scale-95"
              }`}
              style={{
                color: !prevEpisode ? undefined : "#ffffff",
                textShadow: !prevEpisode
                  ? undefined
                  : "0 1px 2px rgba(0,0,0,0.3)",
              }}
              disabled={!prevEpisode}
              onClick={() => {
                if (prevEpisode && bookId) {
                  router.push(`/read/${bookId}/${prevEpisode}`);
                }
              }}
            >
              ← ก่อนหน้า
            </button>

            {/* ปุ่มสารบัญ - Minimal Icon */}
            <button
              className={`p-3 rounded-lg border transition-colors ${
                currentBg?.key === "dark" || currentBg?.key === "black"
                  ? "border-gray-700 hover:bg-gray-800"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg
                className={`w-5 h-5 ${currentBg?.text || "text-gray-700"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* ปุ่มตอนถัดไป - Minimal */}
            <button
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                !nextEpisode
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 active:scale-95"
              }`}
              style={{
                color: !nextEpisode ? undefined : "#ffffff",
                textShadow: !nextEpisode
                  ? undefined
                  : "0 1px 2px rgba(0,0,0,0.3)",
              }}
              disabled={!nextEpisode}
              onClick={() => {
                if (nextEpisode && bookId) {
                  router.push(`/read/${bookId}/${nextEpisode}`);
                }
              }}
            >
              ถัดไป →
            </button>
          </div>
        </div>
      </div>

      <div className={currentBg?.bg}>
        <Footer />
      </div>
      <BackToTopButton />
    </div>
  );
}
