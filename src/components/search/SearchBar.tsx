"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Drawer, Button } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import GifLoader from '@/components/utility/GifLoader';

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
    status: string[];
    end: string;
    sortBy: string;
    order: string;
  }) => void;
}

function SearchBar({ onSearch, initialFilters, initialQuery = "" }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState("date_at");
  const [order] = useState("DESC");

  // Initialize from parent props if available
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(initialFilters || {
    categories: [],
    types: [],
    status: [],
    end: "all",
  });

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
      } catch (error) {
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


  const handleEndChange = useCallback((value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      end: value,
    }));
  }, []);

  const removeFilter = (
    type: "categories" | "types" | "status" | "end",
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
      status: [],
      end: "all",
    });
  };

  const getAllSelectedFilters = () => {
    const filters: Array<{
      type: "categories" | "types" | "status" | "end";
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

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-trigger search when filters or debounced query change
  useEffect(() => {
    if (onSearch) {
      onSearch({
        query: debouncedQuery,
        categories: selectedFilters.categories,
        types: selectedFilters.types,
        status: selectedFilters.status,
        end: selectedFilters.end,
        sortBy,
        order,
      });
    }
  }, [debouncedQuery, selectedFilters, sortBy, order, onSearch]);

  const handleSearchClick = () => {
    // Search is triggered automatically by useEffect
    // This function now primarily serves to close the drawer on mobile
    if (open) {
      onClose();
    }
  };

  const FilterContent = ({ isInDrawer = false }: { isInDrawer?: boolean }) => (
    <div
      className={`bg-white rounded-xl p-5 shadow-md ${isInDrawer ? "h-full flex flex-col" : "h-full overflow-y-auto"
        }`}
    >
      <div className={isInDrawer ? "flex-1 overflow-y-auto" : ""}>
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">ตัวกรอง</p>
            <button
              onClick={clearAllFilters}
              className="text-red-500 text-sm hover:text-red-600"
            >
              ล้าง
            </button>
          </div>

          {allFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {allFilters.map((filter, index) => (
                <div
                  key={`${filter.type}-${filter.value}-${index}`}
                  className="flex items-center gap-1 bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(filter.type, filter.value)}
                    className="hover:bg-red-100 rounded-full p-0.5"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <hr className="border-t border-gray-300 mb-3" />
        </div>

        {/* หมวดหมู่ */}
        <div className="mb-5">
          <p className="font-medium mb-2">หมวดหมู่</p>
          <div className="flex flex-col gap-2 text-sm max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {isLoadingCategories ? (
              <GifLoader width={80} height={80} className="py-4" />
            ) : categories.length > 0 ? (
              categories.map((item, index) => {
                const cateId = item.id;
                const cateName = item.name;
                return (
                  <label
                    key={cateId || index}
                    className="flex items-center gap-2 cursor-pointer hover:text-red-500"
                  >
                    <input
                      type="checkbox"
                      className="accent-red-500 cursor-pointer w-4 h-4"
                      checked={selectedFilters.categories.includes(cateId)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleCategoryChange(cateId, cateName);
                      }}
                    />
                    <span className="select-none">{cateName}</span>
                  </label>
                );
              })
            ) : (
              <p className="text-gray-400 text-center py-2">ไม่มีหมวดหมู่</p>
            )}
          </div>
        </div>

        {/* รูปแบบ */}
        <div className="mb-5">
          <p className="font-medium mb-2">รูปแบบ</p>
          <div className="flex flex-col gap-2 text-sm">
            {[
              { value: "tran", label: "นิยายแปล" },
              { value: "chat", label: "นิยายแต่ง" },
              { value: "fan", label: "แฟนฟิค" },
              { value: "redroom", label: "เรดรูม" },
            ].map((item) => (
              <label
                key={item.value}
                className="flex items-center gap-2 cursor-pointer hover:text-red-500"
              >
                <input
                  type="checkbox"
                  className="accent-red-500 cursor-pointer w-4 h-4"
                  checked={selectedFilters.types.includes(item.value)}
                  onChange={() => handleTypeChange(item.value)}
                />
                <span className="select-none">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* สถานะการเขียน */}
        {/* <div className="mb-5">
          <p className="font-medium mb-2">สถานะการเขียน</p>
          <div className="flex flex-col gap-2 text-sm">
            {[
              { value: "publish", label: "สำเร็จแล้ว" },
              { value: "draft", label: "ยังไม่เสร็จ" },
            ].map((item) => (
              <label
                key={item.value}
                className="flex items-center gap-2 cursor-pointer hover:text-red-500"
              >
                <input
                  type="checkbox"
                  className="accent-red-500 cursor-pointer w-4 h-4"
                  checked={selectedFilters.status.includes(item.value)}
                  onChange={() => handleStatusChange(item.value)}
                />
                <span className="select-none">{item.label}</span>
              </label>
            ))}
          </div>
        </div> */}

        {/* สถานะเรื่อง */}
        <div className="mb-5">
          <p className="font-medium mb-2">สถานะเรื่อง</p>
          <div className="flex flex-col gap-2 text-sm">
            {[
              { value: "all", label: "ทั้งหมด" },
              { value: "end", label: "จบแล้ว" },
              { value: "notend", label: "ยังไม่จบ" },
            ].map((item) => (
              <label
                key={item.value}
                className="flex items-center gap-2 cursor-pointer hover:text-red-500"
              >
                <input
                  type="radio"
                  name="endStatus"
                  className="accent-red-500 cursor-pointer w-4 h-4"
                  checked={selectedFilters.end === item.value}
                  onChange={() => handleEndChange(item.value)}
                />
                <span className="select-none">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div
        className={
          isInDrawer
            ? "sticky bottom-0 bg-white pt-3 pb-3 px-1 border-t"
            : "mt-5"
        }
      >
        <button
          onClick={handleSearchClick}
          className={`w-full bg-red-500 rounded-md hover:bg-red-600 !text-white font-semibold ${isInDrawer ? "py-4 text-base" : "py-2 text-sm"
            }`}
        >
          ดูผลลัพธ์
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ช่องค้นหา */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-md mb-4">
        <p className="text-lg font-semibold mb-4">ค้นหา</p>
        <div className="relative">
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
              }
            }}
            className="block w-full rounded-md border border-gray-300 h-[40px] pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          />
        </div>
      </div>

      {/* แถบตัวกรองและ Sort สำหรับมือถือ */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center gap-2">
          <select
            className="flex-2 border border-gray-200 rounded-md text-xs px-2 py-1 h-[36px] text-gray-500 bg-gray-50 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date_at">ล่าสุด</option>
            <option value="view">ยอดนิยม</option>
          </select>

          <Button
            icon={<FilterOutlined style={{ color: "white" }} />}
            onClick={showDrawer}
            className="flex items-center justify-center"
            style={{
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
        title={
          <div className="flex flex-col items-center w-full">
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full flex justify-center py-2 cursor-grab active:cursor-grabbing touch-none"
              style={{ marginTop: "-10px", marginBottom: "5px" }}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <span>ตัวกรอง</span>
          </div>
        }
        placement="bottom"
        onClose={onClose}
        open={open}
        height="90vh"
        closeIcon={null}
        styles={{
          body: {
            padding: 0,
            touchAction: "pan-y",
          },
          header: {
            padding: "10px 16px",
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