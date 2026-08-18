import { describe, expect, it } from 'vitest';

import {
  getSprofileTabHref,
  resolveSprofileTabKey,
  SPROFILE_TAB_KEYS,
} from './sprofileTabs';

describe('sprofile tab links', () => {
  it('opens the delete-account tab from its dedicated query link', () => {
    expect(resolveSprofileTabKey('delete-account')).toBe(SPROFILE_TAB_KEYS.deleteAccount);
  });

  it('builds stable links when the selected tab changes', () => {
    expect(getSprofileTabHref(SPROFILE_TAB_KEYS.profile)).toBe('/sprofile');
    expect(getSprofileTabHref(SPROFILE_TAB_KEYS.security)).toBe('/sprofile?tab=security');
    expect(getSprofileTabHref(SPROFILE_TAB_KEYS.deleteAccount)).toBe('/sprofile?tab=delete-account');
  });

  it('falls back to the profile tab for unknown query values', () => {
    expect(resolveSprofileTabKey('unknown')).toBe(SPROFILE_TAB_KEYS.profile);
  });
});
