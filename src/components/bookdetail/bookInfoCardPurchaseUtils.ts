import { isEpisodeOwnedOrFree, normalizeEpisodeEarlyAccess } from '@/utils/earlyAccessUtils';

export type BookInfoCardEpisode = any;
export type BookInfoCardGroup = { list?: BookInfoCardEpisode[] } | any;
export type BookInfoCardSelectionMode = 'all' | 'early';
export type BookInfoCardPayMethod = 'coin' | 'freecoin' | 'fast_ticket';

export const decodeTokenPayload = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
};

export const resolveEpisodePrice = (episode: BookInfoCardEpisode) => {
  const regularPrice = Number(episode.coin ?? 0);
  let promoPrice: number | undefined;
  let activePromo: any = null;

  const getPrice = (val: any) => {
    if (val === null || val === undefined) return undefined;
    const numericValue = Number(val);
    return Number.isNaN(numericValue) ? undefined : numericValue;
  };

  if (episode.Discount) {
    const price = getPrice(episode.Discount.discount_price);
    if (price !== undefined) {
      promoPrice = price;
      activePromo = episode.Discount;
    }
  } else if (Array.isArray(episode.promotions) && episode.promotions.length > 0) {
    const price = getPrice(episode.promotions[0].discount_price);
    if (price !== undefined) {
      promoPrice = price;
      activePromo = episode.promotions[0];
    }
  } else if (episode.discount_price !== undefined) {
    const price = getPrice(episode.discount_price);
    if (price !== undefined) promoPrice = price;
  }

  const hasPromo = !episode.isBuy && promoPrice !== undefined && promoPrice < regularPrice && promoPrice >= 0;
  const finalPrice = hasPromo ? promoPrice : regularPrice;
  const promoEndDate = activePromo?.end_date ?? null;

  return { regularPrice, promoPrice, hasPromo, finalPrice, activePromo, promoEndDate };
};

export const getEarlyAccess = (episode: BookInfoCardEpisode) => normalizeEpisodeEarlyAccess(episode);

export const getEpisodeEarlyMethodConfig = (episode: BookInfoCardEpisode) => {
  const rawEarly = episode?.early_access ?? {};
  const hasTicketConfig =
    typeof rawEarly?.fast_ticket === 'object'
      ? rawEarly.fast_ticket !== null
      : Boolean(rawEarly?.fast_ticket);
  const hasCoinConfig =
    typeof rawEarly?.fast_coin === 'object'
      ? rawEarly.fast_coin !== null
      : Boolean(rawEarly?.fast_coin);

  return { hasTicketConfig, hasCoinConfig };
};

export const canEpisodePayWithCoin = () => true;

export const canEpisodePayWithFastCoin = (episode: BookInfoCardEpisode) => {
  const early = getEarlyAccess(episode);
  if (!early.isEarlyAccess) return true;
  const { hasTicketConfig, hasCoinConfig } = getEpisodeEarlyMethodConfig(episode);
  return Boolean(early.fastCoin || hasCoinConfig || (!hasTicketConfig && !hasCoinConfig));
};

export const canEpisodePayWithFastTicket = (episode: BookInfoCardEpisode) => {
  const early = getEarlyAccess(episode);
  if (!early.isEarlyAccess) return false;
  const { hasTicketConfig } = getEpisodeEarlyMethodConfig(episode);
  return Boolean(early.fastTicket || hasTicketConfig);
};

export const canEpisodePayWithFreecoin = (
  episode: BookInfoCardEpisode,
  bookUseFreecoin?: number,
) => {
  const episodeUseFreecoin = episode?.use_freecoin;
  return episodeUseFreecoin !== undefined && episodeUseFreecoin !== null
    ? Number(episodeUseFreecoin) === 1
    : Number(bookUseFreecoin ?? 0) === 1;
};

