import { afterEach, describe, expect, it, vi } from 'vitest'

type SetupOptions = {
  browser?: boolean
  stateToken?: string | null
  cookieToken?: string | undefined
  sessionToken?: string | null
  parsedToken?: string | null
  deviceId?: string | null
  deviceIdReject?: boolean
  authStatus?: 'guest' | 'logging_out'
}

const DUPLICATE_LOGIN_MESSAGE = 'มีการเข้าสู่ระบบจากอุปกรณ์อื่น'

const setupApiClientModule = async (options: SetupOptions = {}) => {
  vi.resetModules()

  const {
    browser = false,
    stateToken = null,
    cookieToken = undefined,
    sessionToken = null,
    parsedToken = null,
    deviceId = 'device-1',
    deviceIdReject = false,
    authStatus = 'guest',
  } = options

  const requestUse = vi.fn()
  const responseUse = vi.fn()
  const axiosCreate = vi.fn(() => ({
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse },
    },
  }))

  const emitApiClientEvent = vi.fn()
  const getDeviceIdMock = deviceIdReject
    ? vi.fn().mockRejectedValue(new Error('device error'))
    : vi.fn().mockResolvedValue(deviceId)
  const cookieGetMock = vi.fn(() => cookieToken)
  const parseJwtTokenMock = vi.fn((rawToken: string | null | undefined) => rawToken ? parsedToken : null)
  const authGetStateMock = vi.fn(() => ({ token: stateToken, status: authStatus }))
  const getAuthSessionMock = vi.fn().mockResolvedValue(
    sessionToken ? { authenticated: true, token: sessionToken } : null,
  )

  vi.doMock('axios', () => ({
    default: {
      create: axiosCreate,
    },
  }))

  vi.doMock('@/services/apiEvents', () => ({
    emitApiClientEvent,
  }))

  vi.doMock('@/utils/deviceUtils', () => ({
    getDeviceId: getDeviceIdMock,
  }))

  vi.doMock('js-cookie', () => ({
    default: {
      get: cookieGetMock,
    },
  }))

  vi.doMock('@/stores/authStore', () => ({
    useAuthStore: {
      getState: authGetStateMock,
    },
  }))

  vi.doMock('@/utils/jwtParser', () => ({
    parseJwtToken: parseJwtTokenMock,
  }))

  vi.doMock('@/services/authPersistence', () => ({
    getAuthSession: getAuthSessionMock,
  }))

  if (browser) {
    ;(globalThis as any).window = {}
  } else {
    Reflect.deleteProperty(globalThis, 'window')
  }

  const importedModule = await import('@/services/apiClient')
  const requestSuccess = requestUse.mock.calls[0][0]
  const requestError = requestUse.mock.calls[0][1]
  const responseSuccess = responseUse.mock.calls[0][0]
  const responseError = responseUse.mock.calls[0][1]

  return {
    module: importedModule,
    mocks: {
      axiosCreate,
      requestUse,
      responseUse,
      emitApiClientEvent,
      getDeviceIdMock,
      cookieGetMock,
      parseJwtTokenMock,
      authGetStateMock,
      getAuthSessionMock,
    },
    handlers: {
      requestSuccess,
      requestError,
      responseSuccess,
      responseError,
    },
  }
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window')
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('apiClient', () => {
  it('creates axios instance with expected base config', async () => {
    const { mocks } = await setupApiClientModule()

    expect(mocks.axiosCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('adds metadata in SSR request interceptor', async () => {
    const { handlers, mocks } = await setupApiClientModule()
    const config = { headers: {} as Record<string, string> }

    const result = await handlers.requestSuccess(config)

    expect((result as any).metadata.startTime).toBeInstanceOf(Date)
    expect(mocks.getDeviceIdMock).not.toHaveBeenCalled()
  })

  it('adds device id and auth header in browser request interceptor', async () => {
    const { handlers, mocks } = await setupApiClientModule({
      browser: true,
      stateToken: 'state-token',
      parsedToken: 'parsed-token',
      deviceId: 'device-99',
    })
    const config = { headers: {} as Record<string, string> }

    const result = await handlers.requestSuccess(config)

    expect(mocks.getDeviceIdMock).toHaveBeenCalledTimes(1)
    expect(mocks.parseJwtTokenMock).toHaveBeenCalledWith('state-token')
    expect(result.headers['x-device-id']).toBe('device-99')
    expect(result.headers.Authorization).toBe('parsed-token')
  })

  it('supports an opt-in Bearer auth scheme for APIs that require it', async () => {
    const { handlers } = await setupApiClientModule({
      browser: true,
      stateToken: 'state-token',
      parsedToken: 'parsed-token',
    })
    const config = {
      headers: { 'x-auth-scheme': 'bearer' } as Record<string, string>,
    }

    const result = await handlers.requestSuccess(config)

    expect(result.headers['x-auth-scheme']).toBeUndefined()
    expect(result.headers.Authorization).toBe('Bearer parsed-token')
  })

  it('reuses cached device id across browser requests in same module instance', async () => {
    const { handlers, mocks } = await setupApiClientModule({
      browser: true,
      parsedToken: null,
      deviceId: 'shared-device',
    })

    await handlers.requestSuccess({ headers: {} as Record<string, string> })
    await handlers.requestSuccess({ headers: {} as Record<string, string> })

    expect(mocks.getDeviceIdMock).toHaveBeenCalledTimes(1)
  })

  it('does not recover browser credentials outside lifecycle hydration', async () => {
    const { handlers, mocks } = await setupApiClientModule({
      browser: true,
      stateToken: null,
      sessionToken: 'server-session-token',
      parsedToken: 'jwt-from-session',
    })
    const config = { headers: {} as Record<string, string> }

    const result = await handlers.requestSuccess(config)

    expect(mocks.getAuthSessionMock).not.toHaveBeenCalled()
    expect(result.headers.Authorization).toBeUndefined()
  })

  it('skips auth header when x-skip-auth is set', async () => {
    const { handlers, mocks } = await setupApiClientModule({
      browser: true,
      stateToken: 'state-token',
      parsedToken: 'parsed-token',
      deviceId: 'device-99',
    })
    const config = {
      headers: {
        'x-skip-auth': 'true',
        Authorization: 'stale-token',
      } as Record<string, string>,
    }

    const result = await handlers.requestSuccess(config)

    expect(mocks.getDeviceIdMock).toHaveBeenCalledTimes(1)
    expect(mocks.parseJwtTokenMock).not.toHaveBeenCalled()
    expect(result.headers['x-device-id']).toBe('device-99')
    expect(result.headers['x-skip-auth']).toBeUndefined()
    expect(result.headers.Authorization).toBeUndefined()
  })

  it('continues request when device id resolution fails', async () => {
    const { handlers, mocks } = await setupApiClientModule({
      browser: true,
      parsedToken: null,
      deviceIdReject: true,
    })
    const config = { headers: {} as Record<string, string> }

    const result = await handlers.requestSuccess(config)

    expect(mocks.getDeviceIdMock).toHaveBeenCalledTimes(1)
    expect(result.headers['x-device-id']).toBeUndefined()
  })

  it('rejects request interceptor errors', async () => {
    const { handlers } = await setupApiClientModule()
    const error = new Error('request failed')

    await expect(handlers.requestError(error)).rejects.toThrow('request failed')
  })

  it('returns response as-is in success interceptor', async () => {
    const { handlers } = await setupApiClientModule()
    const response = {
      config: {
        method: 'get',
        url: '/endpoint',
        metadata: { startTime: new Date(Date.now() - 5) },
      },
      data: { ok: true },
    }

    const result = handlers.responseSuccess(response)

    expect(result).toBe(response)
  })

  it('does not recover a server credential while logout is in progress', async () => {
    const { handlers, mocks } = await setupApiClientModule({
      browser: true,
      authStatus: 'logging_out',
      sessionToken: 'stale-server-token',
    })

    const result = await handlers.requestSuccess({ headers: {} as Record<string, string> })

    expect(mocks.getAuthSessionMock).not.toHaveBeenCalled()
    expect(result.headers.Authorization).toBeUndefined()
  })

  it('emits duplicate-login event and rejects the original error', async () => {
    const { handlers, mocks } = await setupApiClientModule({ browser: true })
    const error = {
      config: { url: '/secure' },
      response: {
        status: 400,
        data: { message: DUPLICATE_LOGIN_MESSAGE },
      },
    }

    await expect(handlers.responseError(error)).rejects.toBe(error)
    expect(mocks.emitApiClientEvent).toHaveBeenCalledWith('duplicate-login')
  })

  it('emits blocked-user event and rejects the original error', async () => {
    const { handlers, mocks } = await setupApiClientModule({ browser: true })
    const error = {
      config: { url: '/secure' },
      response: {
        status: 403,
        data: { code: 401001 },
      },
    }

    await expect(handlers.responseError(error)).rejects.toBe(error)
    expect(mocks.emitApiClientEvent).toHaveBeenCalledWith('blocked-user')
  })

  it('logs SSR response errors and rejects unknown errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { handlers } = await setupApiClientModule()
    const error = {
      message: 'boom',
      config: {
        method: 'post',
        url: '/broken',
        metadata: { startTime: new Date(Date.now() - 10) },
      },
      response: {
        status: 500,
        data: {},
      },
    }

    await expect(handlers.responseError(error)).rejects.toBe(error)
    expect(errorSpy).toHaveBeenCalled()
  })
})
