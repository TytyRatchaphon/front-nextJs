import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let isFocusedValue = true;
const setIsFocusedMock = vi.fn((next: any) => {
  isFocusedValue = typeof next === "function" ? next(isFocusedValue) : next;
});
const effectCleanups: Array<() => void> = [];

const mockDetectExtension = vi.fn();

vi.mock("react", () => ({
  useState: (initial: any) => {
    isFocusedValue = initial;
    return [isFocusedValue, setIsFocusedMock];
  },
  useEffect: (effect: () => void | (() => void)) => {
    const cleanup = effect();
    if (typeof cleanup === "function") {
      effectCleanups.push(cleanup);
    }
  },
}));

vi.mock("@/utils/securityUtils", () => ({
  detectExtension: (...args: any[]) => mockDetectExtension(...args),
}));

import { useContentProtection } from "@/hooks/reader/useContentProtection";

describe("useContentProtection", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    effectCleanups.length = 0;
    isFocusedValue = true;

    class FakeNode {
      static ELEMENT_NODE = 1;
      nodeType: number;
      tagName: string;
      parentNode: { removeChild: ReturnType<typeof vi.fn> } | null;

      constructor(tagName = "DIV") {
        this.nodeType = 1;
        this.tagName = tagName.toUpperCase();
        this.parentNode = { removeChild: vi.fn() };
      }

      appendChild<T>(child: T): T {
        return child;
      }

      insertBefore<T>(newNode: T): T {
        return newNode;
      }
    }

    const mutationObservers: Array<{ cb: (mutations: any[]) => void; disconnect: ReturnType<typeof vi.fn>; observe: ReturnType<typeof vi.fn> }> = [];
    class FakeMutationObserver {
      cb: (mutations: any[]) => void;
      observe = vi.fn();
      disconnect = vi.fn();

      constructor(cb: (mutations: any[]) => void) {
        this.cb = cb;
        mutationObservers.push({ cb, disconnect: this.disconnect, observe: this.observe });
      }
    }

    const windowEvents = new Map<string, any>();
    const documentEvents = new Map<string, any>();
    const contentElement: any = {};

    const doc: any = {
      head: { appendChild: vi.fn() },
      body: new FakeNode("BODY"),
      createElement(tagName: string) {
        return new FakeNode(tagName);
      },
      querySelectorAll: vi.fn((selector: string) => (selector === ".episode-content" ? [contentElement] : [])),
      addEventListener: vi.fn((event: string, handler: any) => {
        documentEvents.set(event, handler);
      }),
      removeEventListener: vi.fn((event: string) => {
        documentEvents.delete(event);
      }),
    };

    const win: any = {
      console: {
        log: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
      setTimeout,
      clearTimeout,
      addEventListener: vi.fn((event: string, handler: any) => {
        windowEvents.set(event, handler);
      }),
      removeEventListener: vi.fn((event: string) => {
        windowEvents.delete(event);
      }),
    };

    (globalThis as any).Node = FakeNode;
    (globalThis as any).document = doc;
    (globalThis as any).window = win;
    (globalThis as any).MutationObserver = FakeMutationObserver;
    (globalThis as any).__TEST_WINDOW_EVENTS__ = windowEvents;
    (globalThis as any).__TEST_DOCUMENT_EVENTS__ = documentEvents;
    (globalThis as any).__TEST_CONTENT_ELEMENT__ = contentElement;
    (globalThis as any).__TEST_MUTATION_OBSERVERS__ = mutationObservers;

    const extensionObserver = { disconnect: vi.fn() };
    mockDetectExtension.mockReturnValue(extensionObserver);
    (globalThis as any).__TEST_EXTENSION_OBSERVER__ = extensionObserver;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("applies protections, blocks devtools-style keys, and restores on cleanup", () => {
    const onBlur = vi.fn();
    const hook = useContentProtection({ ep: 1 }, onBlur);

    expect(hook.isFocused).toBe(true);
    expect(typeof hook.setIsFocused).toBe("function");

    vi.advanceTimersByTime(1000);

    const contentElement = (globalThis as any).__TEST_CONTENT_ELEMENT__;
    expect(contentElement.innerText).toBe("Content is protected");
    expect(contentElement.textContent).toBe("Content is protected");

    const doc = (globalThis as any).document;
    expect(() => doc.createElement("iframe")).toThrow("iframe creation is not allowed on this page");

    const windowEvents = (globalThis as any).__TEST_WINDOW_EVENTS__ as Map<string, any>;
    const preventDefault = vi.fn();
    windowEvents.get("keydown")({
      key: "F12",
      ctrlKey: false,
      metaKey: false,
      keyCode: 123,
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(isFocusedValue).toBe(false);

    vi.advanceTimersByTime(2000);
    expect(isFocusedValue).toBe(true);

    const observers = (globalThis as any).__TEST_MUTATION_OBSERVERS__ as Array<any>;
    const iframeNode = new (globalThis as any).Node("iframe");
    iframeNode.parentNode = { removeChild: vi.fn() };
    observers[0].cb([{ addedNodes: [iframeNode] }]);
    expect(iframeNode.parentNode.removeChild).toHaveBeenCalledWith(iframeNode);

    effectCleanups.forEach((cleanup) => cleanup());

    expect(() => doc.createElement("iframe")).not.toThrow();
    const extObs = (globalThis as any).__TEST_EXTENSION_OBSERVER__;
    expect(extObs.disconnect).toHaveBeenCalled();
    expect(observers[0].disconnect).toHaveBeenCalled();
  });

  it("prevents contextmenu from both window and document handlers", () => {
    useContentProtection({ ep: 2 });
    vi.advanceTimersByTime(1000);

    const windowEvents = (globalThis as any).__TEST_WINDOW_EVENTS__ as Map<string, any>;
    const documentEvents = (globalThis as any).__TEST_DOCUMENT_EVENTS__ as Map<string, any>;

    const winPrevent = vi.fn();
    windowEvents.get("contextmenu")({ preventDefault: winPrevent });
    expect(winPrevent).toHaveBeenCalled();

    const docPrevent = vi.fn();
    documentEvents.get("contextmenu")({ preventDefault: docPrevent });
    expect(docPrevent).toHaveBeenCalled();
  });

  it("blocks iframe append/insert but allows non-iframe nodes", () => {
    useContentProtection({ ep: 3 });
    vi.advanceTimersByTime(1000);

    const doc = (globalThis as any).document;
    const body = doc.body;
    const iframeNode = new (globalThis as any).Node("iframe");
    const divNode = new (globalThis as any).Node("div");

    expect(() => body.appendChild(iframeNode)).toThrow("iframe insertion is not allowed");
    expect(() => body.insertBefore(iframeNode, null)).toThrow("iframe insertion is not allowed");
    expect(body.appendChild(divNode)).toBe(divNode);
    expect(body.insertBefore(divNode, null)).toBe(divNode);
  });

  it("keeps console methods unchanged in development mode", () => {
    process.env.NODE_ENV = "development";
    const originalLog = (globalThis as any).window.console.log;

    useContentProtection({ ep: 4 });
    vi.advanceTimersByTime(1000);

    expect((globalThis as any).window.console.log).toBe(originalLog);
  });

  it("does not override non-configurable text descriptors", () => {
    const contentElement = (globalThis as any).__TEST_CONTENT_ELEMENT__;
    Object.defineProperty(contentElement, "innerText", {
      configurable: false,
      get: () => "fixed-inner",
    });
    Object.defineProperty(contentElement, "textContent", {
      configurable: false,
      get: () => "fixed-text",
    });

    useContentProtection({ ep: 5 });
    vi.advanceTimersByTime(1000);

    expect(contentElement.innerText).toBe("fixed-inner");
    expect(contentElement.textContent).toBe("fixed-text");
  });
});
