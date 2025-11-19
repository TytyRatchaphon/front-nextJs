// ⭐️ ต้องมี "use client"
// 📍 ตำแหน่ง: app/read/[bookId]/[episodeId]/ReadEpisodePageClient.tsx

"use client";

// ⭐️ 1. Import useMemo เพิ่ม
import { useState, useEffect, useMemo } from "react";
// ⭐️ 2. ลบ useParams, แต่เก็บ useRouter
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Spin, Alert, Button, Dropdown, Popover } from "antd";
import type { MenuProps } from "antd";
// import parse from "html-react-parser";
import { BackToTopButton } from "@/components/BackToTopButton";
import ProtectedContent from "@/components/ProtectedContent";


import apiClient from "@/services/apiClient";

// ... (API function fetchEpisodeContent เหมือนเดิม) ...
const fetchEpisodeContent = async (episodeId: string, bookId?: string) => {
  // Try direct fetch first; if not found and bookId provided,
  // attempt to resolve short numeric ep_id -> canonical epID via bookgroup and retry.
  try {
    const token = localStorage.getItem("authToken");
    console.log("🔍 [CLIENT] Fetching episode (via apiClient):", episodeId);

    const response = await apiClient.get(`/readep/${episodeId}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    console.log(" [CLIENT] Episode Content Response:", response.data);

    if (response.data && response.data.code === 200 && response.data.data) {
      return response.data.data;
    }

    // If API returned but no data, fallthrough to fallback logic below
    console.warn("[CLIENT] readep returned no data, will try fallback if possible");
  } catch (err: any) {
    console.warn("[CLIENT] direct readep failed:", err?.response?.data || err.message);
    // continue to fallback below if bookId available
  }

  // Fallback: if we have a bookId, try to map a short ep_id -> canonical epID
  if (bookId) {
    try {
      console.log("🔁 [CLIENT] Attempting fallback: resolve epID via bookgroup for bookId:", bookId);
      // fetch book groups/episodes
      const groupsResp = await apiClient.get(`/bookgroup/${bookId}`);
      const groupsData = groupsResp?.data?.data ?? groupsResp?.data;

      const groups = groupsData?.groups ?? [];
      // flatten
      const all: any[] = [];
      groups.forEach((g: any) => {
        if (Array.isArray(g.list)) {
          all.push(...g.list);
        }
      });

      const match = all.find((ep: any) => String(ep.ep_id) === String(episodeId) || String(ep.epID) === String(episodeId));
      if (match && match.epID) {
        console.log("🔁 [CLIENT] Found mapping, retrying readep with epID:", match.epID);
        const token2 = localStorage.getItem("authToken");
        const resp2 = await apiClient.get(`/readep/${match.epID}`, {
          headers: {
            ...(token2 && { Authorization: `Bearer ${token2}` }),
          },
        });
        if (resp2.data && resp2.data.code === 200 && resp2.data.data) {
          return resp2.data.data;
        }
      }
    } catch (err: any) {
      console.warn("[CLIENT] fallback resolution failed:", err?.response?.data || err.message);
    }
  }

  throw new Error("ไม่พบข้อมูลตอน");
};

// ... (fontSizes, bgColors, fontFamilies เหมือนเดิม) ...
const fontSizes = [
  { key: "xs", label: "เล็กมาก", size: "text-xs" },
  { key: "sm", label: "เล็ก", size: "text-sm" },
  { key: "base", label: "ปกติ", size: "text-base" },
  { key: "lg", label: "ใหญ่", size: "text-lg" },
  { key: "xl", label: "ใหญ่มาก", size: "text-xl" },
  { key: "2xl", label: "ใหญ่พิเศษ", size: "text-2xl" },
];
const bgColors = [
  { key: "white", label: "สว่าง", bg: "bg-white", text: "text-gray-900" },
  { key: "sepia", label: "สีเซเปีย", bg: "bg-amber-50", text: "text-gray-900" },
  { key: "dark", label: "มืด", bg: "bg-gray-900", text: "text-gray-100" },
  { key: "black", label: "ดำ", bg: "bg-black", text: "text-white" },
];
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
// ⭐️ 3. สร้าง Interface สำหรับ Props ที่รับมาจาก Server
interface ReadEpisodePageClientProps {
  bookId: string;
  episodeId: string;
  initialBookDetail: any; // 💡 ควรใช้ Type ที่ถูกต้องของ bookDetail
  initialEpisodesData: any; // 💡 ควรใช้ Type ที่ถูกต้องของ episodesData
}

// ⭐️ 4. เปลี่ยนชื่อ Component และรับ Props
export default function ReadEpisodePageClient({
  bookId,
  episodeId,
  initialBookDetail,
  initialEpisodesData,
}: ReadEpisodePageClientProps) {
  // ⭐️ 5. ลบ useParams และการดึงค่าจาก params
  // const params = useParams();
  const router = useRouter();
  // const bookId = params.bookId as string; // 👈 ได้จาก props
  // const episodeId = params.episodeId as string; // 👈 ได้จาก props

  console.log(
    "🎯 [CLIENT] ReadEpisodePageClient render - bookId:",
    bookId,
    "episodeId:",
    episodeId
  );

  // ... (useEffect Debug bookId/episodeId เหมือนเดิม) ...
  useEffect(() => {
    console.log(
      "🎯 [CLIENT] Page loaded with bookId:",
      bookId,
      "episodeId:",
      episodeId
    );
  }, [bookId, episodeId]);

  // ... (useState ต่างๆ เหมือนเดิม) ...
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
  const [isListPopoverOpen, setIsListPopoverOpen] = useState(false);

  // ⭐️ 6. ใช้ข้อมูลจาก Props แทน useQuery
  const bookDetail = initialBookDetail;
  const isLoadingBookDetail = false; // ไม่มี loading แล้ว (Server โหลดมาให้แล้ว)
  const bookDetailError = null; // ไม่มี error แล้ว

  /*
  // ⛔️ [REMOVED] ลบ useQuery นี้ทิ้ง
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
  */

  // ... (Debug bookDetail useEffect เหมือนเดิม) ...
  useEffect(() => {
    console.log(" [CLIENT] BookDetail State (from props):");
    console.log("  - bookId:", bookId);
    console.log("  - isLoading:", isLoadingBookDetail);
    console.log("  - bookDetail:", bookDetail);
    console.log("  - book_id:", bookDetail?.book_id);
    console.log("  - error:", bookDetailError);
  }, [bookId, bookDetail, isLoadingBookDetail, bookDetailError]);

  // ⭐️ 7. [KEPT] useQuery นี้ยังอยู่ เพราะต้องใช้ localStorage (ทำงานฝั่ง Client)
  // นี่คือ "Loading" หลักที่ผู้ใช้จะเห็น
  const {
    data: episode,
    isLoading, // 👈 นี่คือ Loading หลัก
    isError,
    error,
  } = useQuery({
    queryKey: ["episodeContent", episodeId],
    queryFn: () => fetchEpisodeContent(episodeId, bookId),
    enabled: !!episodeId,
    staleTime: 10 * 60 * 1000, // Cache 10 นาที
  });

  // ⭐️ 8. [NEW] ใช้ useMemo เพื่อคำนวณ allEpisodes จาก props (initialEpisodesData)
  // Logic นี้คือ Logic เดิมที่อยู่ใน queryFn ของ allEpisodes
  const allEpisodes = useMemo(() => {
    console.log(
      "🔄 [CLIENT] Calculating allEpisodes from initialEpisodesData",
      initialEpisodesData
    );
    const data = initialEpisodesData;
    if (!data || !data.groups || !Array.isArray(data.groups)) {
      return [];
    }

    const allEpisodesArr: any[] = [];
    const sortedGroups = [...data.groups].sort(
      (a: any, b: any) => (a.group_id || 0) - (b.group_id || 0)
    );

    sortedGroups.forEach((group: any, groupIndex: number) => {
      if (group.list && Array.isArray(group.list)) {
        const episodesWithGroupInfo = group.list.map((ep: any) => ({
          ...ep,
          _groupId: group.group_id,
          _groupIndex: groupIndex,
          _groupName: group.name,
        }));
        allEpisodesArr.push(...episodesWithGroupInfo);
      }
    });

    return allEpisodesArr.sort((a, b) => {
      if (a._groupIndex !== b._groupIndex) return a._groupIndex - b._groupIndex;
      return (a.order_by || 0) - (b.order_by || 0);
    });
  }, [initialEpisodesData]); // คำนวณใหม่เมื่อ prop เปลี่ยน
  const episodesError = null; // ไม่มี error (มาจาก Server)

  /*
  // ⛔️ [REMOVED] ลบ useQuery นี้ทิ้ง
  const { data: allEpisodes, error: episodesError } = useQuery({
    queryKey: ["bookEpisodes", bookId],
    queryFn: async () => {
      // ... (ย้าย Logic นี้ไปไว้ใน useMemo ด้านบน) ...
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });
  */

  // ... (Debug episodesError/allEpisodes useEffect เหมือนเดิม) ...
  useEffect(() => {
    if (episodesError) {
      console.error("❌ [CLIENT] Episodes fetch error:", episodesError);
    }
    if (allEpisodes) {
      console.log("📦 [CLIENT] Raw allEpisodes data (from useMemo):", allEpisodes);
    }
  }, [episodesError, allEpisodes]);

  // ⭐️ 9. ใช้ข้อมูลจาก Props แทน useQuery (สำหรับ Sidebar)
  const episodesData = initialEpisodesData;

  /*
  // ⛔️ [REMOVED] ลบ useQuery นี้ทิ้ง
  const { data: episodesData } = useQuery({
    queryKey: ["bookEpisodesGroups", bookId],
    queryFn: async () => {
      console.log("🔍 Fetching book groups (via service) for bookId:", bookId);
      const data = await fetchBookEpisodesAPI(bookId);
      return data ?? null;
    },
    enabled: !!bookId,
    staleTime: 10 * 60 * 1000,
  });
  */

  // ... (Debug episode?.book_id useEffect เหมือนเดิม) ...
  useEffect(() => {
    if (episode) {
      console.log("📚 [CLIENT] Episode loaded!");
      console.log("📖 [CLIENT] Full Episode data:", episode);
      console.log(" [CLIENT] Episode fields:", {
        book_id: episode.book_id,
        bookID: episode.bookID,
        book_trans_id: episode.book_trans_id,
        ep_id: episode.ep_id,
        epID: episode.epID,
      });
    }
  }, [episode]);

  // ⭐️ 10. useEffect นี้จะทำงานได้ "ทันที"
  // เพราะ allEpisodes จะถูกคำนวณจาก useMemo (ที่ได้ข้อมูลจาก props) ทันที
  useEffect(() => {
    console.log("🔄 [CLIENT] Navigation effect triggered");
    console.log("allEpisodes:", allEpisodes?.length || 0);
    console.log("episodeId:", episodeId);

    if (
      !allEpisodes ||
      !Array.isArray(allEpisodes) ||
      allEpisodes.length === 0
    ) {
      console.warn("⚠️ [CLIENT] No episodes data or not an array");
      return;
    }
    // ... (Logic ที่เหลือใน useEffect นี้เหมือนเดิม 100%) ...
    if (!episodeId) {
      console.warn("⚠️ [CLIENT] No episodeId");
      return;
    }

    console.log("🔍 [CLIENT] Finding navigation for episode:", episodeId);
    console.log("📚 [CLIENT] Total episodes:", allEpisodes.length);
    console.log(
      "📝 [CLIENT] First 3 epIDs:",
      allEpisodes.slice(0, 3).map((e: any) => e.epID)
    );

    const currentIndex = allEpisodes.findIndex(
      (ep: any) => String(ep.ep_id ?? ep.epID) === String(episodeId)
    );

    console.log("📍 [CLIENT] Current index:", currentIndex);

    if (currentIndex !== -1) {
      const currentEp = allEpisodes[currentIndex];
      console.log("📖 [CLIENT] Current episode:", {
        name: currentEp.name,
        epID: currentEp.epID,
        group: currentEp._groupName,
        groupIndex: currentEp._groupIndex,
        order: currentEp.order_by,
      });

      // หาตอนก่อนหน้า
      if (currentIndex > 0) {
        const prevEp = allEpisodes[currentIndex - 1];
        setPrevEpisode(String(prevEp.ep_id ?? prevEp.epID));
        setPrevEpisodeData(prevEp);
        console.log("⬅️ [CLIENT] Prev episode:", {
          ep_id: prevEp.ep_id,
          epID: prevEp.epID,
          name: prevEp.name,
          group: prevEp._groupName,
          sameGroup: prevEp._groupIndex === currentEp._groupIndex,
        });
      } else {
        setPrevEpisode(null);
        setPrevEpisodeData(null);
        console.log("⬅️ [CLIENT] No prev episode (first episode)");
      }

      // หาตอนถัดไป
      if (currentIndex < allEpisodes.length - 1) {
        const nextEp = allEpisodes[currentIndex + 1];
        setNextEpisode(String(nextEp.ep_id ?? nextEp.epID));
        setNextEpisodeData(nextEp);
        console.log("➡️ [CLIENT] Next episode:", {
          ep_id: nextEp.ep_id,
          epID: nextEp.epID,
          name: nextEp.name,
          group: nextEp._groupName,
          sameGroup: nextEp._groupIndex === currentEp._groupIndex,
        });
      } else {
        setNextEpisode(null);
        setNextEpisodeData(null);
        console.log("➡️ [CLIENT] No next episode (last episode)");
      }
    } else {
      console.error("❌ [CLIENT] Current episode not found in list!");
      console.error("Looking for epID:", episodeId);
      console.error(
        "Available epIDs:",
        allEpisodes.map((ep: any) => ep.epID)
      );
    }
  }, [allEpisodes, episodeId]);

  // ⭐️ 11. [KEPT] โค้ด Protection ทั้งหมดเหมือนเดิม
  // (เพราะทั้งหมดนี้ทำงานบน Client อยู่แล้ว)
  useEffect(() => {
    // Disable right-click
    const disableRightClick = (e: MouseEvent) => {
      // ... (เหมือนเดิม)
      e.preventDefault();
    };

    // ... (disableDevTools เหมือนเดิม) ...
    const disableDevTools = (e: KeyboardEvent) => {
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
      }
      // ...
    };
    // ... (disableSelection เหมือนเดิม) ...
    const disableSelection = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.keyCode === 65) {
        e.preventDefault();
        return false;
      }
      // ...
    };
    // ... (detectDevTools เหมือนเดิม) ...
    const detectDevTools = () => {
      // ...
    };
    // ... (protectContent เหมือนเดิม) ...
    const protectContent = () => {
      // ...
      const noop = () => {};
      if (
        typeof window !== "undefined" &&
        process.env.NODE_ENV !== "development"
      ) {
        (window as any).console.log = noop;
        // ...
      }
      // ...
      return () => {
        // ...
      };
    };

    document.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("keydown", disableDevTools);
    document.addEventListener("keydown", disableSelection);

    let cleanupProtection: (() => void) | undefined;
    const timer = setTimeout(() => {
      cleanupProtection = protectContent();
    }, 1000);

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
  }, [episode]); // 👈 ยังคงขึ้นอยู่กับ episode เพื่อ re-apply protection

  // ... (โค้ดส่วน Menu Dropdowns เหมือนเดิม 100%) ...
  const currentBg = bgColors.find((bg) => bg.key === bgColor);
  const currentFontSize = fontSizes.find((fs) => fs.key === fontSize);
  const currentFontFamily = fontFamilies.find((ff) => ff.key === fontFamily);

  const fontSizeMenu: MenuProps["items"] = fontSizes.map((fs) => ({
    key: fs.key,
    label: fs.label,
    onClick: () => setFontSize(fs.key),
  }));
  const fontFamilyMenu: MenuProps["items"] = fontFamilies.map((ff) => ({
    key: ff.key,
    label: (
      <div style={{ fontFamily: ff.family }}>
        <span>{ff.label}</span>
      </div>
    ),
    onClick: () => setFontFamily(ff.key),
  }));
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

  const renderEpisodesList = () => {
    if (!episodesData || !episodesData.groups) return <div className="p-4">ไม่พบรายการตอน</div>;
    return (
      <div className="max-h-64 w-72 overflow-auto">
        {episodesData.groups.map((group: any) => (
          <div key={group.group_id} className="border-b last:border-b-0">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500">{group.name}</div>
            {group.list.map((ep: any) => (
              <button
                key={ep.ep_id ?? ep.epID}
                onClick={() => {
                  setIsListPopoverOpen(false);
                  router.push(`/read/${bookId}/${String(ep.ep_id ?? ep.epID)}`);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${String(ep.epID) === String(episodeId) ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700'}`}
              >
                <div className="truncate text-sm">{ep.name?.trim()}</div>
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // ⭐️ 12. [KEPT] Loading State
  // ❗️ นี่คือ isLoading จาก useQuery("episodeContent")
  if (isLoading) {
    return (
      <div className={`min-h-screen ${currentBg?.bg || "bg-white"}`}>
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <Spin size="large" />
          <p className={`mt-4 ${currentBg?.text || "text-gray-900"}`}>
            กำลังโหลดเนื้อหา...
          </p>
        </div>
      </div>
    );
  }

  // ⭐️ 13. [KEPT] Error State
  // ❗️ นี่คือ isError/error จาก useQuery("episodeContent")
  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : "ไม่สามารถโหลดเนื้อหาได้";
    const is401Error =
      errorMessage.includes("ไม่พบตอน") || errorMessage.includes("ไม่มีสิทธิ์");

    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* ... (Alert JSX เหมือนเดิม) ... */}
          <Alert
            message={
              is401Error ? "ไม่สามารถเข้าถึงตอนนี้ได้" : "เกิดข้อผิดพลาด"
            }
            description={
              <div>
                <p>{errorMessage}</p>
                {/* ... */}
              </div>
            }
            type={is401Error ? "warning" : "error"}
            showIcon
          />
          <div className="mt-6 text-center space-x-4">
            <Button type="primary" onClick={() => router.back()}>
              ← กลับหน้าก่อนหน้า
            </Button>
            {/* ... */}
          </div>
        </div>
      </div>
    );
  }

  // ⭐️ 14. [KEPT] ส่วน JSX ที่เหลือทั้งหมดเหมือนเดิม 100%
  // มันจะใช้ "bookDetail" และ "episodesData" จาก props โดยอัตโนมัติ
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


      {/* Sidebar สารบัญ (ใช้ episodesData จาก props) */}
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
              {/* ... */}
            </div>

            {/* Episodes List (episodesData ใช้งานได้เลย) */}
            {episodesData &&
            episodesData.groups &&
            episodesData.groups.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {episodesData.groups.map((group: any, groupIndex: number) => {
                  // ... (โค้ด map, toggleGroup, JSX ทั้งหมดเหมือนเดิม) ...
                  const isExpanded =
                    expandedGroups[group.group_id] ?? groupIndex === 0;
                  const toggleGroup = () => {
                    // ...
                  };

                  return (
                    <div key={group.group_id} className="bg-white">
                      {/* Minimal Group Header */}
                      <button
                        onClick={toggleGroup}
                        // ...
                      >
                        {/* ... */}
                      </button>

                      {/* Episodes List */}
                      {isExpanded && (
                        <div className="divide-y divide-gray-50">
                          {group.list.map((ep: any) => {
                            // ... (โค้ด map, isCurrentEpisode, JSX ทั้งหมดเหมือนเดิม) ...
                            const isCurrentEpisode = String(ep.ep_id ?? ep.epID) === String(episodeId);
                            return (
                              <button
                                key={ep.ep_id}
                                onClick={() => {
                                  setIsSidebarOpen(false);
                                  router.push(`/read/${bookId}/${String(ep.ep_id ?? ep.epID)}`);
                                }}
                                // ...
                              >
                                {/* ... */}
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

      {/* Minimal Header (episode?.name ใช้งานได้เลย) */}
      <div
        className={`sticky top-0 z-50 ${currentBg?.bg} border-b border-gray-100`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button (bookId ใช้งานได้เลย) */}
            <button
              onClick={() =>
                bookId ? router.push(`/detail/${bookId}`) : router.back()
              }
              // ...
            >
              {/* ... */}
            </button>

            {/* Episode Title (episode ใช้งานได้เลย) */}
            <h1 className="text-sm font-medium truncate mx-4 flex-1 text-center">
              {episode?.name || ""}
            </h1>

            {/* Settings (Dropdowns ทั้งหมดเหมือนเดิม) */}
            <div className="flex items-center gap-1">
              {/* ขนาดตัวอักษร */}
              <Dropdown menu={{ items: fontSizeMenu }} placement="bottomRight">
                {/* ... */}
              </Dropdown>

              {/* ประเภทฟอนต์ */}
              <Dropdown
                menu={{ items: fontFamilyMenu }}
                placement="bottomRight"
              >
                {/* ... */}
              </Dropdown>

              {/* สีพื้นหลัง */}
              <Dropdown menu={{ items: bgColorMenu }} placement="bottomRight">
                {/* ... */}
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Content (episode?.des ใช้งานได้เลย) */}
      <main className={`${currentBg?.bg} min-h-screen pb-20`}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <article
            className="episode-content-wrapper"
            style={{
              userSelect: "none",
              // ...
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
              {/*
                Normalize content fields: some endpoints use `des`, others use `content`,
                `description`, `html`, etc. Also fall back to `bookDetail.des` when
                episode-level content is missing.
              */}
              {(() => {
                const contentCandidates = [
                  episode?.des,
                  episode?.description,
                  episode?.content,
                  episode?.html,
                  episode?.body,
                  episode?.content_html,
                  episode?.description_html,
                  // Book-level fallback
                  bookDetail?.des,
                  bookDetail?.description,
                ];

                const contentToRender = contentCandidates.find(
                  (c) => typeof c === "string" && c.trim() !== ""
                );

                if (contentToRender) {
                  return (
                    <ProtectedContent
                      content={String(contentToRender)}
                      className="episode-content"
                    />
                  );
                }

                return (
                  <div className="text-center py-20">
                    <p className="text-gray-400 text-sm">ไม่พบเนื้อหาตอนนี้</p>
                  </div>
                );
              })()}
            </div>
          </article>
        </div>
      </main>

      {/* Minimal Navigation (prevEpisode, nextEpisode ใช้งานได้เลย) */}
      <div
        className={`sticky bottom-0 border-t border-gray-100 ${currentBg?.bg} backdrop-blur-sm`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {/* ปุ่มตอนก่อนหน้า */}
            <button
              // ...
              disabled={!prevEpisode}
              onClick={() => {
                if (prevEpisode && bookId) {
                  router.push(`/read/${bookId}/${prevEpisode}`);
                }
              }}
            >
              ← ก่อนหน้า
            </button>

            {/* ปุ่มสารบัญ (Popover) */}
            <Popover
              placement="top"
              open={isListPopoverOpen}
              onOpenChange={(open) => setIsListPopoverOpen(open)}
              content={renderEpisodesList()}
              trigger="click"
            >
              <button
                onClick={() => setIsListPopoverOpen(true)}
                className="px-3 py-1 border rounded"
                aria-label="สารบัญ"
              >
                สารบัญ
              </button>
            </Popover>

            {/* ปุ่มตอนถัดไป */}
            <button
              // ...
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
      </div>
      <BackToTopButton />
    </div>
  );
}