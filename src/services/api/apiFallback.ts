const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return undefined;
};

export const warnApiFallback = (
  endpoint: string,
  fallback: string,
  details?: unknown,
) => {
  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") return;

  console.warn("[api-fallback]", {
    endpoint,
    fallback,
    message: getErrorMessage(details),
    details,
  });
};
