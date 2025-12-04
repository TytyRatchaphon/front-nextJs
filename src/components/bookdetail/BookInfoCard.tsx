"use client";

import Image from "next/image";
import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Modal, Checkbox, Spin, Button, message, notification, App } from "antd";
import { useQuery } from "@tanstack/react-query";
import { fetchBookEpisodes } from "@/services/apiServices";
import apiClient from "@/services/apiClient";
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/uiStore';

type Book = {
  cover: string;
  title: string;
  author: string;
  price?: number;
  remaining_paid_total?: number;
  remaining_paid_count?: number;
  chapters?: number;
  views?: number;
  reviews?: number;
  tag?: string;
  promotion?: {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    percent: number;
    price: number;
  };
};

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-white drop-shadow-sm">
      <div className="bg-black/20 rounded px-1.5 py-0.5 min-w-[20px] text-center backdrop-blur-sm">
        {String(timeLeft.days).padStart(2, '0')}
      </div>
      <span>:</span>
      <div className="bg-black/20 rounded px-1.5 py-0.5 min-w-[20px] text-center backdrop-blur-sm">
        {String(timeLeft.hours).padStart(2, '0')}
      </div>
      <span>:</span>
      <div className="bg-black/20 rounded px-1.5 py-0.5 min-w-[20px] text-center backdrop-blur-sm">
        {String(timeLeft.minutes).padStart(2, '0')}
      </div>
      <span>:</span>
      <div className="bg-black/20 rounded px-1.5 py-0.5 min-w-[20px] text-center backdrop-blur-sm">
        {String(timeLeft.seconds).padStart(2, '0')}
      </div>
    </div>
  );
};



interface BookInfoCardProps {
  book: Book;
  bookId?: string | number | null;
}

const Pill = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`h-10 px-3 rounded-full border border-gray-200 bg-white shadow-sm flex items-center gap-2 ${className}`}
  >
    {children}
  </div>
);

