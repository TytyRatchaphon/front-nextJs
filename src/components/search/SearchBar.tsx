"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Drawer, Button } from "antd";
import { FilterOutlined, HistoryOutlined, CloseOutlined } from "@ant-design/icons";
import GifLoader from '@/components/utility/GifLoader';
import { useAuthStore } from '@/stores/authStore';
import { getSearchHistory, deleteSearchHistory, clearSearchHistory, saveSearchHistory, SearchHistoryItem, fetchPopularSearches, fetchSearchSuggestions, PopularSearchItem } from '@/services/apiServices';

interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  order_by?: number;
}

interface SelectedFilters {
  categories: number[];
  types: string[];
  content_type: string[];
  status: string[];
  end: string; // "all", "end", หรือ "notend"
}

interface SearchBarProps {
  initialQuery?: string;
  initialFilters?: SelectedFilters;
  onSearch?: (params: {
    query: string;
    categories: number[];
    types: string[];
    content_type: string[];
    status: string[];
    end: string;
    sortBy: string;
    order: string;
  }) => void;
}

function SearchBar({ onSearch, initialFilters, initialQuery = "" }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy] = useState("date_at");
  const [order] = useState("DESC");

  // Initialize from parent props if available
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(initialFilters || {
    categories: [],
    types: [],
    content_type: [],
    status: [],
    end: "all",
  });

  // --- Search History Logic ---
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearchItem[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<PopularSearchItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { isLoggedIn } = useAuthStore();

  const fetchApiHistory = useCallback(async () => {
    if (isLoggedIn) {
      const history = await getSearchHistory();
      setSearchHistory(history);
    } else {
      setSearchHistory([]);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchApiHistory();
    // Fetch popular searches on mount
    fetchPopularSearches(5).then((data: PopularSearchItem[]) => {
      setPopularSearches(data);
    });
  }, [fetchApiHistory]);

  // --- Suggestion Fetching ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSearchSuggestions(searchQuery).then((data: PopularSearchItem[]) => {
          setSearchSuggestions(data);
        });
      } else {
        setSearchSuggestions([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const addToHistory = async (query: string) => {
    if (!query || !query.trim()) return;
    if (isLoggedIn) {
      // Save search history to server
      await saveSearchHistory(query.trim());
      // Refetch to update the list
      fetchApiHistory();
    }
  };

  const removeFromHistory = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (isLoggedIn) {
      const success = await deleteSearchHistory(id);
      if (success) {
        setSearchHistory(prev => prev.filter(h => h.id !== id));
      }
    }
  };

  const handleClearHistory = async () => {
    if (isLoggedIn) {
      const success = await clearSearchHistory();
      if (success) {
        setSearchHistory([]);
        setShowHistory(false);
      }
    }
  };

  // Sync with props when they change (e.g. navigation)
  useEffect(() => {
    if (initialFilters) {
      setSelectedFilters((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(initialFilters)) {
          return initialFilters;
        }
        return prev;
      });
    }
  }, [initialFilters]);

  // Sync query from props when URL changes
  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  // State สำหรับหมวดหมู่จาก API
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // State สำหรับจัดการการ swipe ปิด Drawer
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // ดึงข้อมูลหมวดหมู่จาก API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + "/category");

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();


        if (data.code === 200 && data.data) {
          setCategories(data.data);
        } else if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
    setStartY(0);
    setCurrentY(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const newY = e.touches[0].clientY;
    setCurrentY(newY);
    const distance = newY - startY;
    if (distance > 0) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    const distance = currentY - startY;
    if (distance > 80) {
      onClose();
    }
    setStartY(0);
    setCurrentY(0);
  };

  const handleCategoryChange = useCallback(
    (cateId: number, cateName: string) => {
      void cateName;
      setSelectedFilters((prev) => {
        const currentList = [...prev.categories]; // Clone array
        const index = currentList.indexOf(cateId);


        if (index > -1) {
          // Remove
          currentList.splice(index, 1);
        } else {
          // Add
          currentList.push(cateId);
        }


        return {
          ...prev,
          categories: currentList,
        };
      });
    },
    []
  );

  const handleTypeChange = useCallback((value: string) => {
    setSelectedFilters((prev) => {
      const currentList = prev.types;
      if (currentList.includes(value)) {
        return {
          ...prev,
          types: currentList.filter((item) => item !== value),
        };
      } else {
        return {
          ...prev,
          types: [...currentList, value],
        };
      }
    });
  }, []);

  const handleContentTypeChange = useCallback((value: string) => {
    setSelectedFilters((prev) => {
      const currentList = prev.content_type || [];
      if (currentList.includes(value)) {
        return {
          ...prev,
          content_type: currentList.filter((item) => item !== value),
        };
      } else {
        return {
          ...prev,
          content_type: [...currentList, value],
        };
      }
    });
  }, []);


  const handleEndChange = useCallback((value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      end: value,
    }));
  }, []);

  const removeFilter = (
    type: "categories" | "types" | "content_type" | "status" | "end",
    value: number | string
  ) => {
    if (type === "end") {
      // สำหรับ end ให้รีเซ็ตเป็น "all"
      setSelectedFilters((prev) => ({
        ...prev,
        end: "all",
      }));
    } else {
      setSelectedFilters((prev) => ({
        ...prev,
        [type]: prev[type].filter((item: any) => item !== value),
      }));
    }
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      categories: [],
      types: [],
      content_type: [],
      status: [],
      end: "all",
    });
  };

  const getAllSelectedFilters = () => {
    const filters: Array<{
      type: "categories" | "types" | "content_type" | "status" | "end";
      value: number | string;
      label: string;
    }> = [
        ...selectedFilters.categories.map((cateId) => {
          const category = categories.find((c) => c.id === cateId);
          return {
            type: "categories" as const,
            value: cateId,
            label: category?.name || `ID: ${cateId}`,
          };
        }),
        ...selectedFilters.types.map((item) => ({
          type: "types" as const,
          value: item,
          label:
            item === "tran" ? "นิยายแปล" : item === "chat" ? "นิยายแต่ง" : item,
        })),
        ...(selectedFilters.content_type || []).map((item) => ({
          type: "content_type" as const,
          value: item,
          label: item === "novel" ? "นิยายรายตอน" : item === "novel_pack" ? "นิยายมัดแพ็ค" : item,
        })),
        ...selectedFilters.status.map((item) => ({
          type: "status" as const,
          value: item,
          label:
            item === "publish"
              ? "สำเร็จแล้ว"
              : item === "draft"
                ? "ยังไม่เสร็จ"
                : item,
        })),
      ];

    // เพิ่ม end filter เฉพาะเมื่อไม่ใช่ "all"
    if (selectedFilters.end !== "all") {
      filters.push({
        type: "end" as const,
        value: selectedFilters.end,
        label:
          selectedFilters.end === "end"
            ? "จบแล้ว"
            : selectedFilters.end === "notend"
              ? "ยังไม่จบ"
              : selectedFilters.end,
      });
    }

    return filters;
  };

  const allFilters = getAllSelectedFilters();

  // No longer auto-triggering on searchQuery/debouncedQuery change
  // We only trigger when filters change OR when manual submit happens
  useEffect(() => {
    if (onSearch) {
      onSearch({
        query: searchQuery,
        categories: selectedFilters.categories,
        types: selectedFilters.types,
        content_type: selectedFilters.content_type || [],
        status: selectedFilters.status,
        end: selectedFilters.end,
        sortBy,
        order,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters, sortBy, order, onSearch]);

  const handleSearchClick = () => {
    // Save history explicitly on submit
    if (searchQuery.trim()) {
        addToHistory(searchQuery);
        setShowHistory(false);
    }

    // Trigger manual search
    if (onSearch) {
         onSearch({
            query: searchQuery,
            categories: selectedFilters.categories,
            types: selectedFilters.types,
            content_type: selectedFilters.content_type || [],
            status: selectedFilters.status,
            end: selectedFilters.end,
            sortBy,
            order,
         });
    }

    // Search is triggered automatically by useEffect
    // This function now primarily serves to close the drawer on mobile
    if (open) {
      onClose();
    }
  };

  const FilterContent = ({ isInDrawer = false }: { isInDrawer?: boolean }) => (
    <div
      className={`bg-white ${isInDrawer ? "h-[85vh] flex flex-col rounded-t-3xl" : "h-full overflow-y-auto rounded-xl shadow-md p-5"
        }`}
    >
      {/* Mobile Handle */}
      {isInDrawer && (
        <div className="w-full h-12 flex justify-center items-center cursor-grab" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${isInDrawer ? "px-5" : ""}`}>
        <div className="mb-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-2xl font-bold text-gray-800">ตัวกรอง</p>
              <p className="text-xs text-gray-400 font-medium">ค้นหาสิ่งที่ใช่สำหรับคุณ</p>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-red-500 text-sm font-semibold hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
            >
              ล้างทั้งหมด
            </button>
          </div>

          {allFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in duration-300">
              {allFilters.map((filter, index) => (
                <div
                  key={`${filter.type}-${filter.value}-${index}`}
                  className="flex items-center gap-1.5 bg-red-50 text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-full border border-red-100 shadow-sm"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(filter.type, filter.value)}
                    className="hover:bg-red-200 bg-red-100 rounded-full p-0.5 transition-colors"
                  >
                    <CloseOutlined style={{ fontSize: '8px' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Wrapper Helper */}
        {(() => {
          const SectionHeader = ({ title }: { title: string }) => (
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3 ml-1">{title}</p>
          );

          const PillContainer = ({ children }: { children: React.ReactNode }) => (
            <div className="flex flex-wrap gap-2 mb-8">
              {children}
            </div>
          );

          return (
            <>
              {/* หมวดหมู่ */}
              <div className="mb-2">
                <SectionHeader title="หมวดหมู่" />
                <div className="flex flex-wrap gap-2 mb-8 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {isLoadingCategories ? (
                    <div className="w-full flex justify-center py-4">
                        <GifLoader width={60} height={60} />
                    </div>
                  ) : categories.length > 0 ? (
                    categories.map((item, index) => {
                      const cateId = item.id;
                      const cateName = item.name;
                      const isSelected = selectedFilters.categories.includes(cateId);
                      return (
                        <button
                          key={cateId || index}
                          type="button"
                          onClick={() => handleCategoryChange(cateId, cateName)}
                          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border shadow-sm ${
                            isSelected 
                            ? "bg-red-500 border-red-500 !text-white shadow-red-100 scale-105" 
                            : "bg-white border-gray-100 text-gray-600 hover:border-red-200 hover:text-red-500"
                          }`}
                        >
                          {cateName}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-gray-300 italic text-xs w-full text-center">ไม่มีข้อมูลหมวดหมู่</p>
                  )}
                </div>
              </div>

              {/* ประเภทเนื้อหา */}
              <div className="mb-2">
                <SectionHeader title="ประเภทเนื้อหา" />
                <PillContainer>
                  {[
                    { value: "novel", label: "นิยายรายตอน" },
                    { value: "novel_pack", label: "นิยายมัดแพ็ค" },
                  ].map((item) => {
                    const isSelected = selectedFilters.content_type?.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleContentTypeChange(item.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border shadow-sm ${
                          isSelected 
                          ? "bg-red-500 border-red-500 !text-white shadow-red-100 scale-105" 
                          : "bg-white border-gray-100 text-gray-600 hover:border-red-200 hover:text-red-500"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </PillContainer>
              </div>

              {/* รูปแบบ */}
              <div className="mb-2">
                <SectionHeader title="รูปแบบ" />
                <PillContainer>
                  {[
                    { value: "tran", label: "นิยายแปล" },
                    { value: "chat", label: "นิยายแต่ง" },
                    { value: "fan", label: "แฟนฟิค" },
                    { value: "redroom", label: "เรดรูม" },
                  ].map((item) => {
                    const isSelected = selectedFilters.types.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleTypeChange(item.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border shadow-sm ${
                          isSelected 
                          ? "bg-red-500 border-red-500 !text-white shadow-red-100 scale-105" 
                          : "bg-white border-gray-100 text-gray-600 hover:border-red-200 hover:text-red-500"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </PillContainer>
              </div>

              {/* สถานะเรื่อง */}
              <div className="mb-2">
                <SectionHeader title="สถานะเรื่อง" />
                <PillContainer>
                  {[
                    { value: "all", label: "ทั้งหมด" },
                    { value: "end", label: "จบแล้ว" },
                    { value: "notend", label: "ยังไม่จบ" },
                  ].map((item) => {
                    const isSelected = selectedFilters.end === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => handleEndChange(item.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border shadow-sm ${
                          isSelected 
                          ? "bg-red-500 border-red-500 !text-white shadow-red-100 scale-105" 
                          : "bg-white border-gray-100 text-gray-600 hover:border-red-200 hover:text-red-500"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </PillContainer>
              </div>
            </>
          );
        })()}
      </div>

      <div className={`p-5 bg-white border-t border-gray-50 flex gap-3 ${isInDrawer ? "sticky bottom-0 rounded-b-3xl" : "mt-4"}`}>
        <button
          onClick={handleSearchClick}
          className="flex-1 bg-red-500 !text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-100 hover:bg-red-600 active:scale-95 transition-all text-base"
        >
          ดูรายการผลลัพธ์
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );

  return (
    <>
      {/* ช่องค้นหา */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md mb-4">
        <p className="text-lg font-semibold mb-4">ค้นหา</p>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                stroke="currentColor"
                fill="currentColor"
                viewBox="0 0 16 16"
                className="text-gray-500"
                height="1em"
                width="1em"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อเรื่อง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchClick();
                  e.currentTarget.blur();
                }
              }}
              className="block w-full rounded-md border border-gray-300 h-[40px] pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
              onFocus={() => {
                setShowHistory(true);
                fetchApiHistory();
              }}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            />
          </div>
          <button
            type="button"
            onClick={handleSearchClick}
            className="sm:hidden h-[40px] px-4 rounded-md bg-red-500 !text-white font-medium hover:bg-red-600 transition-colors flex items-center justify-center"
            aria-label="ค้นหา"
          >
            ค้นหา
          </button>

          {/* History Dropdown */}
          {showHistory && (searchHistory.length > 0 || popularSearches.length > 0 || searchSuggestions.length > 0) && (
             <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg border border-t-0 border-gray-200 z-50 max-h-60 overflow-y-auto mt-1">
              {/* Show Suggestions if user is typing */}
              {searchQuery.trim() && searchSuggestions.length > 0 && (
                <>
                  {searchSuggestions.map((item, index) => (
                    <div
                        key={`suggestion-${index}`}
                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0"
                        onMouseDown={() => { // Use onMouseDown to trigger before onBlur
                            setSearchQuery(item.normalized_keyword);
                            addToHistory(item.normalized_keyword);
                            setShowHistory(false);
                            // Trigger immediate search
                            if (onSearch) {
                                onSearch({
                                    query: item.normalized_keyword,
                                    categories: selectedFilters.categories,
                                    types: selectedFilters.types,
                                    content_type: selectedFilters.content_type || [],
                                    status: selectedFilters.status,
                                    end: selectedFilters.end,
                                    sortBy,
                                    order,
                                });
                            }
                        }}
                    >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                             <svg stroke="currentColor" fill="currentColor" viewBox="0 0 16 16" className="text-gray-400 flex-shrink-0" height="1em" width="1em">
                               <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"></path>
                             </svg>
                             <span className="truncate">{item.normalized_keyword}</span>
                        </div>
                    </div>
                  ))}
                </>
              )}
              {/* Show Search History if no query and history exists */}
              {!searchQuery.trim() && searchHistory.length > 0 && (
                <>
                  <p className="px-4 py-2 text-xs text-gray-500 font-semibold border-b border-gray-100">ประวัติการค้นหา</p>
                  {searchHistory.map((item, index) => (
                    <div
                        key={item.id || index}
                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0"
                        onMouseDown={() => {
                            setSearchQuery(item.keyword);
                            addToHistory(item.keyword);
                            setShowHistory(false);
                            // Trigger immediate search
                            if (onSearch) {
                                onSearch({
                                    query: item.keyword,
                                    categories: selectedFilters.categories,
                                    types: selectedFilters.types,
                                    content_type: selectedFilters.content_type || [],
                                    status: selectedFilters.status,
                                    end: selectedFilters.end,
                                    sortBy,
                                    order,
                                });
                            }
                        }}
                    >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                             <HistoryOutlined className="text-gray-400 flex-shrink-0" />
                             <span className="truncate">{item.keyword}</span>
                        </div>
                        <div 
                            className="p-1 hover:bg-gray-200 rounded-full cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                            onMouseDown={(e) => removeFromHistory(e, item.id)}
                        >
                            <CloseOutlined style={{ fontSize: '10px' }} />
                        </div>
                    </div>
                ))}
                <div 
                    className="flex justify-center p-2 bg-gray-50 text-xs text-gray-500 hover:text-red-500 cursor-pointer transition-colors"
                    onClick={handleClearHistory}
                >
                    ล้างประวัติการค้นหา
                </div>
                </>
              )}
             </div>
           )}
        </div>

        {/* Popular Keywords Pills */}
        {popularSearches.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap uppercase tracking-wider">ยอดนิยม:</span>
            <div className="flex flex-wrap gap-1.5 overflow-hidden">
              {popularSearches.map((item, index) => (
                <button
                  key={`popular-${index}`}
                  type="button"
                  onClick={() => {
                    setSearchQuery(item.normalized_keyword);
                    if (onSearch) {
                      onSearch({
                        query: item.normalized_keyword,
                        categories: selectedFilters.categories,
                        types: selectedFilters.types,
                        content_type: selectedFilters.content_type || [],
                        status: selectedFilters.status,
                        end: selectedFilters.end,
                        sortBy,
                        order,
                      });
                    }
                    addToHistory(item.normalized_keyword);
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-100 text-gray-600 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-100 hover:shadow-sm transition-all duration-200 whitespace-nowrap"
                >
                  {item.normalized_keyword}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* แถบตัวกรองและ Sort สำหรับมือถือ */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center gap-2">
          <select
            className="flex-1 w-full border border-gray-200 rounded-md text-xs px-2 py-1 h-[36px] text-gray-700 bg-gray-50 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white"
            value={selectedFilters.content_type?.[0] || ""}
            onChange={(e) => {
               const val = e.target.value;
               setSelectedFilters(prev => ({
                   ...prev,
                   content_type: val ? [val] : []
               }));
            }}
          >
            <option value="">ทั้งหมด</option>
            <option value="novel">นิยายรายตอน</option>
            <option value="novel_pack">นิยายมัดแพ็ค</option>
          </select>

          <Button
            icon={<FilterOutlined style={{ color: "white" }} />}
            onClick={showDrawer}
            htmlType="button"
            className="flex items-center justify-center"
            style={{
              minWidth: "36px",
              width: "36px",
              height: "36px",
              padding: 0,
              border: "none",
              backgroundColor: "#ef4444",
            }}
          />
        </div>
      </div>

      {/* ตัวกรองแบบปกติสำหรับหน้าจอใหญ่ */}
      <div className="hidden lg:block">
        <FilterContent isInDrawer={false} />
      </div>

      {/* Drawer สำหรับมือถือ */}
      <Drawer
        placement="bottom"
        onClose={onClose}
        open={open}
        height="90vh"
        title={null}
        closeIcon={null}
        styles={{
          body: {
            padding: 0,
            overflow: "hidden",
          },
          header: {
            display: "none",
          },
        }}
      >
        <div
          style={{ height: "100%", overflow: "auto" }}
        >
          <FilterContent isInDrawer={true} />
        </div>
      </Drawer>
    </>
  );
}

export default SearchBar;
