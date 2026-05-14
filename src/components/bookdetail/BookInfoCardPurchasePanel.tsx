"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Modal, Spin, Image as AntImage } from "antd";
import type { DiscountReward } from '@/types/api';

type PromotionReward = DiscountReward;

type PurchasePanelBook = {
  use_freecoin?: number | null;
  total_remaining_count?: number | null;
  total_remaining_total?: number | null;
  remaining_paid_count?: number | null;
  remaining_paid_total?: number | null;
  price?: number | null;
  promotion?: {
    id: number;
    title: string;
    endDate: string;
    percent: number;
    price: number;
    rewards?: PromotionReward[];
  } | undefined;
} & Record<string, unknown>;

type PurchasePanelSettings = {
  coin?: string | null;
  fast_ticket?: string | null;
} | null | undefined;

type PurchasePanelUser = {
  coin?: number | null;
  freecoin?: number | null;
  fast_ticket?: number | null;
} | null | undefined;

type BookInfoCardPurchasePanelProps = {
  book: PurchasePanelBook;
  user: PurchasePanelUser;
  settings: PurchasePanelSettings;
  isDeleted: boolean;
  isLoggedIn: boolean;
  buyLoading: boolean;
  hasEarlyAccessEpisodes: boolean;
  promotionRewards: PromotionReward[];
  previewPromotionRewards: PromotionReward[];
  onBuyPromotion: () => void;
  onBuyAllClick: () => void;
  onBuyEarlyAccessClick: () => void;
  onOpenManualSelection: () => void;
  formatPromotionRewardDate: (value?: string | null) => string | null;
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

const SuccessOwnershipNotice = () => (
  <div className="mt-2 px-5 pb-5">
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center">
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-green-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="text-green-800 text-base">คุณเป็นเจ้าของนิยายเรื่องนี้ครบทุกตอนแล้ว</div>
    </div>
  </div>
);

const EarlyAccessOwnershipNotice = ({ onBuyEarlyAccessClick }: { onBuyEarlyAccessClick: () => void }) => (
  <div className="mt-2 px-5 pb-5">
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center">
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-amber-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="text-amber-800 text-base">คุณเป็นเจ้าของนิยายตอนปัจจุบันครบแล้ว</div>
      <div className="text-amber-600 text-sm">ยังมีตอนล่วงหน้าให้ซื้อเพิ่ม</div>
    </div>
    <div className="pt-4">
      <button
        onClick={onBuyEarlyAccessClick}
        className="block w-full h-12 rounded-2xl border-2 border-amber-500 text-amber-600 text-lg font-bold hover:bg-amber-50 transition-colors"
      >
        ซื้อตอนล่วงหน้า
      </button>
    </div>
  </div>
);

const handlePurchaseBoxKeyDown = (
  event: KeyboardEvent<HTMLDivElement>,
  onBuyAllClick: () => void,
) => {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
    onBuyAllClick();
  }
};

