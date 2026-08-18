import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { detectExtension } from './securityUtils';

const originalWindow = (globalThis as any).window;
const originalDocument = (globalThis as any).document;
const originalMutationObserver = (globalThis as any).MutationObserver;

class MockMutationObserver {
  callback: (mutations: any[]) => void;
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(callback: (mutations: any[]) => void) {
    this.callback = callback;
  }
}

describe('detectExtension', () => {
  beforeEach(() => {
    (globalThis as any).window = { location: { href: '/current' } };
    (globalThis as any).document = { body: {} };
    (globalThis as any).MutationObserver = MockMutationObserver;
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }

    if (originalDocument === undefined) {
      delete (globalThis as any).document;
    } else {
      (globalThis as any).document = originalDocument;
    }

    if (originalMutationObserver === undefined) {
      delete (globalThis as any).MutationObserver;
    } else {
      (globalThis as any).MutationObserver = originalMutationObserver;
    }
  });

  it('returns undefined when window is not available', () => {
    delete (globalThis as any).window;
    expect(detectExtension()).toBeUndefined();
  });

  it('observes body mutations and redirects when root node is removed', () => {
    const onDetect = vi.fn();
    const observer = detectExtension(onDetect) as unknown as MockMutationObserver;

    expect(observer).toBeInstanceOf(MockMutationObserver);
    expect(observer.observe).toHaveBeenCalledWith((globalThis as any).document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    observer.callback([
      {
        target: (globalThis as any).document.body,
        removedNodes: [{ nodeName: 'DIV', id: 'root' }],
      },
    ]);

    expect(onDetect).toHaveBeenCalledTimes(1);
    expect((globalThis as any).window.location.href).toBe('/');
  });

  it('does not redirect for unrelated removed node', () => {
    const onDetect = vi.fn();
    const observer = detectExtension(onDetect) as unknown as MockMutationObserver;

    observer.callback([
      {
        target: (globalThis as any).document.body,
        removedNodes: [{ nodeName: 'SPAN', id: 'other' }],
      },
    ]);

    expect(onDetect).not.toHaveBeenCalled();
    expect((globalThis as any).window.location.href).toBe('/current');
  });
});

