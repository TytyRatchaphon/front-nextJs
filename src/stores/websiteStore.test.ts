import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the API call
const mockFetchWebsiteSettings = vi.fn()
vi.mock('@/services/api/userApi', () => ({
  fetchWebsiteSettings: (...args: any[]) => mockFetchWebsiteSettings(...args),
}))

vi.mock('@/types/errors', () => ({
  getErrorMessage: (err: any) => err?.message || 'Unknown error',
}))

import { useWebsiteStore, WEBSITE_SETTINGS_CACHE_TTL_MS } from '@/stores/websiteStore'

const mockSettings = {
  percent: '30',
  address: '123 Bangkok',
  work_time: '9-18',
  phone: '0812345678',
  email: 'info@test.com',
  app_store: '',
  play_store: '',
  fb_link: '',
  line_link: '',
  ig_link: '',
  tiktok_link: '',
  twitter_link: '',
  yt_link: '',
  logo: 'logo.png',
  img_error: 'error.png',
  img_footer: 'footer.png',
  coin: '1',
  freecoin: '1',
  seo_title: 'Test',
  seo_keyword: 'test',
  seo_description: 'test desc',
  '7D_Checkin': 'enabled',
}

describe('websiteStore', () => {
  beforeEach(() => {
    useWebsiteStore.setState({
      settings: null,
      isLoading: false,
      error: null,
      lastFetched: 0,
      fetchPromise: null,
    })
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------
  it('has correct initial state', () => {
    const state = useWebsiteStore.getState()

    expect(state.settings).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.fetchPromise).toBeNull()
  })

  // -------------------------------------------------------------------
  // setSettings
  // -------------------------------------------------------------------
  it('setSettings stores settings directly', () => {
    useWebsiteStore.getState().setSettings(mockSettings as any)

    expect(useWebsiteStore.getState().settings).toEqual(mockSettings)
  })

  // -------------------------------------------------------------------
  // fetchSettings - success
  // -------------------------------------------------------------------
  it('fetchSettings updates settings on success', async () => {
    mockFetchWebsiteSettings.mockResolvedValueOnce({
      status: 'success',
      data: mockSettings,
    })

    await useWebsiteStore.getState().fetchSettings()

    const state = useWebsiteStore.getState()
    expect(state.settings).toEqual(mockSettings)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.lastFetched).toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------
  // fetchSettings - cache
  // -------------------------------------------------------------------
  it('uses cache when data is fresh (< 5 min)', async () => {
    const now = Date.now()
    useWebsiteStore.setState({
      settings: mockSettings as any,
      lastFetched: now - (WEBSITE_SETTINGS_CACHE_TTL_MS - 1000),
    })

    await useWebsiteStore.getState().fetchSettings()

    // Should NOT have called the API
    expect(mockFetchWebsiteSettings).not.toHaveBeenCalled()
  })

  it('refetches when cache is stale (> 5 min)', async () => {
    const now = Date.now()
    useWebsiteStore.setState({
      settings: mockSettings as any,
      lastFetched: now - (WEBSITE_SETTINGS_CACHE_TTL_MS + 1000),
    })

    mockFetchWebsiteSettings.mockResolvedValueOnce({
      status: 'success',
      data: mockSettings,
    })

    await useWebsiteStore.getState().fetchSettings()

    expect(mockFetchWebsiteSettings).toHaveBeenCalledOnce()
  })

  it('force=true bypasses cache', async () => {
    useWebsiteStore.setState({
      settings: mockSettings as any,
      lastFetched: Date.now(), // Just fetched
    })

    mockFetchWebsiteSettings.mockResolvedValueOnce({
      status: 'success',
      data: mockSettings,
    })

    await useWebsiteStore.getState().fetchSettings(true)

    expect(mockFetchWebsiteSettings).toHaveBeenCalledOnce()
  })

  it('refetches even with fresh cache when required keys are missing', async () => {
    const incompleteSettings = { ...mockSettings } as any
    delete incompleteSettings['7D_Checkin']

    useWebsiteStore.setState({
      settings: incompleteSettings,
      lastFetched: Date.now(),
    })

    mockFetchWebsiteSettings.mockResolvedValueOnce({
      status: 'success',
      data: mockSettings,
    })

    await useWebsiteStore.getState().fetchSettings()

    expect(mockFetchWebsiteSettings).toHaveBeenCalledOnce()
  })

  // -------------------------------------------------------------------
  // fetchSettings - error handling
  // -------------------------------------------------------------------
  it('sets error on API failure', async () => {
    mockFetchWebsiteSettings.mockRejectedValueOnce(new Error('Network error'))

    await useWebsiteStore.getState().fetchSettings(true)

    const state = useWebsiteStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBe('Network error')
  })

  it('handles null response gracefully', async () => {
    mockFetchWebsiteSettings.mockResolvedValueOnce(null)

    await useWebsiteStore.getState().fetchSettings(true)

    const state = useWebsiteStore.getState()
    expect(state.isLoading).toBe(false)
    // No error should be set for null response
    expect(state.settings).toBeNull()
  })

  it('sets default error for non-success response payload', async () => {
    mockFetchWebsiteSettings.mockResolvedValueOnce({
      status: 'warning',
      data: null,
    })

    await useWebsiteStore.getState().fetchSettings(true)

    const state = useWebsiteStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBe('Failed to fetch settings')
  })

  // -------------------------------------------------------------------
  // fetchSettings - deduplication
  // -------------------------------------------------------------------
  it('deduplicates concurrent fetch calls', async () => {
    let resolveFirst!: (value: { status: string; data: typeof mockSettings }) => void
    mockFetchWebsiteSettings.mockImplementationOnce(() => new Promise(r => { resolveFirst = r }))

    const p1 = useWebsiteStore.getState().fetchSettings(true)
    const p2 = useWebsiteStore.getState().fetchSettings(true)

    // While first is pending, second should reuse the same promise
    expect(mockFetchWebsiteSettings).toHaveBeenCalledTimes(1)

    resolveFirst({ status: 'success', data: mockSettings })
    await p1
    await p2

    expect(useWebsiteStore.getState().settings).toEqual(mockSettings)
  })

  it('clears fetchPromise after completion', async () => {
    mockFetchWebsiteSettings.mockResolvedValueOnce({
      status: 'success',
      data: mockSettings,
    })

    await useWebsiteStore.getState().fetchSettings(true)

    expect(useWebsiteStore.getState().fetchPromise).toBeNull()
  })

})
