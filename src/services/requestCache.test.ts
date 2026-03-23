import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cachedRequest, clearRequestCache } from './requestCache';

describe('requestCache', () => {
  beforeEach(() => {
    clearRequestCache();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    clearRequestCache();
    vi.useRealTimers();
  });

  it('deduplicates in-flight requests with the same key', async () => {
    const fetcher = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
      return { ok: true };
    });

    const p1 = cachedRequest('inflight:key', fetcher, { ttlMs: 1000 });
    const p2 = cachedRequest('inflight:key', fetcher, { ttlMs: 1000 });

    expect(fetcher).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(25);
    await expect(p1).resolves.toEqual({ ok: true });
    await expect(p2).resolves.toEqual({ ok: true });
  });

  it('returns cached value while ttl is still valid', async () => {
    const fetcher = vi.fn(async () => 'value-a');

    const first = await cachedRequest('ttl:key', fetcher, { ttlMs: 5000 });
    const second = await cachedRequest('ttl:key', fetcher, { ttlMs: 5000 });

    expect(first).toBe('value-a');
    expect(second).toBe('value-a');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('fetches again after ttl expiry', async () => {
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('value-a')
      .mockResolvedValueOnce('value-b');

    const first = await cachedRequest('expire:key', fetcher, { ttlMs: 1000 });
    vi.setSystemTime(new Date('2026-01-01T00:00:02.000Z'));
    const second = await cachedRequest('expire:key', fetcher, { ttlMs: 1000 });

    expect(first).toBe('value-a');
    expect(second).toBe('value-b');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('skips caching when shouldCache returns false', async () => {
    const fetcher = vi.fn(async () => null as null);

    const first = await cachedRequest('no-cache:null', fetcher, {
      ttlMs: 10_000,
      shouldCache: (value) => value !== null,
    });
    const second = await cachedRequest('no-cache:null', fetcher, {
      ttlMs: 10_000,
      shouldCache: (value) => value !== null,
    });

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
