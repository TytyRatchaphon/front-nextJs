export const READ_FREE_QUOTA_STORAGE_KEY = "read_free_quota_v1";

export type FreeQuotaBlockReason = "guest-limit" | "login-limit" | null;

type BookQuotaRecord = {
  episodesRead: number[];
  firstTopupPopupShown?: boolean;
};

type ReadFreeQuotaStorage = {
  guest: Record<string, BookQuotaRecord>;
  users: Record<string, Record<string, BookQuotaRecord>>;
};

type EvaluateFreeQuotaInput = {
  bookId: string | number;
  episodeId: string | number;
  isLoggedIn: boolean;
  userId?: string | number | null;
  guestLimit: number;
  memberLimit: number;
  isEpisodeOwned?: boolean;
};

type EvaluateFreeQuotaResult = {
  blocked: boolean;
  reason: FreeQuotaBlockReason;
  currentCount: number;
  limit: number;
  alreadyRead: boolean;
};

type TopupPromptKeyInput = {
  bookId: string | number;
  userId?: string | number | null;
};

const createDefaultStorage = (): ReadFreeQuotaStorage => ({
  guest: {},
  users: {},
});

const getBrowserStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const toSafeKey = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toPositiveInt = (value: string | number | null | undefined): number | null => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const normalized = Math.trunc(n);
  return normalized > 0 ? normalized : null;
};

const normalizeBookRecord = (raw: unknown): BookQuotaRecord => {
  const fallback: BookQuotaRecord = { episodesRead: [] };
  if (!raw || typeof raw !== "object") return fallback;
  const candidate = raw as BookQuotaRecord;
  const list = Array.isArray(candidate.episodesRead) ? candidate.episodesRead : [];
  const normalizedEpisodes = Array.from(
    new Set(
      list
        .map((ep) => toPositiveInt(ep as unknown as number))
        .filter((ep): ep is number => ep !== null),
    ),
  );

  return {
    episodesRead: normalizedEpisodes,
    firstTopupPopupShown: Boolean(candidate.firstTopupPopupShown),
  };
};

const normalizeStorageShape = (raw: unknown): ReadFreeQuotaStorage => {
  if (!raw || typeof raw !== "object") return createDefaultStorage();
  const candidate = raw as ReadFreeQuotaStorage;

  const normalizedGuest: Record<string, BookQuotaRecord> = {};
  const rawGuest = candidate.guest && typeof candidate.guest === "object" ? candidate.guest : {};
  Object.keys(rawGuest).forEach((bookKey) => {
    normalizedGuest[bookKey] = normalizeBookRecord(rawGuest[bookKey]);
  });

  const normalizedUsers: Record<string, Record<string, BookQuotaRecord>> = {};
  const rawUsers = candidate.users && typeof candidate.users === "object" ? candidate.users : {};
  Object.keys(rawUsers).forEach((userKey) => {
    const perUser = rawUsers[userKey];
    const normalizedPerUser: Record<string, BookQuotaRecord> = {};
    if (perUser && typeof perUser === "object") {
      Object.keys(perUser).forEach((bookKey) => {
        normalizedPerUser[bookKey] = normalizeBookRecord(perUser[bookKey]);
      });
    }
    normalizedUsers[userKey] = normalizedPerUser;
  });

  return {
    guest: normalizedGuest,
    users: normalizedUsers,
  };
};

export const readFreeQuotaStorage = (): ReadFreeQuotaStorage => {
  const browserStorage = getBrowserStorage();
  if (!browserStorage) return createDefaultStorage();
  try {
    const raw = browserStorage.getItem(READ_FREE_QUOTA_STORAGE_KEY);
    if (!raw) return createDefaultStorage();
    return normalizeStorageShape(JSON.parse(raw));
  } catch {
    return createDefaultStorage();
  }
};

