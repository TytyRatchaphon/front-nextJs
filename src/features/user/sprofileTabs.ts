export const SPROFILE_TAB_KEYS = {
  profile: '1',
  security: '2',
  deleteAccount: '3',
} as const;

export type SprofileTabKey = (typeof SPROFILE_TAB_KEYS)[keyof typeof SPROFILE_TAB_KEYS];

const tabKeyBySlug: Record<string, SprofileTabKey> = {
  profile: SPROFILE_TAB_KEYS.profile,
  security: SPROFILE_TAB_KEYS.security,
  'delete-account': SPROFILE_TAB_KEYS.deleteAccount,
};

const tabSlugByKey: Partial<Record<SprofileTabKey, string>> = {
  [SPROFILE_TAB_KEYS.security]: 'security',
  [SPROFILE_TAB_KEYS.deleteAccount]: 'delete-account',
};

export const resolveSprofileTabKey = (
  tab: string | string[] | null | undefined,
): SprofileTabKey => {
  const slug = Array.isArray(tab) ? tab[0] : tab;
  return slug ? tabKeyBySlug[slug] ?? SPROFILE_TAB_KEYS.profile : SPROFILE_TAB_KEYS.profile;
};

export const getSprofileTabHref = (key: string): string => {
  const slug = tabSlugByKey[key as SprofileTabKey];
  return slug ? `/sprofile?tab=${slug}` : '/sprofile';
};
