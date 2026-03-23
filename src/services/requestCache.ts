type CachedValue<T> = {
  value: T;
  expiresAt: number;
  lastAccessedAt: number;
};

type CacheOptions<T> = {
  ttlMs?: number;
  shouldCache?: (value: T) => boolean;
};

const valueCache = new Map<string, CachedValue<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

const MAX_CACHE_ENTRIES = 300;

const pruneValueCache = (now: number) => {
  for (const [key, entry] of valueCache.entries()) {
    if (entry.expiresAt <= now) {
      valueCache.delete(key);
    }
  }

  if (valueCache.size <= MAX_CACHE_ENTRIES) return;

  const sortedEntries = [...valueCache.entries()].sort(
    (a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt
  );
  const removeCount = valueCache.size - MAX_CACHE_ENTRIES;
  for (let i = 0; i < removeCount; i++) {
    valueCache.delete(sortedEntries[i][0]);
  }
};

export const cachedRequest = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions<T>
): Promise<T> => {
  const ttlMs = Math.max(0, options?.ttlMs ?? 0);
  const now = Date.now();

  if (ttlMs > 0) {
    const cached = valueCache.get(key) as CachedValue<T> | undefined;
    if (cached && cached.expiresAt > now) {
      cached.lastAccessedAt = now;
      return cached.value;
    }
  }

  const pending = inFlightRequests.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const promise = fetcher()
    .then((result) => {
      if (ttlMs > 0 && (options?.shouldCache?.(result) ?? true)) {
        const current = Date.now();
        valueCache.set(key, {
          value: result,
          expiresAt: current + ttlMs,
          lastAccessedAt: current,
        });
        pruneValueCache(current);
      }
      return result;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise as Promise<unknown>);
  return promise;
};

export const clearRequestCache = () => {
  valueCache.clear();
  inFlightRequests.clear();
};
