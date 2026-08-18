import { afterEach, describe, expect, it, vi } from 'vitest';

import { loginWithFacebookSdk, type FacebookLoginResponse } from './facebookSdk';

const HTTP_STATUS_ERROR = 'The method FB.getLoginStatus can no longer be called from http pages.';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loginWithFacebookSdk', () => {
  it('filters the known Facebook HTTP status error without blocking login', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const callback = vi.fn();
    const facebook = {
      login: vi.fn((
        loginCallback: (response: FacebookLoginResponse) => void,
        _options: { scope: string },
      ) => {
        setTimeout(() => {
          console.error(HTTP_STATUS_ERROR);
          loginCallback({ authResponse: { accessToken: 'facebook-token' } });
        }, 0);
      }),
    };

    loginWithFacebookSdk(facebook, callback, { scope: 'public_profile,email' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(facebook.login).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ authResponse: { accessToken: 'facebook-token' } });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('does not filter unrelated console errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const facebook = {
      login: vi.fn((
        _callback: (response: FacebookLoginResponse) => void,
        _options: { scope: string },
      ) => console.error('different Facebook error')),
    };

    loginWithFacebookSdk(facebook, vi.fn(), { scope: 'public_profile,email' });
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith('different Facebook error');
  });
});
