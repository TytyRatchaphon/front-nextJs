"use client";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { App, Modal } from "antd";
import { ChevronRight, Sparkles, Trophy, X } from "lucide-react";
import {
  fetchAchievementShowcase,
  fetchCompletedAchievements,
  updateAchievementShowcase,
} from "@/services/api/achievementApi";
//0838773498
const MAX_SHOWCASE = 6;

const getAchievementId = (ach: any): number | null => {
  const raw = ach?.achievement_id ?? ach?.achievement?.id ?? ach?.id;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
};

const getAchievementTitle = (ach: any): string => {
  return ach?.achievement?.title || ach?.title || "Achievement";
};

const getAchievementIcon = (ach: any): string | null => {
  return ach?.achievement?.icon_url || ach?.icon_url || null;
};

const getShowcaseOrder = (ach: any): number => {
  const n = Number(ach?.showcase_order ?? ach?.showcaseOrder ?? 999999);
  return Number.isFinite(n) ? n : 999999;
};

const isShowcaseItem = (ach: any): boolean => {
  const v = ach?.is_showcased ?? ach?.is_showcase;
  return v === true || v === 1 || v === "1" || v === "true";
};

const completedDateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const getCompletedAtTime = (ach: any): number => {
  const raw = ach?.completed_at ?? ach?.completedAt;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
};

const getCompletedAtLabel = (ach: any): string | null => {
  const t = getCompletedAtTime(ach);
  if (!t) return null;
  return completedDateFormatter.format(new Date(t));
};

