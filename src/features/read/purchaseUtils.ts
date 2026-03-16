export type ReadPayMethod = 'coin' | 'freecoin';
export type ReadFastPayMethod = 'coin' | 'fast_ticket';

type PurchaseEpisode = {
  coin?: number | null;
  freecoin?: number | null;
  coin_discount?: number | null;
  isFastTicket?: boolean | null;
  isFast_buyable?: boolean | null;
  use_freecoin?: number | null;
  Discount?: {
    discount_price?: number | null;
  } | null;
  early_access?: {
    fast_ticket?: boolean | null;
    fast_coin?: boolean | null;
    isFast_buyable?: boolean | null;
    fastTicketPrice?: number | null;
    fastCoinPrice?: number | null;
  } | null;
};

export const getRegularEpisodePrices = (episode: PurchaseEpisode) => {
  const discountPrice = episode?.Discount?.discount_price;
  if (discountPrice !== null && discountPrice !== undefined && !Number.isNaN(Number(discountPrice))) {
    const discounted = Number(discountPrice);
    return { coinPrice: discounted, freecoinPrice: discounted, hasDiscount: true };
  }

  if (episode?.coin_discount !== null && episode?.coin_discount !== undefined && !Number.isNaN(Number(episode.coin_discount))) {
    const discounted = Number(episode.coin_discount);
    return { coinPrice: discounted, freecoinPrice: discounted, hasDiscount: true };
  }

  return {
    coinPrice: Number(episode?.coin ?? 0),
    freecoinPrice: Number(episode?.freecoin ?? 0),
    hasDiscount: false,
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
  const { coinPrice, freecoinPrice, hasDiscount } = getRegularEpisodePrices(ep);
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
