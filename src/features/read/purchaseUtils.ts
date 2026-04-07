export type ReadPayMethod = 'coin' | 'freecoin';
export type ReadFastPayMethod = 'coin' | 'fast_ticket';

type PurchaseEpisode = {
  coin?: number | null;
  freecoin?: number | null;
  coin_discount?: number | null;
  discount_price?: number | null;
  discount_end_date?: string | null;
  isFastTicket?: boolean | null;
  isFast_buyable?: boolean | null;
  use_freecoin?: number | null;
  Discount?: {
    discount_price?: number | null;
    end_date?: string | null;
  } | null;
  promotions?: Array<{
    discount_price?: number | null;
    end_date?: string | null;
  }> | null;
  early_access?: {
    fast_ticket?: boolean | null;
    fast_coin?: boolean | null;
    isFast_buyable?: boolean | null;
    fastTicketPrice?: number | null;
    fastCoinPrice?: number | null;
  } | null;
};

const parsePrice = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

const resolveDiscount = (episode: PurchaseEpisode) => {
  const discountObjectPrice = parsePrice(episode?.Discount?.discount_price);
  if (discountObjectPrice !== undefined) {
    return { discountPrice: discountObjectPrice, discountEndDate: episode?.Discount?.end_date ?? null };
  }

  const firstPromotion = Array.isArray(episode?.promotions) ? episode.promotions[0] : null;
  const promotionPrice = parsePrice(firstPromotion?.discount_price);
  if (promotionPrice !== undefined) {
    return { discountPrice: promotionPrice, discountEndDate: firstPromotion?.end_date ?? null };
  }

  const directDiscount = parsePrice(episode?.discount_price);
  if (directDiscount !== undefined) {
    return { discountPrice: directDiscount, discountEndDate: episode?.discount_end_date ?? null };
  }

  return { discountPrice: undefined, discountEndDate: null as string | null };
};

export const getRegularEpisodePrices = (episode: PurchaseEpisode) => {
  const originalCoinPrice = Number(episode?.coin ?? 0);
  const originalFreecoinPrice = originalCoinPrice;
  const { discountPrice, discountEndDate } = resolveDiscount(episode);
  if (
    discountPrice !== undefined &&
    Number.isFinite(discountPrice) &&
    discountPrice >= 0 &&
    discountPrice < originalCoinPrice
  ) {
    const isDiscountFree = discountPrice === 0 && originalCoinPrice > 0;
    return {
      coinPrice: discountPrice,
      freecoinPrice: discountPrice,
      hasDiscount: true,
      discountEndDate,
      originalCoinPrice,
      isDiscountFree,
    };
  }

  if (episode?.coin_discount !== null && episode?.coin_discount !== undefined && !Number.isNaN(Number(episode.coin_discount))) {
    const discounted = Number(episode.coin_discount);
    if (discounted >= 0 && discounted < originalCoinPrice) {
      const isDiscountFree = discounted === 0 && originalCoinPrice > 0;
      return {
        coinPrice: discounted,
        freecoinPrice: discounted,
        hasDiscount: true,
        discountEndDate: null,
        originalCoinPrice,
        isDiscountFree,
      };
    }
  }

  return {
    coinPrice: originalCoinPrice,
    freecoinPrice: originalFreecoinPrice,
    hasDiscount: false,
    discountEndDate: null,
    originalCoinPrice,
    isDiscountFree: false,
  };
};

export const getReadEpisodePurchaseState = (episode: PurchaseEpisode | null | undefined, bookUseFreecoin?: number | null) => {
  const ep = episode ?? {};
  const early = ep.early_access || {};
  const isEarlyAccess = Boolean(early?.fast_ticket || early?.fast_coin || ep?.isFastTicket);
  const canFastTicket = Boolean(early?.fast_ticket ?? ep?.isFastTicket);
  const canFastCoin = isEarlyAccess;
  const isFastBuyable = isEarlyAccess && Boolean(early?.isFast_buyable ?? ep?.isFast_buyable);
  const isFastLocked = isEarlyAccess && !isFastBuyable;
  const fastTicketPrice = Number.isFinite(Number(early?.fastTicketPrice)) && Number(early?.fastTicketPrice) > 0
    ? Number(early.fastTicketPrice)
    : 1;
  const { coinPrice, freecoinPrice, hasDiscount, discountEndDate, isDiscountFree } = getRegularEpisodePrices(ep);
  const fastCoinPrice = Number.isFinite(Number(early?.fastCoinPrice)) && Number(early?.fastCoinPrice) >= 0
    ? Number(early.fastCoinPrice)
    : Number(coinPrice ?? 0);
  const canUseFreecoin = ep.use_freecoin !== undefined && ep.use_freecoin !== null
    ? Number(ep.use_freecoin) === 1
    : (bookUseFreecoin !== undefined && bookUseFreecoin !== null ? Number(bookUseFreecoin) === 1 : true);

  return {
    isEarlyAccess,
    canFastTicket,
    canFastCoin,
    isFastBuyable,
    isFastLocked,
    fastTicketPrice,
    fastCoinPrice,
    coinPrice,
    freecoinPrice,
    hasDiscount,
    discountEndDate,
    isDiscountFree,
    canUseFreecoin,
  };
};

export const buildReadBuyPayload = (
  epId: string | number,
  payWith: ReadPayMethod,
  fastPayWith: ReadFastPayMethod,
  purchaseState: ReturnType<typeof getReadEpisodePurchaseState>
) => {
  const payload: { eps: number[]; payWith: ReadPayMethod; fastPayWith?: string[] } = {
    eps: [Number(epId)],
    payWith,
  };

  if (purchaseState.isEarlyAccess) {
    if (fastPayWith === 'fast_ticket' && purchaseState.canFastTicket) {
      payload.fastPayWith = ['ticket'];
    } else if (purchaseState.canFastCoin) {
      payload.fastPayWith = ['coin'];
    }
  }

  return payload;
};

export const getReadConfirmButtonLabel = (
  payWith: ReadPayMethod | null,
  fastPayWith: ReadFastPayMethod,
  purchaseState: ReturnType<typeof getReadEpisodePurchaseState>
) => {
  if (payWith === 'coin' && purchaseState.isEarlyAccess) {
    if (purchaseState.canFastTicket && purchaseState.canFastCoin) {
      return fastPayWith === 'fast_ticket'
        ? `ยืนยัน`
        : 'ยืนยัน';
    }
    if (purchaseState.canFastTicket) {
      return `ยืนยัน`;
    }
  }

  if (payWith === 'coin') return 'ยืนยัน';
  if (payWith === 'freecoin') return 'ยืนยัน';
  return 'ยืนยัน';
};
