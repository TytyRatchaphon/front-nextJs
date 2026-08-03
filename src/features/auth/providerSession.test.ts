import { describe, expect, it, vi } from 'vitest';

import { completeProviderSession } from './providerSession';

describe('completeProviderSession', () => {
  it.each(['GOOGLE', 'APPLE', 'LINE', 'FACEBOOK'] as const)(
    'passes one normalized %s result to the lifecycle command',
    async (provider) => {
      const login = vi.fn().mockResolvedValue(true);
      const user = { fullname: `${provider} User` };

      await completeProviderSession(login, user, `${provider.toLowerCase()}-token`, provider);

      expect(login).toHaveBeenCalledOnce();
      expect(login).toHaveBeenCalledWith(user, `${provider.toLowerCase()}-token`);
    },
  );

  it('rejects navigation eligibility when the lifecycle rejects the credential', async () => {
    const login = vi.fn().mockResolvedValue(false);

    await expect(completeProviderSession(login, {}, 'token', 'GOOGLE'))
      .rejects.toThrow('GOOGLE_SESSION_REJECTED');
  });
});
