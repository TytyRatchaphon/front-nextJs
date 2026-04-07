import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SetupOptions = {
  withWindow?: boolean;
  withLiff?: boolean;
  scriptExists?: boolean;
  liffLoggedIn?: boolean;
  liffId?: string | null;
  appLoggedIn?: boolean;
  search?: string;
};

const LINE_LOGIN_PROCESSING_KEY = "is_line_login_processing";
const LINE_LOGIN_IN_FLIGHT_KEY = "is_line_login_in_flight";

const setupUseLineLogin = async (options: SetupOptions = {}) => {
  vi.resetModules();

  process.env.NEXT_PUBLIC_LINE_LIFF_ID = "test-liff-id";
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.enjoybook.local";
  process.env.NEXT_PUBLIC_BASE_URL = "https://enjoybook.local";

  const {
    withWindow = true,
    withLiff = true,
    scriptExists = false,
    liffLoggedIn = false,
    liffId = null,
    appLoggedIn = false,
    search = "",
  } = options;

  const setLoadingMock = vi.fn();
  const loginMock = vi.fn();
  const updateTokenMock = vi.fn();
  const routerMock = vi.fn();
  const axiosPostMock = vi.fn();

  vi.doMock("react", () => ({
    useState: (initial: any) => [initial, setLoadingMock],
  }));

  vi.doMock("next/navigation", () => ({
    useRouter: () => routerMock,
  }));

  vi.doMock("axios", () => ({
    default: {
      post: (...args: any[]) => axiosPostMock(...args),
    },
  }));

  vi.doMock("@/stores/authStore", () => ({
    useAuthStore: () => ({
      login: loginMock,
      updateToken: updateTokenMock,
      isLoggedIn: appLoggedIn,
    }),
  }));

  if (withWindow) {
    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
    };

    const cookies: string[] = [];
    const scriptEl: any = {
      src: "",
      async: false,
      onload: null,
      onerror: null,
    };
    const documentMock: any = {
      querySelector: vi.fn(() => (scriptExists ? scriptEl : null)),
      createElement: vi.fn(() => scriptEl),
      head: {
        appendChild: vi.fn(),
      },
    };
    Object.defineProperty(documentMock, "cookie", {
      configurable: true,
      get: () => cookies.join("; "),
      set: (value: string) => {
        cookies.push(value);
      },
    });

    const liffMock = {
      id: liffId,
      init: vi.fn().mockResolvedValue(undefined),
      isLoggedIn: vi.fn(() => liffLoggedIn),
      login: vi.fn(),
      getProfile: vi.fn().mockResolvedValue({
        displayName: "LINE User",
        userId: "line-user-1",
        pictureUrl: "https://img.line/user.jpg",
      }),
      getDecodedIDToken: vi.fn(() => ({
        email: "line.user@mail.com",
      })),
    };

    const locationMock = {
      search,
      replace: vi.fn(),
      reload: vi.fn(),
    };

    const windowMock: any = {
      liff: withLiff ? liffMock : undefined,
      location: locationMock,
      localStorage: localStorageMock,
      setTimeout,
      clearTimeout,
    };

    (globalThis as any).window = windowMock;
    (globalThis as any).document = documentMock;
    (globalThis as any).localStorage = localStorageMock;
    (globalThis as any).__LINE_TEST__ = {
      store,
      cookies,
      liffMock,
      scriptEl,
      documentMock,
      locationMock,
      localStorageMock,
    };
  } else {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "localStorage");
  }

  const importedModule = await import("@/hooks/useLineLogin");
  const hook = importedModule.useLineLogin();

  return {
    hook,
    mocks: {
      setLoadingMock,
      loginMock,
      updateTokenMock,
      routerMock,
      axiosPostMock,
      ...(withWindow ? (globalThis as any).__LINE_TEST__ : {}),
    },
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "document");
  Reflect.deleteProperty(globalThis, "localStorage");
  Reflect.deleteProperty(globalThis, "__LINE_TEST__");
});

