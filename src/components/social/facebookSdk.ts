export interface FacebookLoginResponse {
  authResponse?: {
    accessToken: string;
  };
}

interface FacebookSdk {
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: { scope: string },
  ) => void;
}

const FACEBOOK_HTTP_STATUS_ERROR = 'FB.getLoginStatus can no longer be called from http pages';

const isFacebookHttpStatusError = (args: Parameters<typeof console.error>) =>
  args.some((value) => typeof value === 'string' && value.includes(FACEBOOK_HTTP_STATUS_ERROR));

export const loginWithFacebookSdk = (
  facebook: FacebookSdk,
  callback: (response: FacebookLoginResponse) => void,
  options: { scope: string },
) => {
  const previousConsoleError = console.error;
  const filteredConsoleError: typeof console.error = (...args) => {
    if (isFacebookHttpStatusError(args)) return;
    previousConsoleError(...args);
  };
  const restoreConsoleError = () => {
    if (console.error === filteredConsoleError) console.error = previousConsoleError;
  };

  // FB.login logs this known status-check warning synchronously on HTTP dev origins,
  // even when the login callback succeeds. Keep all other SDK errors visible.
  console.error = filteredConsoleError;
  try {
    facebook.login(callback, options);
    queueMicrotask(restoreConsoleError);
  } catch (error) {
    restoreConsoleError();
    throw error;
  }
};
