/**
 * Error Types for API and Application Errors
 * 
 * This module provides a comprehensive error handling system with:
 * - Custom ApiError class for API-related errors
 * - Type guards for error checking
 * - Helper functions for error handling
 */

/**
 * Custom error class for API-related errors
 */
class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

/**
 * Type guard to check if an error has a message property
 */
const hasErrorMessage = (error: unknown): error is { message: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
};

/**
 * Extract error message from unknown error type
 */
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (hasErrorMessage(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
};

