/* eslint-disable react-hooks/rules-of-hooks */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let stateCursor = 0;
let stateStore: any[] = [];
const effectCleanups: Array<() => void> = [];

vi.mock("react", () => ({
  useState: (initial: any) => {
    const idx = stateCursor++;
    if (typeof stateStore[idx] === "undefined") {
      stateStore[idx] = initial;
    }
    const setValue = (next: any) => {
      stateStore[idx] = typeof next === "function" ? next(stateStore[idx]) : next;
    };
    return [stateStore[idx], setValue];
  },
  useEffect: (effect: () => void | (() => void)) => {
    const cleanup = effect();
    if (typeof cleanup === "function") {
      effectCleanups.push(cleanup);
    }
  },
  useRef: (initial: any) => ({ current: initial }),
}));

import { useReadingTheme } from "@/features/read/hooks/useReadingTheme";

describe("useReadingTheme", () => {
  let elements: Map<string, any>;
  let styleElement: any;
  let rafCallbacks: Array<(ts: number) => void>;
  let mutationObserverInstances: Array<any>;
  let contentRef: { current: any };

  const renderHook = () => {
    stateCursor = 0;
    return useReadingTheme(contentRef as any);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    stateStore = [];
    stateCursor = 0;
    effectCleanups.length = 0;
    rafCallbacks = [];
    mutationObserverInstances = [];
    contentRef = { current: null };

    elements = new Map<string, any>();
    elements.set("Navbar", { id: "Navbar" });
    elements.set("GlobalNavbarWrapper", { id: "GlobalNavbarWrapper" });

    styleElement = null;
    const documentMock: any = {
      body: {},
      head: {
        appendChild: vi.fn((el: any) => {
          if (el?.id) elements.set(el.id, el);
        }),
      },
      documentElement: { scrollHeight: 5000 },
      getElementById: vi.fn((id: string) => elements.get(id) || null),
      createElement: vi.fn((tagName: string) => {
        if (tagName === "style") {
          const el = {
            id: "",
            innerHTML: "",
            remove: vi.fn(() => {
              if (el.id) elements.delete(el.id);
            }),
          };
          styleElement = el;
          return el;
        }
        return { tagName };
      }),
    };

    const localStorageStore = new Map<string, string>();
    const localStorageMock = {
      getItem: vi.fn((key: string) => localStorageStore.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageStore.set(key, value);
      }),
    };

    class MockMutationObserver {
      cb: (mutations: any[]) => void;
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(cb: (mutations: any[]) => void) {
        this.cb = cb;
        mutationObserverInstances.push(this);
      }
    }

    const windowMock: any = {
      scrollY: 100,
      innerHeight: 1000,
      scrollBy: vi.fn((_x: number, y: number) => {
        windowMock.scrollY += y;
      }),
    };

    (globalThis as any).window = windowMock;
    (globalThis as any).document = documentMock;
    (globalThis as any).localStorage = localStorageMock;
    (globalThis as any).MutationObserver = MockMutationObserver;
    (globalThis as any).requestAnimationFrame = vi.fn((cb: (ts: number) => void) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    (globalThis as any).cancelAnimationFrame = vi.fn();
    (globalThis as any).__testLocalStorageStore = localStorageStore;
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "localStorage");
    Reflect.deleteProperty(globalThis, "MutationObserver");
    Reflect.deleteProperty(globalThis, "requestAnimationFrame");
    Reflect.deleteProperty(globalThis, "cancelAnimationFrame");
    Reflect.deleteProperty(globalThis, "__testLocalStorageStore");
  });

  it("loads saved reading theme and persists updated payload", () => {
    const store = (globalThis as any).__testLocalStorageStore as Map<string, string>;
    store.set(
      "reading_theme_v2",
      JSON.stringify({
        bgColor: "dark",
        fontSize: 24,
        fontFamily: "mali",
        isBold: true,
        textAlign: "justify",
      }),
    );

    renderHook();
    const rerendered = renderHook();

    expect(rerendered.bgColor).toBe("dark");
    expect(rerendered.fontSize).toBe(24);
    expect(rerendered.fontFamily).toBe("mali");
    expect(rerendered.isBold).toBe(true);
    expect(rerendered.textAlign).toBe("justify");

    expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith(
      "reading_theme_v2",
      expect.stringContaining('"bgColor":"dark"'),
    );
  });

  it("injects navbar override style and cleans up observer/style on unmount", () => {
    renderHook();

    expect((globalThis as any).document.createElement).toHaveBeenCalledWith("style");
    expect(styleElement).toBeTruthy();
    expect(styleElement.id).toBe("navbar-theme-override");
    expect(styleElement.innerHTML).toContain("#Navbar");
    expect(mutationObserverInstances[0].observe).toHaveBeenCalled();

    effectCleanups.forEach((cleanup) => cleanup());

    expect(styleElement.remove).toHaveBeenCalled();
    expect(mutationObserverInstances[0].disconnect).toHaveBeenCalled();
  });

  it("auto-scrolls by integer pixels when enabled and scroll speed accumulates", () => {
    const hook = renderHook();
    hook.setIsAutoScroll(true);
    hook.setScrollSpeed(1.2);

    renderHook();
    expect((globalThis as any).requestAnimationFrame).toHaveBeenCalled();

    const firstFrame = rafCallbacks[0];
    firstFrame(0);

    expect((globalThis as any).window.scrollBy).toHaveBeenCalledWith(0, 1);
  });

  it("stops auto-scroll when reaching bottom position", () => {
    const hook = renderHook();
    hook.setIsAutoScroll(true);
    (globalThis as any).window.scrollY = 4000;
    (globalThis as any).document.documentElement.scrollHeight = 5000;
    (globalThis as any).window.innerHeight = 1000;

    renderHook();
    const firstFrame = rafCallbacks[0];
    firstFrame(0);

    expect(stateStore[6]).toBe(false);
  });
});