export const getEpisodePriceByMethod = (
  episode: BookInfoCardEpisode,
  method: BookInfoCardPayMethod,
) => {
  const early = getEarlyAccess(episode);
  const { finalPrice } = resolveEpisodePrice(episode);
  if (method === 'fast_ticket') {
    if (early.fastTicket) return early.fastTicketPrice ?? 1;
    return finalPrice;
  }
  if ((method === 'coin' || method === 'freecoin') && early.isEarlyAccess) {
    return early.fastCoinPrice;
  }
  return finalPrice;
};

export const getEpisodeRegularCoinPrice = (episode: BookInfoCardEpisode) => {
  const regularPrice = Number(episode?.coin ?? 0);
  return Number.isFinite(regularPrice) && regularPrice > 0 ? regularPrice : 0;
};

export const isEpisodeBaseSelectable = (
  episode: BookInfoCardEpisode,
  bookUseFreecoin?: number,
  includeFreecoinSelectable: boolean = true,
) => {
  if (episode?.isBuy) return false;
  const { finalPrice } = resolveEpisodePrice(episode);
  const hasNormalCoin = Number(finalPrice) > 0;
  const early = getEarlyAccess(episode);
  const rawEarly = episode?.early_access ?? {};
  const hasEarlyMethodConfig =
    Boolean(rawEarly?.fast_ticket)
    || Boolean(rawEarly?.fast_coin)
    || Boolean(episode?.isFastTicket);
  const hasEarlyPayMethod = early.isEarlyAccess && (early.fastTicket || early.fastCoin || hasEarlyMethodConfig);
  const canUseFreecoin = canEpisodePayWithFreecoin(episode, bookUseFreecoin);
  return hasNormalCoin || hasEarlyPayMethod || (includeFreecoinSelectable && canUseFreecoin);
};

export const hasEpisodeSelected = (
  selectionContext: ReadonlySet<number> | readonly number[],
  episodeId: number,
) => {
  if (selectionContext instanceof Set) return selectionContext.has(episodeId);
  if (Array.isArray(selectionContext)) return selectionContext.includes(episodeId);
  return false;
};

export const getEpisodesForSelectionMode = (
  group: BookInfoCardGroup,
  selectionMode: BookInfoCardSelectionMode,
) => {
  const list = Array.isArray(group?.list) ? group.list : [];
  if (selectionMode !== 'early') return list;
  return list.filter((episode: BookInfoCardEpisode) => getEarlyAccess(episode).isEarlyAccess);
};

export const buildOrderedEpisodeIndexMap = (episodes: BookInfoCardEpisode[]) => {
  const episodeIndexMap = new Map<number, number>();
  for (let index = 0; index < episodes.length; index += 1) {
    const episodeId = Number(episodes[index]?.ep_id);
    if (!Number.isFinite(episodeId) || episodeIndexMap.has(episodeId)) continue;
    episodeIndexMap.set(episodeId, index);
  }
  return episodeIndexMap;
};

type SequentialUnlockParams = {
  episode: BookInfoCardEpisode;
  orderedEpisodeIndexMap: Map<number, number>;
  orderedEpisodesForSelectionMode: BookInfoCardEpisode[];
  selectionContext?: ReadonlySet<number> | readonly number[];
  bookUseFreecoin?: number;
  includeFreecoinSelectable?: boolean;
};

export const isEpisodeSequentiallyUnlocked = ({
  episode,
  orderedEpisodeIndexMap,
  orderedEpisodesForSelectionMode,
  selectionContext = [],
  bookUseFreecoin,
  includeFreecoinSelectable = true,
}: SequentialUnlockParams) => {
  if (!isEpisodeBaseSelectable(episode, bookUseFreecoin, includeFreecoinSelectable)) return false;
  const early = getEarlyAccess(episode);
  if (!early.isEarlyAccess) return true;

  const episodeId = Number(episode?.ep_id);
  if (!Number.isFinite(episodeId)) return true;
  const orderedIndex = orderedEpisodeIndexMap.get(episodeId);
  if (orderedIndex === undefined) return true;

  let previousEarlyEpisode: BookInfoCardEpisode | null = null;
  for (let index = orderedIndex - 1; index >= 0; index -= 1) {
    const candidate = orderedEpisodesForSelectionMode[index];
    if (getEarlyAccess(candidate).isEarlyAccess) {
      previousEarlyEpisode = candidate;
      break;
    }
  }

  if (!previousEarlyEpisode) return true;
  if (isEpisodeOwnedOrFree(previousEarlyEpisode)) return true;

  const previousEpisodeId = Number(previousEarlyEpisode?.ep_id);
  return Number.isFinite(previousEpisodeId) && hasEpisodeSelected(selectionContext, previousEpisodeId);
};

