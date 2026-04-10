const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type AnyRecord = Record<string, any>;

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNonNegativeNumber = (value: unknown, fallback = 0): number => {
  const parsed = toNumber(value);
  if (parsed === null || parsed < 0) return fallback;
  return parsed;
};

const toPositiveNumber = (value: unknown, fallback = 1): number => {
  const parsed = toNumber(value);
  if (parsed === null || parsed <= 0) return fallback;
  return parsed;
};

const toTimestamp = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isFinite(ts) ? ts : null;
  }
  const ts = Date.parse(String(value));
  return Number.isFinite(ts) ? ts : null;
};

const isAccessMethodObject = (
  value: unknown
): value is { price?: unknown; daily_increase?: unknown; use?: unknown } => {
  return typeof value === "object" && value !== null;
};

export const getEarlyAccessDayMultiplier = (publishDatetime: unknown, nowMs = Date.now()): number => {
  const publishTs = toTimestamp(publishDatetime);
  if (publishTs === null || publishTs <= nowMs) return 0;

  const diff = publishTs - nowMs;
  return Math.max(1, Math.ceil(diff / ONE_DAY_MS));
};

export type NormalizedEpisodeEarlyAccess = {
  isEarlyAccess: boolean;
  isBuyable: boolean;
  fastTicket: boolean;
  fastCoin: boolean;
  fastTicketPrice: number;
  fastCoinPrice: number;
  dayMultiplier: number;
};

export const normalizeEpisodeEarlyAccess = (
  episode: AnyRecord,
  nowMs = Date.now()
): NormalizedEpisodeEarlyAccess => {
  const early = (episode?.early_access ?? {}) as AnyRecord;
  const regularPrice = toNonNegativeNumber(episode?.coin, 0);

  const fastTicketMethod = isAccessMethodObject(early.fast_ticket) ? early.fast_ticket : null;
  const fastCoinMethod = isAccessMethodObject(early.fast_coin) ? early.fast_coin : null;
  const hasStructuredAccess = Boolean(fastTicketMethod || fastCoinMethod);

  const legacyHasEarlyAccess = Boolean(early?.fast_ticket || early?.fast_coin || episode?.isFastTicket);
  const publishTs = toTimestamp(episode?.publish_datetime);
  const isPublishInFuture = publishTs !== null && publishTs > nowMs;

  const hasEarlyAccess = hasStructuredAccess
    ? isPublishInFuture
    : legacyHasEarlyAccess || Boolean(early?.isFast_buyable ?? episode?.isFast_buyable);

  const fastTicketEnabledByUse = hasStructuredAccess
    ? Boolean(fastTicketMethod?.use)
    : Boolean(early?.fast_ticket ?? episode?.isFastTicket);

  const fastCoinEnabledByUse = hasStructuredAccess ? Boolean(fastCoinMethod?.use) : hasEarlyAccess;

  // Structured response uses "use" in each method as the source of truth for buyability.
  const legacyIsBuyable = Boolean(early?.isFast_buyable ?? episode?.isFast_buyable);
  const isBuyable = hasEarlyAccess
    && (
      hasStructuredAccess
        ? (fastTicketEnabledByUse || fastCoinEnabledByUse)
        : legacyIsBuyable
    );

  const baseFastTicketPrice = fastTicketMethod
    ? toPositiveNumber(fastTicketMethod.price, 1)
    : toPositiveNumber(early?.fastTicketPrice, 1);

  const baseFastCoinPrice = fastCoinMethod
    ? toNonNegativeNumber(fastCoinMethod.price, regularPrice)
    : toNonNegativeNumber(early?.fastCoinPrice, regularPrice);

  const ticketDailyIncrease = fastTicketMethod
    ? toNonNegativeNumber(fastTicketMethod.daily_increase, 0)
    : 0;

  const coinDailyIncrease = fastCoinMethod ? toNonNegativeNumber(fastCoinMethod.daily_increase, 0) : 0;

  const dayMultiplier = getEarlyAccessDayMultiplier(episode?.publish_datetime, nowMs);

  return {
    isEarlyAccess: hasEarlyAccess,
    isBuyable,
    fastTicket: hasEarlyAccess && fastTicketEnabledByUse,
    fastCoin: hasEarlyAccess && fastCoinEnabledByUse,
    fastTicketPrice: baseFastTicketPrice + ticketDailyIncrease * dayMultiplier,
    fastCoinPrice: baseFastCoinPrice + coinDailyIncrease * dayMultiplier,
    dayMultiplier,
  };
};
