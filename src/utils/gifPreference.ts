export const GIF_MODE_STORAGE_KEY = 'enjoybook:gif-mode';
export const GIF_MODE_ENABLED_VALUE = '1';
export const GIF_MODE_DISABLED_VALUE = '0';

export const readGifModePreference = (defaultValue = true): boolean => {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const raw = window.localStorage.getItem(GIF_MODE_STORAGE_KEY);
    if (raw === null) return defaultValue;
    return raw !== GIF_MODE_DISABLED_VALUE;
  } catch {
    return defaultValue;
  }
};

export const writeGifModePreference = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      GIF_MODE_STORAGE_KEY,
      enabled ? GIF_MODE_ENABLED_VALUE : GIF_MODE_DISABLED_VALUE,
    );
  } catch {
    // ignore storage write errors
  }
};