type ProgressiveSelectableIdsParams = {
  episodes: BookInfoCardEpisode[];
  orderedEpisodeIndexMap: Map<number, number>;
  orderedEpisodesForSelectionMode: BookInfoCardEpisode[];
  seedSelection?: readonly number[];
  bookUseFreecoin?: number;
  includeFreecoinSelectable?: boolean;
};

export const getProgressiveSelectableIds = ({
  episodes,
  orderedEpisodeIndexMap,
  orderedEpisodesForSelectionMode,
  seedSelection = [],
  bookUseFreecoin,
  includeFreecoinSelectable = true,
}: ProgressiveSelectableIdsParams) => {
  const unlockContext = new Set(
    seedSelection
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id)),
  );
  const selectableIds: number[] = [];

  for (let index = 0; index < episodes.length; index += 1) {
    const episode = episodes[index];
    const episodeId = Number(episode?.ep_id);
    if (!Number.isFinite(episodeId)) continue;
    if (!isEpisodeSequentiallyUnlocked({
      episode,
      orderedEpisodeIndexMap,
      orderedEpisodesForSelectionMode,
      selectionContext: unlockContext,
      bookUseFreecoin,
      includeFreecoinSelectable,
    })) {
      continue;
    }
    selectableIds.push(episodeId);
    unlockContext.add(episodeId);
  }

  return selectableIds;
};

type SelectedSummaryParams = {
  groups: BookInfoCardGroup[];
  selectedEpisodeIds: number[];
  payWith: 'coin' | 'freecoin';
  fastPayWith: 'coin' | 'fast_ticket';
  bookUseFreecoin?: number;
};

