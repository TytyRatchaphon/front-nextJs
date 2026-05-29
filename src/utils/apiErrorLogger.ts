/**
 * Centralized API error logger.
 *
 * In non-production environments errors are logged to the console so they are
 * immediately visible during development. In production the helper is a no-op
 * by default – replace the body with a call to your monitoring service
 * (e.g. Sentry) when one is integrated.
 */
export const logApiError = (
  context: string,
  error: unknown,
): void => {
  if (process.env.NODE_ENV === 'production') {
    // TODO: send to monitoring service (Sentry, Datadog, etc.)
    return;
  }

  console.error(`[API Error] ${context}:`, error);
};