const writeFreeQuotaStorage = (data: ReadFreeQuotaStorage): void => {
  const browserStorage = getBrowserStorage();
  if (!browserStorage) return;
  try {
    browserStorage.setItem(READ_FREE_QUOTA_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota persistence failure
  }
};

const getBookRecord = (
  storage: ReadFreeQuotaStorage,
  bookKey: string,
  isLoggedIn: boolean,
  userKey: string,
): BookQuotaRecord => {
  if (isLoggedIn && userKey) {
    const userBooks = storage.users[userKey] || {};
    return normalizeBookRecord(userBooks[bookKey]);
  }
  return normalizeBookRecord(storage.guest[bookKey]);
};

const setBookRecord = (
  storage: ReadFreeQuotaStorage,
  bookKey: string,
  record: BookQuotaRecord,
  isLoggedIn: boolean,
  userKey: string,
): void => {
  if (isLoggedIn && userKey) {
    if (!storage.users[userKey]) storage.users[userKey] = {};
    storage.users[userKey][bookKey] = normalizeBookRecord(record);
    return;
  }
  storage.guest[bookKey] = normalizeBookRecord(record);
};

export const mergeGuestQuotaToUser = (userId?: string | number | null): void => {
  const userKey = toSafeKey(userId);
  if (!userKey) return;

  const storage = readFreeQuotaStorage();
  const guestBooks = storage.guest || {};
  if (Object.keys(guestBooks).length === 0) return;

  if (!storage.users[userKey]) storage.users[userKey] = {};

  Object.keys(guestBooks).forEach((bookKey) => {
    const guestRecord = normalizeBookRecord(guestBooks[bookKey]);
    const userRecord = normalizeBookRecord(storage.users[userKey][bookKey]);
    storage.users[userKey][bookKey] = {
      episodesRead: Array.from(new Set([...userRecord.episodesRead, ...guestRecord.episodesRead])),
      firstTopupPopupShown: Boolean(userRecord.firstTopupPopupShown),
    };
  });

  storage.guest = {};
  writeFreeQuotaStorage(storage);
};

export const evaluateAndTrackFreeReadQuota = (input: EvaluateFreeQuotaInput): EvaluateFreeQuotaResult => {
  const bookKey = toSafeKey(input.bookId);
  const userKey = toSafeKey(input.userId);
  const episodeNo = toPositiveInt(input.episodeId);
  const limit = input.isLoggedIn ? input.memberLimit : input.guestLimit;

  if (!bookKey || !episodeNo || input.isEpisodeOwned) {
    return {
      blocked: false,
      reason: null,
      currentCount: 0,
      limit,
      alreadyRead: false,
    };
  }

  const storage = readFreeQuotaStorage();
  const bookRecord = getBookRecord(storage, bookKey, input.isLoggedIn, userKey);
  const existingEpisodes = bookRecord.episodesRead;
  const alreadyRead = existingEpisodes.includes(episodeNo);
  const currentCount = existingEpisodes.length;

  if (alreadyRead) {
    return {
      blocked: false,
      reason: null,
      currentCount,
      limit,
      alreadyRead: true,
    };
  }

  if (currentCount >= limit) {
    return {
      blocked: true,
      reason: input.isLoggedIn ? "login-limit" : "guest-limit",
      currentCount,
      limit,
      alreadyRead: false,
    };
  }

  const nextRecord: BookQuotaRecord = {
    ...bookRecord,
    episodesRead: Array.from(new Set([...existingEpisodes, episodeNo])),
  };

  setBookRecord(storage, bookKey, nextRecord, input.isLoggedIn, userKey);
  writeFreeQuotaStorage(storage);

  return {
    blocked: false,
    reason: null,
    currentCount: nextRecord.episodesRead.length,
    limit,
    alreadyRead: false,
  };
};

export const hasShownFirstTopupPrompt = (input: TopupPromptKeyInput): boolean => {
  const userKey = toSafeKey(input.userId);
  const bookKey = toSafeKey(input.bookId);
  if (!userKey || !bookKey) return false;
  const storage = readFreeQuotaStorage();
  const record = normalizeBookRecord(storage.users?.[userKey]?.[bookKey]);
  return Boolean(record.firstTopupPopupShown);
};

export const markFirstTopupPromptShown = (input: TopupPromptKeyInput): void => {
  const userKey = toSafeKey(input.userId);
  const bookKey = toSafeKey(input.bookId);
  if (!userKey || !bookKey) return;

  const storage = readFreeQuotaStorage();
  const current = normalizeBookRecord(storage.users?.[userKey]?.[bookKey]);
  setBookRecord(
    storage,
    bookKey,
    {
      ...current,
      firstTopupPopupShown: true,
    },
    true,
    userKey,
  );
  writeFreeQuotaStorage(storage);
};