export default function ProfileAchievements() {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const { data: showcaseRaw = [], isLoading: showcaseLoading } = useQuery({
    queryKey: ["achievementShowcase"],
    queryFn: fetchAchievementShowcase,
    staleTime: 1000 * 60 * 5,
  });

  const { data: completedAchievements = [], isLoading: completedLoading } = useQuery({
    queryKey: ["completedAchievements"],
    queryFn: fetchCompletedAchievements,
    staleTime: 1000 * 60 * 5,
  });

  const showcaseAchievements = useMemo(
    () =>
      [...showcaseRaw]
        .filter(isShowcaseItem)
        .sort((a, b) => {
          const byOrder = getShowcaseOrder(a) - getShowcaseOrder(b);
          if (byOrder !== 0) return byOrder;
          return getCompletedAtTime(b) - getCompletedAtTime(a);
        })
        .slice(0, MAX_SHOWCASE),
    [showcaseRaw]
  );

  const completedSelectable = useMemo(
    () =>
      [...completedAchievements]
        .filter((ach: any) => getAchievementId(ach) !== null)
        .sort((a, b) => getCompletedAtTime(b) - getCompletedAtTime(a)),
    [completedAchievements]
  );

  const achievementById = useMemo(() => {
    const map = new Map<number, any>();
    [...completedSelectable, ...showcaseAchievements].forEach((ach: any) => {
      const id = getAchievementId(ach);
      if (id !== null && !map.has(id)) {
        map.set(id, ach);
      }
    });
    return map;
  }, [completedSelectable, showcaseAchievements]);

  const showcaseSlots = useMemo(
    () => Array.from({ length: MAX_SHOWCASE }, (_, idx) => showcaseAchievements[idx] || null),
    [showcaseAchievements]
  );

  const selectedItems = useMemo(
    () => selectedIds.map((id) => achievementById.get(id)).filter((ach): ach is any => Boolean(ach)),
    [selectedIds, achievementById]
  );

  const selectedSlots = useMemo(
    () => Array.from({ length: MAX_SHOWCASE }, (_, idx) => selectedItems[idx] || null),
    [selectedItems]
  );

  useEffect(() => {
    if (!showPicker) return;

    const preSelected = showcaseAchievements
      .map(getAchievementId)
      .filter((id): id is number => id !== null)
      .slice(0, MAX_SHOWCASE);
    setSelectedIds(preSelected);
  }, [showPicker, showcaseAchievements]);

  const saveShowcaseMutation = useMutation({
    mutationFn: (ids: number[]) => updateAchievementShowcase(ids),
    onSuccess: () => {
      notification.success({
        message: "บันทึกโชว์เคสสำเร็จ",
        placement: "topRight",
      });
      queryClient.invalidateQueries({ queryKey: ["achievementShowcase"] });
      queryClient.invalidateQueries({ queryKey: ["completedAchievements"] });
      setShowPicker(false);
    },
    onError: (err: any) => {
      notification.error({
        message: err?.response?.data?.message || "ไม่สามารถบันทึกโชว์เคสได้",
        placement: "topRight",
      });
    },
  });

  const toggleSelect = (achievementId: number) => {
    const isSelected = selectedIds.includes(achievementId);

    if (isSelected) {
      setSelectedIds((prev) => prev.filter((id) => id !== achievementId));
      return;
    }

    if (selectedIds.length >= MAX_SHOWCASE) {
      notification.warning({
        message: `เลือกได้สูงสุด ${MAX_SHOWCASE} รายการ`,
        placement: "topRight",
      });
      return;
    }

    setSelectedIds((prev) => [...prev, achievementId]);
  };

  const openPicker = () => {
    setShowPicker(true);
  };

  const handleSaveShowcase = () => {
    saveShowcaseMutation.mutate(selectedIds);
  };

  if (showcaseLoading) {
    return (
      <div className="w-full rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-5 shadow-sm animate-pulse">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-amber-200" />
            <div className="h-5 w-28 rounded bg-amber-200" />
          </div>
          <div className="h-6 w-12 rounded-full bg-amber-200" />
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {[...Array(MAX_SHOWCASE)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-[#FFF6E9] via-[#FFF9EF] to-[#FFEFD6] p-5 shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-8 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-orange-300/20 blur-2xl" />

        <div className="relative z-10 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E33527]/10 text-[#E33527]">
              <Trophy size={16} />
            </div>
            <p className="mx-1 my-1 text-sm font-bold text-gray-800">เกียรติยศ</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-white/80 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <Sparkles size={12} />
            {showcaseAchievements.length}
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {showcaseSlots.map((ach: any, idx: number) => {
            if (!ach) {
              return (
                <button
                  key={`empty-slot-${idx}`}
                  type="button"
                  onClick={openPicker}
                  disabled={completedLoading || completedSelectable.length === 0}
                  className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-white/60 px-3 text-center transition-colors hover:border-[#E33527]/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-2xl font-light text-amber-600">
                    +
                  </span>
                  <p className="text-sm font-semibold text-gray-600">เพิ่ม Showcase</p>
                  <p className="text-xs text-gray-400">ช่องที่ {idx + 1}</p>
                </button>
              );
            }

            const title = getAchievementTitle(ach);
            const icon = getAchievementIcon(ach);
            const completedAtLabel = getCompletedAtLabel(ach);

            return (
              <Link
                key={getAchievementId(ach) ?? `showcase-${idx}`}
                href="/achievement"
                className="group rounded-xl border border-gray-200/70 bg-white/80 p-3 transition-all duration-200 hover:border-[#E33527]/25 hover:bg-white hover:shadow-sm"
              >
                <div className="flex min-h-[120px] flex-col items-center text-center">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-amber-200 bg-white shadow-sm">
                    {icon ? (
                      <Image src={icon} alt={title} width={30} height={30} className="object-contain" unoptimized />
                    ) : (
                      <Trophy size={18} className="text-amber-500" />
                    )}
                  </div>
                  <p className="line-clamp-2 min-h-[48px] text-center text-base font-bold text-gray-800 group-hover:text-[#E33527]">{title}</p>
                  <p className="mt-1 min-h-[20px] line-clamp-1 text-center text-xs text-gray-500">
                        {completedAtLabel ? `สำเร็จเมื่อ ${completedAtLabel}` : ""}
                  </p>
                  <span className="mt-auto inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {"สำเร็จ"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="relative z-10 mt-3 flex justify-end">
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-1 rounded-xl border border-white/70 bg-white/80 px-3 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:text-[#E33527]"
          >
            แก้ไข Showcase
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <Modal
        open={showPicker}
        onCancel={() => setShowPicker(false)}
        footer={null}
        centered
        width={620}
        zIndex={5000}
        closeIcon={<X size={20} />}
        styles={{ body: { padding: 0 } }}
      >
        <div className="bg-gradient-to-r from-[#E33527] to-[#FF6B5A] p-5 text-white">
          <h3 className="text-lg font-bold">เลือก Achievement ที่จะแสดง</h3>
          <p className="text-sm text-white/85">เลือกได้สูงสุด {MAX_SHOWCASE} รายการ</p>
        </div>

        <div className="p-4">
          <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            เลือกแล้ว {selectedIds.length}/{MAX_SHOWCASE}
          </div>

          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold text-gray-500">SELECTED</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {selectedSlots.map((ach: any, idx: number) => {
                if (!ach) {
                  return (
                    <div
                      key={`selected-empty-${idx}`}
                      className="flex h-24 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400"
                    >
                      <span className="text-xl">+</span>
                      <span className="text-xs">ว่าง</span>
                    </div>
                  );
                }

                const achId = getAchievementId(ach);
                const title = getAchievementTitle(ach);
                const icon = getAchievementIcon(ach);

                return (
                  <button
                    key={`selected-${achId ?? idx}`}
                    type="button"
                    onClick={() => {
                      if (achId !== null) toggleSelect(achId);
                    }}
                    className="relative h-24 rounded-xl border border-[#E33527]/50 bg-red-50 p-2 text-left"
                  >
                    <span className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#E33527] shadow-sm">
                      <X size={12} />
                    </span>
                    <div className="mb-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-amber-200 bg-white">
                      {icon ? (
                        <Image src={icon} alt={title} width={20} height={20} className="object-contain" unoptimized />
                      ) : (
                        <Trophy size={14} className="text-amber-500" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs font-semibold text-gray-700">{title}</p>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500">กดรายการที่เลือกแล้วซ้ำอีกครั้ง เพื่อนำออกจาก Showcase</p>
          </div>

          {completedLoading ? (
            <p className="py-8 text-center text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
          ) : completedSelectable.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">ยังไม่มี Achievement ที่สำเร็จแล้ว</p>
          ) : (
            <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
              {completedSelectable.map((ach: any) => {
                const achId = getAchievementId(ach)!;
                const isSelected = selectedIds.includes(achId);
                const title = getAchievementTitle(ach);
                const icon = getAchievementIcon(ach);
                const completedAtLabel = getCompletedAtLabel(ach);

                return (
                  <button
                    key={achId}
                    type="button"
                    onClick={() => toggleSelect(achId)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                      isSelected ? "border-[#E33527] bg-red-50" : "border-gray-200 bg-white hover:border-[#E33527]/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-200 bg-white shadow-sm">
                        {icon ? (
                          <Image src={icon} alt={title} width={24} height={24} className="object-contain" unoptimized />
                        ) : (
                          <Trophy size={16} className="text-amber-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-semibold text-gray-700">{title}</p>
                        {completedAtLabel && <p className="mt-0.5 text-xs text-gray-400">สำเร็จเมื่อ {completedAtLabel}</p>}
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          isSelected ? "bg-[#E33527] text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isSelected ? "Selected" : "เลือก"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSaveShowcase}
              disabled={saveShowcaseMutation.isPending}
              className="flex-1 rounded-xl bg-[#E33527] py-2.5 text-sm font-semibold !text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveShowcaseMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}