const BookInfoCard = ({ book, bookId }: BookInfoCardProps) => {
  const [heartQty] = useState<number>(0);
  const [roseQty, setRoseQty] = useState<number>(10);
  const { token, isLoggedIn, updateToken } = useAuthStore();
  const openLoginModal = useUIStore((s) => s.openLoginModal);
  const queryClient = useQueryClient();
  const { message: messageApi, modal: modalApi, notification: notificationApi } = App.useApp();
  const [buyLoading, setBuyLoading] = useState(false);
  const [userCoinCount, setUserCoinCount] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<number[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Fetch episodes when modal opens
  const queryResult: any = useQuery({
    queryKey: ["bookEpisodes", String(bookId ?? "")],
    queryFn: () => fetchBookEpisodes(String(bookId ?? "")),
    enabled: isModalOpen && !!bookId,
    staleTime: 5 * 60 * 1000,
  });
  const episodesData = queryResult.data as any;
  const isFetching = queryResult.isFetching as boolean;

  const openModal = () => {
    setSelectedEpisodeIds([]);
    // expand first group by default when opening
    if (episodesData?.groups && episodesData.groups.length > 0) {
      const firstId = String(episodesData.groups[0].group_id);
      const map: Record<string, boolean> = {};
      for (const g of episodesData.groups) map[String(g.group_id)] = false;
      map[firstId] = true;
      setExpandedGroups(map);
    }
    setIsModalOpen(true);
  };

  const handleBuyPromotion = async () => {
    if (buyLoading) return;
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!book.promotion?.id) {
      messageApi.error('ไม่พบข้อมูลโปรโมชั่น');
      return;
    }

    modalApi.confirm({
      title: 'ยืนยันการซื้อโปรโมชั่น',
      content: (
        <div>
          <div>คุณต้องการซื้อโปรโมชั่น "{book.promotion.title}" หรือไม่?</div>
          <div className="flex mt-2">ราคาโปรโมชั่น: <b className="text-red-600 flex mr-2">{book.promotion.price.toLocaleString()}</b><Image src="/images/e-coin.png" alt="Coin" width={24} height={24} /></div>
        </div>
      ),
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          setBuyLoading(true);
          const payload = { dfb_id: book.promotion?.id, payWith: 'coin' };
          const res = await apiClient.post(`/buy/groupPromotion`, payload);
          if (res?.data?.code === 200) {
            const respMsg = res.data?.message || 'ซื้อโปรโมชั่นสำเร็จ!';
            notificationApi.success({
              message: 'สำเร็จ',
              description: respMsg,
              placement: 'topRight',
            });

            const maybeToken = res?.data?.data?.token ?? res?.data?.token ?? res?.data?.data?.authToken ?? res?.data?.data?.accessToken;
            if (maybeToken && typeof updateToken === 'function') {
              try {
                updateToken(String(maybeToken));
              } catch (err) {
                console.warn('Failed to update token from purchase response', err);
              }
            }

            await queryClient.invalidateQueries({ queryKey: ["bookEpisodes", String(bookId ?? "")] });
            await queryClient.invalidateQueries({ queryKey: ["bookDetail", String(bookId ?? "")] });
          } else {
            const errMsg = res?.data?.message || 'ไม่สามารถทำการซื้อได้';
            messageApi.error(errMsg);
          }
        } catch (err: any) {
          console.error('Buy promotion failed', err);
          const msg = err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาดขณะซื้อ';
          messageApi.error(msg);
        } finally {
          setBuyLoading(false);
        }
      },
      onCancel: () => {
        setBuyLoading(false);
      },
    });
  };

  const handleBuyAllClick = async () => {
    if (buyLoading) return;
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!bookId) {
      messageApi.error('ไม่พบข้อมูลหนังสือ');
      return;
    }

    try {
      setBuyLoading(true);
      const epsData: any = await fetchBookEpisodes(String(bookId));
      const groups = epsData?.groups ?? [];
      const selectableIds: number[] = [];
      let total = 0;
      for (const g of groups) {
        for (const ep of g.list) {
          if (ep.coin > 0 && !ep.isBuy) {
            selectableIds.push(Number(ep.ep_id));
            total += Number(ep.coin || 0);
          }
        }
      }

      if (selectableIds.length === 0) {
        messageApi.info('ไม่มีตอนที่ต้องชำระเงินให้ซื้อทั้งหมด');
        setBuyLoading(false);
        return;
      }

      modalApi.confirm({
        title: 'ยืนยันการซื้อ',
        content: (
          <div>
            <div>คุณต้องการซื้อทั้งเรื่องหรือไม่?</div>
            <div className="mt-2">ตอนที่ต้องซื้อ: <b>{selectableIds.length} ตอน</b></div>
            <div className="flex">รวมยอด: <b className="text-red-600 flex mr-2">{total.toLocaleString()}</b><Image src="/images/e-coin.png" alt="Coin" width={24} height={24} /></div>
          </div>
        ),
        okText: 'ยืนยัน',
        cancelText: 'ยกเลิก',
        onOk: async () => {
          try {
            const payload = { eps: selectableIds.map((id) => Number(id)), payWith: 'coin' };
            const res = await apiClient.post(`/buy/eps`, payload);
            if (res?.data?.code === 200) {
              const respMsg = res.data?.message || 'ซื้อสำเร็จ!';
              notificationApi.success({
                message: 'สำเร็จ',
                description: respMsg,
                placement: 'topRight',
              });

              const maybeToken = res?.data?.data?.token ?? res?.data?.token ?? res?.data?.data?.authToken ?? res?.data?.data?.accessToken;
              if (maybeToken && typeof updateToken === 'function') {
                try {
                  updateToken(String(maybeToken));
                } catch (err) {
                  console.warn('Failed to update token from purchase response', err);
                }
              }

              await queryClient.invalidateQueries({ queryKey: ["bookEpisodes", String(bookId ?? "")] });
              await queryClient.invalidateQueries({ queryKey: ["bookDetail", String(bookId ?? "")] });
            } else {
              const errMsg = res?.data?.message || 'ไม่สามารถทำการซื้อได้';
              messageApi.error(errMsg);
            }
          } catch (err: any) {
            console.error('Buy all failed', err);
            const msg = err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาดขณะซื้อ';
            messageApi.error(msg);
          } finally {
            setBuyLoading(false);
          }
        },
        onCancel: () => {
          setBuyLoading(false);
        },
      });
    } catch (err) {
      console.error('Preparing buy all failed', err);
      messageApi.error('เกิดข้อผิดพลาด ขณะเตรียมการซื้อ');
      setBuyLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEpisodeIds([]);
  };

  const toggleEpisode = (epId: number) => {
    setSelectedEpisodeIds((prev) =>
      prev.includes(epId) ? prev.filter((id) => id !== epId) : [...prev, epId]
    );
  };

  const toggleGroup = (groupId: string | number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [String(groupId)]: !prev[String(groupId)],
    }));
  };

  const toggleGroupSelect = (group: any) => {
    // select all selectable episodes in group, or deselect if all already selected
    const selectable = group.list.filter((ep: any) => ep.coin > 0 && !ep.isBuy).map((ep: any) => ep.ep_id);
    const allSelected = selectable.every((id: number) => selectedEpisodeIds.includes(id));
    if (allSelected) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => !selectable.includes(id)));
    } else {
      setSelectedEpisodeIds((prev) => Array.from(new Set([...prev, ...selectable])));
    }
  };

  const selectedSummary = useMemo(() => {
    if (!episodesData?.groups) return { count: 0, total: 0 };
    let total = 0;
    for (const g of episodesData.groups) {
      for (const ep of g.list) {
        if (selectedEpisodeIds.includes(ep.ep_id) && ep.coin > 0) total += Number(ep.coin || 0);
      }
    }
    return { count: selectedEpisodeIds.length, total };
  }, [selectedEpisodeIds, episodesData]);

  const allSelectableIds = useMemo(() => {
    if (!episodesData?.groups) return [] as number[];
    const ids: number[] = [];
    for (const g of episodesData.groups) {
      for (const ep of g.list) {
        if (ep.coin > 0 && !ep.isBuy) ids.push(ep.ep_id);
      }
    }
    return ids;
  }, [episodesData]);

  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedEpisodeIds.includes(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedEpisodeIds((prev) => prev.filter((id) => !allSelectableIds.includes(id)));
    } else {
      setSelectedEpisodeIds((prev) => Array.from(new Set([...prev, ...allSelectableIds])));
    }
  };

  useEffect(() => {
    if (!token) {
      setUserCoinCount(null);
      return;
    }

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      const coins = decoded.coin ?? decoded.coins ?? decoded.goldCoins ?? decoded.gold_coin ?? 0;
      setUserCoinCount(Number(coins) || 0);
    } catch (e) {
      console.warn("Failed to decode token for coin count", e);
      setUserCoinCount(null);
    }
  }, [token]);

  return (
    <aside className="w-full">
      {/* Outer card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-4">
        {/* Title row and coins pill */}
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-gray-900">ซื้อหลายตอน</h3>
          <div className="relative">
            <div
              role="button"
              tabIndex={0}
              onClick={() => { if (!isLoggedIn) openLoginModal(); }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') && !isLoggedIn) openLoginModal(); }}
              className={`inline-block`}
            >
              {isLoggedIn ? (
                <Pill className="pr-10">
                  <Image
                    src="/images/e-coin.png"
                    alt="Coin"
                    width={20}
                    height={20}
                  />
                  <span className="font-semibold text-gray-900">{(userCoinCount != null ? userCoinCount : (book.remaining_paid_total ?? book.price ?? 0)).toLocaleString()}</span>
                </Pill>
              ) : (
                <Pill className="px-6 bg-gray-50 border-dashed border-gray-200 text-gray-600 cursor-pointer justify-center">
                  <span className="text-sm font-medium">เข้าสู่ระบบ</span>
                </Pill>
              )}
            </div>
            {isLoggedIn && (
                          <button
              aria-label="เพิ่มเหรียญ"
              onClick={() => { if (!isLoggedIn) openLoginModal(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-500 text-white grid place-items-center shadow"
            >
              <span className="text-xl leading-none mb-1">+</span>
            </button>
            )}
          </div>
        </div>

        <div className="px-5 pb-5">
          {isLoggedIn && Number(book.remaining_paid_count ?? 0) === 0 ? (
            <div className="px-5 pb-5">
              <p className="text-[14px] text-gray-800 mb-3 font-semibold">คุณเป็นเจ้าของนิยายนี้ทั้งหมดแล้ว</p>
            </div>
          ) : (
            <>
              {/* Ownership Status */}
              {isLoggedIn && (
                <p className="text-[14px] text-gray-800 mb-3">
                  คุณยังไม่ได้เป็นเจ้าของอีก{" "}
                  <span className="text-red-600 font-semibold">{book.remaining_paid_count ?? 0} ตอน</span>
                </p>
              )}

              {/* Promotion Banner */}
              {book.promotion && (
                <div className="mb-3 rounded-xl overflow-hidden bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md">
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs font-medium opacity-90 mb-0.5 drop-shadow-sm">โปรโมชั่นพิเศษ</div>
                        <h4 className="font-bold text-lg leading-tight drop-shadow-md">{book.promotion.title}</h4>
                      </div>
                      <div className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-lg shadow-sm whitespace-nowrap">
                        ลด {book.promotion.percent}%
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 mb-2 pt-3 border-t border-white/20">
                      <div className="text-xs opacity-90 drop-shadow-sm">เหลือเวลาอีก</div>
                      <CountdownTimer endDate={book.promotion.endDate} />
                    </div>
                    
                    <button
                      onClick={handleBuyPromotion}
                      disabled={buyLoading}
                      className="group w-full mt-4 bg-white !text-red-600 font-bold py-3 rounded-xl text-sm hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg border-2 border-white/50"
                    >
                      {buyLoading ? <Spin size="small" /> : (
                        <>
                          <span className="text-lg !text-red-600 ">ซื้อราคาโปรโมชั่น</span>
                          <div className="flex items-center gap- bg-red-50 px-3 py-1 rounded-full border border-red-100 group-hover:bg-red-100 transition-colors">
                            <span className="!text-red-600 font-extrabold text-base">{book.promotion.price.toLocaleString()}</span>
                            <Image src="/images/e-coin.png" alt="Coin" width={18} height={18} className="drop-shadow-sm" />
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Price box */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleBuyAllClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { handleBuyAllClick(); } }}
                className="rounded-2xl bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-200 shadow-inner px-5 py-3 mb-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-gray-800">
                      เหมาทั้งเรื่อง
                    </span>
                    <Image src="/images/e-coin.png" alt="Coin" width={20} height={20} />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl leading-none font-extrabold text-red-600">
                      {(book.remaining_paid_total ?? book.price ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center text-gray-500 text-xs mb-3">หรือ</div>
              <button
                onClick={openModal}
                className="w-full h-12 rounded-2xl border-2 border-red-600 text-red-600 text-lg font-bold hover:bg-red-50 transition-colors"
              >
                เลือกเอง
              </button>

              <Modal
                wrapClassName="book-select-modal"
                title={null}
                open={isModalOpen}
                onCancel={closeModal}
                footer={
                  <div className="w-full flex items-center justify-between">
                    <Button onClick={closeModal} className="border border-red-200 text-red-600 bg-white hover:bg-red-50">ยกเลิก</Button>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-700">เลือก {selectedSummary.count} ตอน</div>
                      <div className="text-sm font-semibold text-red-600">รวม {selectedSummary.total} ฿</div>
                      <Button type="primary" danger loading={buyLoading} disabled={selectedSummary.count === 0} onClick={async () => {
                        // Perform batch buy
                        if (!isLoggedIn) {
                          // Close select modal then prompt login
                          setIsModalOpen(false);
                          setSelectedEpisodeIds([]);
                          openLoginModal();
                          return;
                        }
                        try {
                          setBuyLoading(true);
                          const payload = { eps: selectedEpisodeIds.map((id) => Number(id)), payWith: "coin" };
                          const res = await apiClient.post(`/buy/eps`, payload);
                          if (res?.data?.code === 200) {
                            const respMsg = res.data?.message || "ซื้อสำเร็จ! กำลังอัปเดตเนื้อหา...";
                            notificationApi.success({
                              message: 'สำเร็จ',
                              description: respMsg,
                              placement: 'topRight',
                            });

                            const maybeToken = res?.data?.data?.token ?? res?.data?.token ?? res?.data?.data?.authToken ?? res?.data?.data?.accessToken;
                            if (maybeToken && typeof updateToken === 'function') {
                              try {
                                updateToken(String(maybeToken));
                                console.log('Purchase response included token — auth updated');
                              } catch (err) {
                                console.warn('Failed to update token from purchase response', err);
                              }
                            }

                            // Invalidate queries to refresh UI
                            await queryClient.invalidateQueries({ queryKey: ["bookEpisodes", String(bookId ?? "")] });
                            await queryClient.invalidateQueries({ queryKey: ["bookDetail", String(bookId ?? "")] });

                            closeModal();
                            setSelectedEpisodeIds([]);
                          } else {
                            const errMsg = res?.data?.message || 'ไม่สามารถทำการซื้อได้';
                            messageApi.error(errMsg);
                          }
                        } catch (err: any) {
                          console.error('Batch buy failed', err);
                          const msg = err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาดขณะซื้อ';
                          messageApi.error(msg);
                        } finally {
                          setBuyLoading(false);
                        }
                      }}>
                        ยืนยัน
                      </Button>
                    </div>
                  </div>
                }
                width={760}
                centered
              >
                {isFetching ? (
                  <div className="flex justify-center py-12">
                    <Spin />
                  </div>
                ) : (
                  <div>
                    {/* Top select-all banner */}
                    <div className="bg-pink-50 border border-pink-100 rounded px-4 py-3 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={allSelected} indeterminate={!allSelected && selectedSummary.count > 0} onChange={toggleSelectAll} />
                        <div className="text-sm">เลือกตอนทั้งหมด ({allSelectableIds.length} ตอน)</div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div>เลือก {selectedSummary.count} ตอน</div>
                        <div className="font-semibold text-red-600 flex">รวม {selectedSummary.total} {" "} <Image src="/images/e-coin.png" alt="Coin" width={16} height={16} /></div>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-auto">
                      {episodesData?.groups?.map((group: any) => {
                        const gid = String(group.group_id);
                        const isExpanded = expandedGroups[gid] ?? false;
                        const selectableIds = group.list.filter((ep: any) => ep.coin > 0 && !ep.isBuy).map((ep: any) => ep.ep_id);
                        const selectedCountInGroup = selectableIds.filter((id: number) => selectedEpisodeIds.includes(id)).length;
                        const allSelectedInGroup = selectableIds.length > 0 && selectedCountInGroup === selectableIds.length;

                        return (
                          <div key={group.group_id} className="rounded bg-white border border-gray-100">
                            <div className="px-4 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={allSelectedInGroup}
                                  indeterminate={selectedCountInGroup > 0 && !allSelectedInGroup}
                                  disabled={selectableIds.length === 0}
                                  onChange={() => toggleGroupSelect(group)}
                                />
                                <button onClick={() => toggleGroup(group.group_id)} className="flex items-center gap-3">
                                  <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  <div className="font-semibold">{group.name}</div>
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-500">{group.list.length} ตอน</div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="divide-y">
                                {group.list.map((episode: any) => {
                                  const disabled = episode.coin <= 0 || episode.isBuy;
                                  const checked = selectedEpisodeIds.includes(episode.ep_id);
                                  return (
                                    <div key={episode.ep_id} className={`flex items-center justify-between px-4 py-3 ${disabled ? 'opacity-60' : ''}`}>
                                      <div className="flex items-center gap-3">
                                        <Checkbox
                                          checked={checked}
                                          disabled={disabled}
                                          onChange={() => toggleEpisode(episode.ep_id)}
                                        />
                                        <div className="min-w-0">
                                          <div className={`text-sm font-medium truncate ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>
                                            {episode.name}
                                          </div>
                                          <div className="text-xs text-gray-500">{episode.view} • {new Date(episode.publish_datetime).toLocaleDateString('th-TH')}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {episode.coin > 0 ? (
                                          <div className="flex items-center gap-1">
                                            <Image src="/images/e-coin.png" alt="coin" width={16} height={16} />
                                            <span className="text-sm font-semibold text-orange-600">{episode.coin}</span>
                                          </div>
                                        ) : (
                                          <span className="text-sm font-semibold text-red-600">อ่านฟรี</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <style jsx global>{`
                  .book-select-modal .ant-checkbox-inner { border-color: #e11d48; transition: border-color .12s, background-color .12s; }
                  /* Hover on wrapper or checkbox itself */
                  .book-select-modal .ant-checkbox-wrapper:hover .ant-checkbox-inner,
                  .book-select-modal .ant-checkbox:hover .ant-checkbox-inner {
                    border-color: #e11d48 !important;
                  }
                  /* Focused input (keyboard) */
                  .book-select-modal .ant-checkbox-input:focus + .ant-checkbox-inner {
                    border-color: #e11d48 !important;
                    box-shadow: none !important;
                  }
                  /* Checked state should use red instead of default blue */
                  .book-select-modal .ant-checkbox-checked .ant-checkbox-inner {
                    background: #e11d48 !important;
                    border-color: #e11d48 !important;
                  }
                  /* Ensure check mark is visible on red background */
                  .book-select-modal .ant-checkbox-checked .ant-checkbox-inner::after {
                    border-color: #fff !important;
                  }
                  .book-select-modal .ant-modal-content { border-radius: 8px; }
                  .book-select-modal .ant-modal-body { padding: 0 24px 24px 24px; }
                `}</style>
              </Modal>
            </>
          )}

          {/* Divider */}
          <div className="my-5 border-t border-gray-200" />

          {/* Gift header with stats pills */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-extrabold text-gray-900">ส่งของขวัญ</h3>
            <div className="flex items-center gap-2">
              <div className="h-10 px-4 rounded-full border border-gray-200 bg-white shadow-sm flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Image
                    src="/images/rose.png"
                    alt="rose"
                    width={20}
                    height={20}
                  />
                  <span className="font-semibold text-gray-900 text-base">580</span>
                </div>
                <div className="w-px h-4 bg-gray-200"></div>
                <div className="flex items-center gap-1.5">
                  <Image
                    src="/images/heart.png"
                    alt="heart"
                    width={20}
                    height={20}
                  />
                  <span className="font-semibold text-gray-900 text-base">320</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gift rows - place items side-by-side */}
          <div className="flex items-stretch gap-3">
            {/* Item 1: heart (flex item) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 h-12 pl-4 pr-1.5 shadow-sm">
                <Image src="/images/heart.png" alt="heart" width={24} height={24} />
                <input
                  type="number"
                  min={0}
                  value={heartQty}
                  disabled
                  className="w-full bg-transparent text-center font-bold text-lg text-gray-900 focus:outline-none px-2"
                  readOnly
                />
                <button
                  disabled
                  className="h-9 px-5 rounded-full bg-gray-300 text-white text-sm font-bold shadow-sm shrink-0"
                >
                  ส่ง
                </button>
              </div>
            </div>

            {/* Item 2: rose (flex item) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between bg-white rounded-full border border-gray-200 h-12 pl-4 pr-1.5 shadow-sm">
                <Image src="/images/rose.png" alt="rose" width={24} height={24} />
                <input
                  type="number"
                  min={1}
                  value={roseQty}
                  onChange={(e) => setRoseQty(parseInt(e.target.value || "0"))}
                  className="w-full bg-transparent text-center font-bold text-lg text-gray-900 focus:outline-none px-2"
                />
                <button className="h-9 px-5 rounded-full bg-[#D10023] text-white text-sm font-bold shadow-sm hover:bg-[#b0001d] transition-colors shrink-0">
                  ส่ง
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default BookInfoCard;