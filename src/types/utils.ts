/**
 * Type Utilities
 * 
 * Common utility types used throughout the application
 */

/**
 * Make a type nullable
 */
export type Nullable<T> = T | null;

/**
 * Make a type optional (nullable or undefined)
 */
export type Optional<T> = T | null | undefined;

/**
 * Make specific keys of a type optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific keys of a type required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Deep partial - makes all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep readonly - makes all properties readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Extract keys of a type that are of a specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Make all properties mutable (remove readonly)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Prettify - expand object types for better IDE display
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
