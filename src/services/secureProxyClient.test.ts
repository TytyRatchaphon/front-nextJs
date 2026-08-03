import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuthGetState } = vi.hoisted(() => ({
  mockAuthGetState: vi.fn<() => { token: string | null }>(() => ({ token: null })),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: { getState: mockAuthGetState },
}));

import secureProxyClient from './secureProxyClient';

const getRequestInterceptor = () => (secureProxyClient.interceptors.request as any).handlers[0].fulfilled;

describe('secureProxyClient request interceptor', () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
  });

  it('keeps config unchanged on server-side', () => {
    delete (globalThis as any).window;
    const interceptor = getRequestInterceptor();
    const config = { headers: {} as Record<string, string> };

    const result = interceptor(config);
    expect(result).toBe(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('injects normalized token into Authorization header', () => {
    (globalThis as any).window = { location: { protocol: 'https:' } };
    mockAuthGetState.mockReturnValue({ token: `Bearer "abc123"` });

    const interceptor = getRequestInterceptor();
    const config = { headers: {} as Record<string, string> };
    const result = interceptor(config);

    expect(result.headers.Authorization).toBe('abc123');
  });

  it('does not override existing Authorization header', () => {
    (globalThis as any).window = { location: { protocol: 'https:' } };
    mockAuthGetState.mockReturnValue({ token: 'Bearer new-token' });

    const interceptor = getRequestInterceptor();
    const config = { headers: { Authorization: 'existing-token' } as Record<string, string> };
    const result = interceptor(config);

    expect(result.headers.Authorization).toBe('existing-token');
  });

  it('keeps config unchanged when lifecycle token is empty', () => {
    (globalThis as any).window = { location: { protocol: 'https:' } };
    mockAuthGetState.mockReturnValue({ token: null });

    const interceptor = getRequestInterceptor();
    const config = { headers: {} as Record<string, string> };
    const result = interceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
});

