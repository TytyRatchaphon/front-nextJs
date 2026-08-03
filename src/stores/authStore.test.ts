import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all external dependencies BEFORE importing the store
const { mockCookieGet, mockCookieSet, mockCookieRemove } = vi.hoisted(() => ({
  mockCookieGet: vi.fn(),
  mockCookieSet: vi.fn(),
  mockCookieRemove: vi.fn(),
}))

const mockFetch = vi.fn()

vi.mock('js-cookie', () => ({
  default: {
    get: mockCookieGet,
    set: mockCookieSet,
    remove: mockCookieRemove,
  },
}))

vi.mock('@/utils/jwtParser', () => ({
  parseJwtToken: vi.fn((t: string) => t || undefined),
  validateJwtToken: vi.fn((t: string) => t || null),
  getJwtIdentity: vi.fn(() => '42'),
  decodeAndMapUserFromToken: vi.fn((_token: string, base: any) => ({
    ...base,
    user_id: 42,
    fullname: 'Decoded User',
  })),
}))

vi.mock('@/stores/formStore', () => ({
  useFormStore: { getState: vi.fn(() => ({})) },
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
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock window — needed because authPersistence checks typeof window !== 'undefined'
Object.defineProperty(globalThis, 'window', {
  value: {
    location: {
      href: '',
      protocol: 'http:',
      hostname: 'localhost',
    },
    localStorage: localStorageMock,
  },
  writable: true,
})

Object.defineProperty(globalThis, 'fetch', {
  value: mockFetch,
  writable: true,
})

const sessionStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock })

import { createAuthStore } from '@/stores/authStore'
import type { UserData } from '@/stores/authStore'

const makeUser = (overrides: Partial<UserData> = {}): UserData => ({
  user_id: 1,
  fullname: 'Test User',
  email: 'test@example.com',
  role: 'user',
  ...overrides,
})

describe('authStore', () => {
  let authStore: ReturnType<typeof createAuthStore>

  beforeEach(() => {
    authStore = createAuthStore()
    window.location.href = ''
    localStorageMock.clear()
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: false, token: null }),
    })
  })

  // -------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------
  it('has correct initial state', () => {
    const state = authStore.getState()

    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isLoggedIn).toBe(false)
  })

  // -------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------
  it('login sets user, token, and isLoggedIn after persistence succeeds', async () => {
    const user = makeUser()
    await authStore.getState().login(user, 'test-token')

    const state = authStore.getState()
    expect(state.isLoggedIn).toBe(true)
    expect(state.token).toBeTruthy()
    // user should be set (updateToken may decode and overwrite)
    expect(state.user).toBeTruthy()
  })

  it('login clears legacy localStorage and stores token through the server session route once', async () => {
    const user = makeUser()
    await authStore.getState().login(user, 'persist-token')

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userData')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    expect(mockCookieSet).not.toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/session',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ token: 'persist-token' }),
      }),
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('keeps the user unauthenticated when the browser session rejects the credential', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    await expect(authStore.getState().login(makeUser(), 'rejected-token')).resolves.toBe(false)
    expect(authStore.getState()).toMatchObject({
      status: 'guest',
      isLoggedIn: false,
      user: null,
      token: null,
    })
  })

  // -------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------
  it('logout clears user, token, and isLoggedIn', async () => {
    const user = makeUser()
    await authStore.getState().login(user, 'token')
    await authStore.getState().logout()

    const state = authStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isLoggedIn).toBe(false)
  })

  it('logout removes from localStorage and cookies', async () => {
    await authStore.getState().login(makeUser(), 'token')
    await authStore.getState().logout()

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userData')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    expect(mockCookieRemove).toHaveBeenCalledWith(
      'token',
      expect.objectContaining({ path: '/' }),
    )
    expect(mockCookieRemove).toHaveBeenCalledWith(
      'tk',
      expect.objectContaining({ path: '/' }),
    )
  })

  it('forced logout clears private state immediately without competing navigation', async () => {
    await authStore.getState().login(makeUser(), 'token')
    const logout = authStore.getState().logout({ navigate: false })

    expect(authStore.getState()).toMatchObject({
      status: 'logging_out',
      isLoggedIn: false,
      user: null,
      token: null,
    })
    await logout
    expect(window.location.href).toBe('')
  })

  // -------------------------------------------------------------------
  // updateUserBalance
  // -------------------------------------------------------------------
  it('updateUserBalance merges partial updates', () => {
    authStore.setState({ user: makeUser({ coin: 100 }), isLoggedIn: true })
    authStore.getState().updateUserBalance({ coin: 200, freecoin: 50 })

    const user = authStore.getState().user!
    expect(user.coin).toBe(200)
    expect(user.freecoin).toBe(50)
    expect(user.fullname).toBe('Test User') // unchanged field preserved
  })

  it('updateUserBalance does nothing when not logged in', () => {
    authStore.getState().updateUserBalance({ coin: 999 })

    expect(authStore.getState().user).toBeNull()
  })

  // -------------------------------------------------------------------
  // updateToken
  // -------------------------------------------------------------------
  it('updateToken sets a same-identity replacement token and decodes user', async () => {
    await authStore.getState().login(makeUser(), 'old-jwt-token')
    await authStore.getState().updateToken('new-jwt-token')

    const state = authStore.getState()
    expect(state.token).toBe('new-jwt-token')
    expect(state.isLoggedIn).toBe(true)
  })

  it('updateToken does nothing for empty token', async () => {
    await authStore.getState().login(makeUser(), 'old')
    await authStore.getState().updateToken('')

    expect(authStore.getState().token).toBe('old')
  })

  // -------------------------------------------------------------------
  // setMounted
  // -------------------------------------------------------------------
  it('setMounted sets hasMounted to true', async () => {
    await authStore.getState().setMounted()

    expect(authStore.getState().hasMounted).toBe(true)
  })

  it('setMounted recovers from httpOnly server session when legacy cookie is unavailable', async () => {
    mockCookieGet.mockReturnValue(undefined)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true, token: 'server-session-token' }),
    })

    await authStore.getState().setMounted()

    const state = authStore.getState()
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/session',
      expect.objectContaining({ method: 'GET', credentials: 'same-origin' }),
    )
    expect(state.hasMounted).toBe(true)
    expect(state.isLoggedIn).toBe(true)
    expect(state.token).toBe('server-session-token')
  })
})
