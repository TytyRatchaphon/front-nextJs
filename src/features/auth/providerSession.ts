export const PUBLIC_AUTH_REQUEST_CONFIG = {
  headers: { 'x-skip-auth': 'true' },
} as const;

export type ProviderSessionLogin<TUser> = (user: TUser, token: string) => Promise<boolean>;

export const completeProviderSession = async <TUser>(
  login: ProviderSessionLogin<TUser>,
  user: TUser,
  token: string,
  provider: 'EMAIL' | 'REGISTER' | 'GOOGLE' | 'APPLE' | 'LINE' | 'FACEBOOK',
) => {
  const completed = await login(user, token);
  if (!completed) throw new Error(`${provider}_SESSION_REJECTED`);
};
