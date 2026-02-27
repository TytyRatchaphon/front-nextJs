import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all external dependencies BEFORE importing the store
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@/utils/jwtParser', () => ({
  parseJwtToken: vi.fn((t: string) => t || undefined),
  decodeAndMapUserFromToken: vi.fn((token: string, base: any) => ({
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

// Mock window.location.reload
Object.defineProperty(globalThis, 'window', {
  value: { location: { reload: vi.fn() }, localStorage: localStorageMock },
  writable: true,
})

import { useAuthStore } from '@/stores/authStore'
import type { UserData } from '@/stores/authStore'

const makeUser = (overrides: Partial<UserData> = {}): UserData => ({
  user_id: 1,
  fullname: 'Test User',
  email: 'test@example.com',
  role: 'user',
  ...overrides,
})

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isLoggedIn: false,
      hasMounted: false,
    })
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------
  it('has correct initial state', () => {
    const state = useAuthStore.getState()

    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isLoggedIn).toBe(false)
  })

  // -------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------
  it('login sets user, token, and isLoggedIn', () => {
    const user = makeUser()
    useAuthStore.getState().login(user, 'test-token')

    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(true)
    expect(state.token).toBeTruthy()
    // user should be set (updateToken may decode and overwrite)
    expect(state.user).toBeTruthy()
  })

  it('login saves to localStorage', () => {
    const user = makeUser()
    useAuthStore.getState().login(user, 'persist-token')

    expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', expect.any(String))
    expect(localStorageMock.setItem).toHaveBeenCalledWith('userData', expect.any(String))
  })

  // -------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------
  it('logout clears user, token, and isLoggedIn', () => {
    const user = makeUser()
    useAuthStore.getState().login(user, 'token')
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isLoggedIn).toBe(false)
  })

  it('logout removes from localStorage and cookies', () => {
    useAuthStore.getState().login(makeUser(), 'token')
    useAuthStore.getState().logout()

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userData')
  })

  // -------------------------------------------------------------------
  // updateUserBalance
  // -------------------------------------------------------------------
  it('updateUserBalance merges partial updates', () => {
    useAuthStore.setState({ user: makeUser({ coin: 100 }), isLoggedIn: true })
    useAuthStore.getState().updateUserBalance({ coin: 200, freecoin: 50 })

    const user = useAuthStore.getState().user!
    expect(user.coin).toBe(200)
    expect(user.freecoin).toBe(50)
    expect(user.fullname).toBe('Test User') // unchanged field preserved
  })

  it('updateUserBalance does nothing when not logged in', () => {
    useAuthStore.getState().updateUserBalance({ coin: 999 })

    expect(useAuthStore.getState().user).toBeNull()
  })

  // -------------------------------------------------------------------
  // updateToken
  // -------------------------------------------------------------------
  it('updateToken sets new token and decodes user', () => {
    useAuthStore.setState({ user: makeUser(), isLoggedIn: true })
    useAuthStore.getState().updateToken('new-jwt-token')

    const state = useAuthStore.getState()
    expect(state.token).toBe('new-jwt-token')
    expect(state.isLoggedIn).toBe(true)
  })

  it('updateToken does nothing for empty token', () => {
    useAuthStore.setState({ user: makeUser(), token: 'old', isLoggedIn: true })
    useAuthStore.getState().updateToken('')

    expect(useAuthStore.getState().token).toBe('old')
  })

  // -------------------------------------------------------------------
  // setMounted
  // -------------------------------------------------------------------
  it('setMounted sets hasMounted to true', () => {
    useAuthStore.getState().setMounted()

    expect(useAuthStore.getState().hasMounted).toBe(true)
  })

  it('setMounted recovers from localStorage backup', () => {
    localStorageMock.setItem('authToken', 'backup-token')
    localStorageMock.setItem('userData', JSON.stringify(makeUser({ fullname: 'Backup' })))

    useAuthStore.setState({ user: null, token: null, isLoggedIn: false })
    useAuthStore.getState().setMounted()

    const state = useAuthStore.getState()
    expect(state.hasMounted).toBe(true)
    expect(state.isLoggedIn).toBe(true)
    expect(state.user?.fullname).toBe('Backup')
  })
})
