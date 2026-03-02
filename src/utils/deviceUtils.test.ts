import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock FingerprintJS
vi.fn();
const mockLoad = vi.fn()

vi.mock('@fingerprintjs/fingerprintjs', () => ({
  default: {
    load: () => mockLoad(),
  },
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

// Ensure `window` and `localStorage` exist so getDeviceId doesn't bail with ''
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })
if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true })
}

describe('deviceUtils', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorageMock.clear()
    // Reset the module to clear memoryCache between tests
    vi.resetModules()
  })

  it('returns visitorId from FingerprintJS', async () => {
    mockLoad.mockResolvedValue({
      get: vi.fn().mockResolvedValue({ visitorId: 'fp-abc123' }),
    })

    const { getDeviceId } = await import('@/utils/deviceUtils')
    const result = await getDeviceId()

    expect(result).toBe('fp-abc123')
  })

  it('saves deviceId to localStorage', async () => {
    mockLoad.mockResolvedValue({
      get: vi.fn().mockResolvedValue({ visitorId: 'fp-save-test' }),
    })

    const { getDeviceId } = await import('@/utils/deviceUtils')
    await getDeviceId()

    expect(localStorageMock.setItem).toHaveBeenCalledWith('x-device-id', 'fp-save-test')
  })

  it('uses memory cache on second call', async () => {
    mockLoad.mockResolvedValue({
      get: vi.fn().mockResolvedValue({ visitorId: 'fp-cached' }),
    })

    const { getDeviceId } = await import('@/utils/deviceUtils')

    const first = await getDeviceId()
    const second = await getDeviceId()

    expect(first).toBe('fp-cached')
    expect(second).toBe('fp-cached')
    // FingerprintJS should only be loaded once
    expect(mockLoad).toHaveBeenCalledTimes(1)
  })

  it('returns fallback when FingerprintJS fails', async () => {
    mockLoad.mockRejectedValue(new Error('FP failed'))

    const { getDeviceId } = await import('@/utils/deviceUtils')
    const result = await getDeviceId()

    expect(result).toMatch(/^fallback-/)
    expect(result.length).toBeGreaterThan(10)
  })

  it('fallback is non-deterministic (different each call)', async () => {
    mockLoad.mockRejectedValue(new Error('FP failed'))

    const mod1 = await import('@/utils/deviceUtils')
    const result1 = await mod1.getDeviceId()

    vi.resetModules()
    mockLoad.mockRejectedValue(new Error('FP failed'))
    const mod2 = await import('@/utils/deviceUtils')
    const result2 = await mod2.getDeviceId()

    expect(result1).toMatch(/^fallback-/)
    expect(result2).toMatch(/^fallback-/)
    expect(result1).not.toBe(result2)
  })
})
