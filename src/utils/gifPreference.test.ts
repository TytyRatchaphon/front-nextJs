import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GIF_MODE_DISABLED_VALUE,
  GIF_MODE_ENABLED_VALUE,
  GIF_MODE_STORAGE_KEY,
  readGifModePreference,
  writeGifModePreference,
} from './gifPreference';

const getOriginalWindow = () => (globalThis as any).window;
const getOriginalLocalStorage = () => (globalThis as any).localStorage;

describe('gifPreference', () => {
  const originalWindow = getOriginalWindow();
  const originalLocalStorage = getOriginalLocalStorage();

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }

    if (originalLocalStorage === undefined) {
      delete (globalThis as any).localStorage;
    } else {
      (globalThis as any).localStorage = originalLocalStorage;
    }

    vi.restoreAllMocks();
  });

  it('returns provided default value on server-side (no window)', () => {
    delete (globalThis as any).window;
    expect(readGifModePreference(false)).toBe(false);
    expect(readGifModePreference(true)).toBe(true);
  });

  it('reads disabled/enabled flags from localStorage', () => {
    const storage = {
      getItem: vi.fn().mockReturnValueOnce(GIF_MODE_DISABLED_VALUE).mockReturnValueOnce(GIF_MODE_ENABLED_VALUE),
      setItem: vi.fn(),
    };
    (globalThis as any).window = { localStorage: storage };
    (globalThis as any).localStorage = storage;

    expect(readGifModePreference(true)).toBe(false);
    expect(readGifModePreference(false)).toBe(true);
  });

  it('returns default value when storage key is missing', () => {
    const storage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    };
    (globalThis as any).window = { localStorage: storage };
    (globalThis as any).localStorage = storage;

    expect(readGifModePreference(false)).toBe(false);
    expect(readGifModePreference(true)).toBe(true);
  });

  it('returns default when reading localStorage throws', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('storage failed');
      }),
      setItem: vi.fn(),
    };
    (globalThis as any).window = { localStorage: storage };
    (globalThis as any).localStorage = storage;

    expect(readGifModePreference(false)).toBe(false);
    expect(readGifModePreference(true)).toBe(true);
  });

  it('writes enabled/disabled value to localStorage', () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    (globalThis as any).window = { localStorage: storage };
    (globalThis as any).localStorage = storage;

    writeGifModePreference(true);
    writeGifModePreference(false);

    expect(storage.setItem).toHaveBeenNthCalledWith(1, GIF_MODE_STORAGE_KEY, GIF_MODE_ENABLED_VALUE);
    expect(storage.setItem).toHaveBeenNthCalledWith(2, GIF_MODE_STORAGE_KEY, GIF_MODE_DISABLED_VALUE);
  });

  it('does not throw when writing localStorage fails', () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error('quota');
      }),
    };
    (globalThis as any).window = { localStorage: storage };
    (globalThis as any).localStorage = storage;

    expect(() => writeGifModePreference(true)).not.toThrow();
  });
});