export default function BookInfoCardPurchasePanel({
  book,
  settings,
  isDeleted,
  isLoggedIn,
  buyLoading,
  hasEarlyAccessEpisodes,
  promotionRewards,
  previewPromotionRewards,
  onBuyPromotion,
  onBuyAllClick,
  onBuyEarlyAccessClick,
  onOpenManualSelection,
  formatPromotionRewardDate,
}: BookInfoCardPurchasePanelProps) {
  const [isPromotionRewardsOpen, setIsPromotionRewardsOpen] = useState(false);

  if (isDeleted) return null;

  const ownsEverything =
    isLoggedIn
    && Number(book.total_remaining_count ?? 0) === 0
    && Number(book.total_remaining_total ?? 0) === 0;

  const ownsCurrentButHasEarlyAccess =
    isLoggedIn
    && Number(book.remaining_paid_count ?? 0) === 0
    && Number(book.remaining_paid_total ?? 0) === 0
    && hasEarlyAccessEpisodes;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-5 py-2 border-b border-gray-100" />
      <div className="px-5 pb-5 pt-3">
        {ownsEverything ? (
          <SuccessOwnershipNotice />
        ) : ownsCurrentButHasEarlyAccess ? (
          <EarlyAccessOwnershipNotice onBuyEarlyAccessClick={onBuyEarlyAccessClick} />
        ) : (
          <>
            {isLoggedIn && (
              <p className="text-[14px] text-gray-800 mb-3">
                คุณยังไม่ได้เป็นเจ้าของอีก{" "}
                <span className="text-red-600 font-semibold">{book.remaining_paid_count ?? 0} ตอน</span>
              </p>
            )}

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

                  {promotionRewards.length > 0 ? (
                    <div className="mt-3 rounded-2xl border border-white/15 bg-white/12 p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Rewards</p>
                          <p className="mt-1 text-sm font-semibold text-white">ซื้อโปรนี้แล้วรับของรางวัลทันที</p>
                        </div>
                        {formatPromotionRewardDate(book.promotion.endDate) ? (
                          <div className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] font-medium text-white/85">
                            ถึง {formatPromotionRewardDate(book.promotion.endDate)}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 mb-2">
                        {previewPromotionRewards.map((reward) => (
                          <div
                            key={reward.id}
                            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/14 px-2.5 py-1.5 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.4)]"
                          >
                            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/92">
                              <Image
                                src={reward.img}
                                alt={reward.name}
                                fill
                                className="object-contain p-1"
                                unoptimized
                              />
                            </div>
                            <div className="inline-flex rounded-full bg-white/16 px-2 py-0.5 text-[10px] font-bold text-white">
                              x{reward.amount || 1}
                            </div>
                          </div>
                        ))}
                      </div>

                      {promotionRewards.length > previewPromotionRewards.length ? (
                        <button
                          type="button"
                          onClick={() => setIsPromotionRewardsOpen(true)}
                          className="mt-3 inline-flex items-center rounded-full border border-white/18 bg-white/12 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/18"
                        >
                          ดูของรางวัลทั้งหมด +{promotionRewards.length - previewPromotionRewards.length}
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  <button
                    onClick={onBuyPromotion}
                    disabled={buyLoading}
                    className="group w-full mt-4 bg-white !text-red-600 font-bold py-3 rounded-xl text-sm hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg border-2 border-white/50"
                  >
                    {buyLoading ? <Spin size="small" /> : (
                      <>
                        <span className="text-lg !text-red-600">ซื้อราคาโปรโมชั่น</span>
                        <div className="flex items-center bg-red-50 px-3 py-1 rounded-full border border-red-100 group-hover:bg-red-100 transition-colors">
                          <span className="!text-red-600 font-extrabold text-base">{book.promotion.price.toLocaleString()}</span>
                          <Image src="/images/e-coin.png" alt="Coin" width={18} height={18} className="drop-shadow-sm" unoptimized />
                        </div>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div
              role="button"
              tabIndex={0}
              onClick={onBuyAllClick}
              onKeyDown={(event) => handlePurchaseBoxKeyDown(event, onBuyAllClick)}
              className="rounded-2xl bg-gradient-to-b from-gray-100 to-gray-200 border border-gray-200 shadow-inner px-5 py-3 mb-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-gray-800">เหมาทั้งเรื่อง</span>
                  <Image src={settings?.coin || '/images/e-coin.png'} alt="Coin" width={20} height={20} unoptimized />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl leading-none font-extrabold text-red-600">
                    {(book.remaining_paid_total ?? book.price ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-gray-500 text-xs mb-3">หรือ</div>
            {hasEarlyAccessEpisodes && Number(book.remaining_paid_count ?? 0) === 0 && Number(book.remaining_paid_total ?? 0) === 0 && (
              <button
                onClick={onBuyEarlyAccessClick}
                className="w-full h-12 rounded-2xl border-2 border-amber-500 text-amber-600 text-lg font-bold hover:bg-amber-50 transition-colors mb-3"
              >
                ซื้อตอนล่วงหน้า
              </button>
            )}
            <button
              onClick={onOpenManualSelection}
              className="w-full h-12 rounded-2xl border-2 border-red-600 text-red-600 text-lg font-bold hover:bg-red-50 transition-colors"
            >
              เลือกตอนเอง
            </button>
          </>
        )}

        <Modal
          title={null}
          open={isPromotionRewardsOpen}
          onCancel={() => setIsPromotionRewardsOpen(false)}
          footer={null}
          centered
          width={440}
        >
          <div className="px-1 pb-1 pt-2">
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-500">Rewards</p>
              <h3 className="mt-1 text-lg font-bold text-stone-900">ของรางวัลทั้งหมดจากโปรนี้</h3>
              {formatPromotionRewardDate(book.promotion?.endDate) ? (
                <p className="mt-1 text-sm text-stone-500">รับสิทธิ์ได้ถึง {formatPromotionRewardDate(book.promotion?.endDate)}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              {promotionRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white">
                    <AntImage
                      src={reward.img}
                      alt={reward.name}
                      width={44}
                      height={44}
                      className="h-11 w-11 object-contain p-1.5"
                      preview={{ mask: false, zIndex: 3200 }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">{reward.name}</p>
                    <p className="text-xs text-stone-500">จำนวน {reward.amount || 1}</p>
                  </div>
                  <div className="rounded-full bg-red-100 px-2.5 py-1 text-sm font-bold text-red-600">
                    x{reward.amount || 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