export const getSelectedEpisodeSummary = ({
  groups,
  selectedEpisodeIds,
  payWith,
  fastPayWith,
  bookUseFreecoin,
}: SelectedSummaryParams) => {
  const emptySummary = {
    count: 0,
    total: 0,
    hasEarlyAccess: false,
    fastTicketCount: 0,
    fastTicketRequiredTotal: 0,
    earlyAccessCoinTotal: 0,
    baseCoinTotal: 0,
    coinTotal: 0,
    freecoinTotal: 0,
    fastTicketTotal: 0,
    canUseCoin: true,
    canUseFreecoin: false,
    canUseFastTicket: false,
    canUseFastCoin: false,
  };

  if (!Array.isArray(groups) || groups.length === 0) return emptySummary;

  const episodeMap = new Map<number, BookInfoCardEpisode>();
  for (const group of groups) {
    for (const episode of group.list ?? []) {
      episodeMap.set(Number(episode.ep_id), episode);
    }
  }

  const selectedEpisodes = selectedEpisodeIds
    .map((id) => episodeMap.get(Number(id)))
    .filter(Boolean) as BookInfoCardEpisode[];

  if (selectedEpisodes.length === 0) {
    return emptySummary;
  }

  let coinTotal = 0;
  let freecoinTotal = 0;
  let fastTicketTotal = 0;
  let earlyAccessCoinTotal = 0;
  let baseCoinTotal = 0;
  let fastTicketCount = 0;
  let canUseCoinValue = true;
  let canUseFreecoinValue = true;
  let canUseFastTicketValue = true;
  let canUseFastCoinValue = true;
  let fastTicketRequiredTotal = 0;

  for (const episode of selectedEpisodes) {
    const early = getEarlyAccess(episode);
    const { finalPrice } = resolveEpisodePrice(episode);
    coinTotal += Number(getEpisodePriceByMethod(episode, 'coin') ?? 0);
    freecoinTotal += Number(getEpisodePriceByMethod(episode, 'freecoin') ?? 0);
    fastTicketTotal += Number(getEpisodePriceByMethod(episode, 'fast_ticket') ?? 0);
    if (early.isEarlyAccess && canEpisodePayWithFastCoin(episode)) {
      earlyAccessCoinTotal += Number(getEpisodePriceByMethod(episode, 'coin') ?? 0);
    }
    baseCoinTotal += Number(finalPrice ?? 0);
    if (canEpisodePayWithFastTicket(episode)) {
      fastTicketCount += 1;
      fastTicketRequiredTotal += Number(getEpisodePriceByMethod(episode, 'fast_ticket') || 0);
    }
    canUseCoinValue = canUseCoinValue && canEpisodePayWithCoin();
    canUseFreecoinValue = canUseFreecoinValue && canEpisodePayWithFreecoin(episode, bookUseFreecoin);
    canUseFastTicketValue = canUseFastTicketValue && canEpisodePayWithFastTicket(episode);
    canUseFastCoinValue = canUseFastCoinValue && canEpisodePayWithFastCoin(episode);
  }

  const totalByMethod = payWith === 'freecoin'
    ? freecoinTotal + (fastPayWith === 'coin' ? earlyAccessCoinTotal : 0)
    : baseCoinTotal + (fastPayWith === 'coin' ? earlyAccessCoinTotal : 0);

  return {
    count: selectedEpisodes.length,
    total: totalByMethod,
    hasEarlyAccess: fastTicketCount > 0 || earlyAccessCoinTotal > 0,
    fastTicketCount,
    fastTicketRequiredTotal,
    earlyAccessCoinTotal,
    baseCoinTotal,
    coinTotal,
    freecoinTotal,
    fastTicketTotal,
    canUseCoin: canUseCoinValue,
    canUseFreecoin: canUseFreecoinValue,
    canUseFastTicket: canUseFastTicketValue,
    canUseFastCoin: canUseFastCoinValue,
  };
};

type SyncPurchaseTokenParams = {
  newToken?: string | null;
  currentUser?: any;
  updateToken: (token: string) => void;
  login: (userData: any, token: string) => void;
  coinDelta?: number;
  freecoinDelta?: number;
};

export const syncPurchaseTokenState = ({
  newToken,
  currentUser,
  updateToken,
  login,
  coinDelta = 0,
  freecoinDelta = 0,
}: SyncPurchaseTokenParams) => {
  if (!newToken) return false;

  if (!currentUser) {
    updateToken(newToken);
    return true;
  }

  const decoded = decodeTokenPayload(newToken);
  let finalCoin = Number(decoded.coin ?? decoded.coins ?? decoded.goldCoins ?? decoded.gold_coin ?? 0);
  let finalFreeCoin = Number(decoded.freecoin ?? decoded.free_coin ?? 0);

  if (coinDelta > 0) {
    const expectedCoin = (Number(currentUser.coin) || 0) - coinDelta;
    if (finalCoin > expectedCoin) finalCoin = expectedCoin;
  }

  if (freecoinDelta > 0) {
    const expectedFreeCoin = (Number(currentUser.freecoin) || 0) - freecoinDelta;
    if (finalFreeCoin > expectedFreeCoin) finalFreeCoin = expectedFreeCoin;
  }

  const mergedUser = {
    ...currentUser,
    ...decoded,
    coin: finalCoin >= 0 ? finalCoin : 0,
    freecoin: finalFreeCoin >= 0 ? finalFreeCoin : 0,
  };

  login(mergedUser, newToken);
  return true;
};