describe("useLineLogin", () => {
  it("resolves initLIFF on server-side without window", async () => {
    const { hook } = await setupUseLineLogin({ withWindow: false });
    await expect(hook.initLIFF()).resolves.toBeUndefined();
  });

  it("starts LINE login redirect and sets processing flag for non-logged LIFF users", async () => {
    const { hook, mocks } = await setupUseLineLogin({
      liffLoggedIn: false,
      liffId: null,
    });

    await hook.loginWithLine();

    expect(mocks.liffMock.init).toHaveBeenCalledWith({ liffId: "test-liff-id" });
    expect(mocks.localStorageMock.setItem).toHaveBeenCalledWith(LINE_LOGIN_PROCESSING_KEY, "true");
    expect(mocks.liffMock.login).toHaveBeenCalledWith({
      redirectUri: "https://enjoybook.local/linecallback",
    });
  });

  it("handles backend login, stores token, and redirects to home on callback params", async () => {
    const { hook, mocks } = await setupUseLineLogin({
      liffLoggedIn: true,
      search: "?code=abc123",
    });

    mocks.axiosPostMock.mockResolvedValue({
      data: {
        data: {
          token: "jwt-token-123",
          fullname: "Enjoy User",
          email: "enjoy@book.co",
          user_id: "65088",
          role: "writer",
        },
      },
      headers: {},
    });

    await hook.loginWithLine();

    expect(mocks.axiosPostMock).toHaveBeenCalledWith("https://api.enjoybook.local/login/line", {
      name: "LINE User",
      email: "line.user@mail.com",
      userId: "line-user-1",
      picture: "https://img.line/user.jpg",
    });
    expect(mocks.loginMock).toHaveBeenCalledWith(
      {
        fullname: "Enjoy User",
        email: "enjoy@book.co",
        role: "writer",
        userId: "65088",
      },
      "jwt-token-123",
    );
    expect(mocks.updateTokenMock).toHaveBeenCalledWith("jwt-token-123");
    expect(mocks.locationMock.replace).toHaveBeenCalledWith("/");
    expect(mocks.cookies.some((c: string) => c.startsWith("token=jwt-token-123"))).toBe(true);
    expect(mocks.localStorageMock.removeItem).toHaveBeenCalledWith(LINE_LOGIN_PROCESSING_KEY);
  });

  it("skips backend request when in-flight login lock is still valid", async () => {
    const { hook, mocks } = await setupUseLineLogin({
      liffLoggedIn: true,
    });

    mocks.localStorageMock.setItem(
      LINE_LOGIN_IN_FLIGHT_KEY,
      JSON.stringify({ lockId: "existing-lock", startedAt: Date.now() }),
    );

    await hook.loginWithLine();

    expect(mocks.axiosPostMock).not.toHaveBeenCalled();
    expect(mocks.setLoadingMock).toHaveBeenCalledWith(false);
    expect(mocks.localStorageMock.removeItem).toHaveBeenCalledWith(LINE_LOGIN_PROCESSING_KEY);
  });

  it("uses reload flow when login succeeds without callback params", async () => {
    const { hook, mocks } = await setupUseLineLogin({
      liffLoggedIn: true,
      search: "",
    });

    mocks.axiosPostMock.mockResolvedValue({
      data: {
        data: "token-from-string",
      },
      headers: {},
    });

    await hook.loginWithLine();

    expect(mocks.loginMock).toHaveBeenCalledWith(
      {
        fullname: "LINE User",
        email: "line.user@mail.com",
        role: "user",
        userId: "",
      },
      "token-from-string",
    );
    expect(mocks.locationMock.reload).toHaveBeenCalled();
    expect(mocks.locationMock.replace).not.toHaveBeenCalled();
  });

  it("falls back to header token when payload has no token fields", async () => {
    const { hook, mocks } = await setupUseLineLogin({
      liffLoggedIn: true,
      search: "",
    });

    mocks.axiosPostMock.mockResolvedValue({
      data: {
        data: {
          fullname: "Header Token User",
          email: "header@book.co",
          userID: "9001",
        },
      },
      headers: {
        authorization: "header-token",
      },
    });

    await hook.loginWithLine();

    expect(mocks.updateTokenMock).toHaveBeenCalledWith("header-token");
    expect(mocks.loginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fullname: "Header Token User",
        userId: "9001",
      }),
      "header-token",
    );
  });

  it("does not call liff.init when already initialized with liff.id", async () => {
    const { hook, mocks } = await setupUseLineLogin({
      withLiff: true,
      liffId: "already-initialized",
      liffLoggedIn: false,
    });

    await hook.initLIFF();

    expect(mocks.liffMock.init).not.toHaveBeenCalled();
  });

  it("handles existing LIFF script path without adding a new script element", async () => {
    vi.useFakeTimers();
    const { hook, mocks } = await setupUseLineLogin({
      withLiff: false,
      scriptExists: true,
    });

    setTimeout(() => {
      (globalThis as any).window.liff = mocks.liffMock;
    }, 100);

    const initPromise = hook.initLIFF();
    vi.advanceTimersByTime(150);
    await initPromise;

    expect(mocks.documentMock.querySelector).toHaveBeenCalledWith(
      'script[src="https://static.line-scdn.net/liff/edge/2/sdk.js"]',
    );
    expect(mocks.documentMock.createElement).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("rejects initLIFF when script loading fails", async () => {
    const { hook, mocks } = await setupUseLineLogin({
      withLiff: false,
      scriptExists: false,
    });

    const initPromise = hook.initLIFF();
    mocks.scriptEl.onerror(new Error("load failed"));

    await expect(initPromise).rejects.toBeTruthy();
  });
});
