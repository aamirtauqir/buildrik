/**
 * Aquibra Helpers - Type Definitions
 * Core types used across helper utilities
 *
 * @module utils/helpers/types
 * @license BSD-3-Clause
 */

// =============================================================================
// FUNCTION TYPES
// =============================================================================

/** Generic function type - flexible for various utility functions */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any;

/** Strict function type for when type safety is critical */
export type StrictFunction<TArgs extends unknown[], TReturn> = (...args: TArgs) => TReturn;

// =============================================================================
// VALUE TYPES
// =============================================================================

/** Primitive types */
export type Primitive = string | number | boolean | null | undefined | symbol | bigint;

/** Deep partial type */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/** Object path type */
export type Path = string | (string | number)[];

// =============================================================================
// RESULT TYPE
// =============================================================================

/** Result type for error handling */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// =============================================================================
// EVENT TYPES
// =============================================================================

export type EventHandler<T = unknown> = (data: T) => void;

export interface EventEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void;
  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void;
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
  emit<K extends keyof Events>(event: K, data: Events[K]): void;
  clear(): void;
}

// =============================================================================
// TREE TYPES
// =============================================================================

/**
 * Interface for tree-like elements with children
 */
export interface TreeNode<T = unknown> {
  getChildren?: () => T[];
}

// =============================================================================
// FUNCTION UTILITY TYPES
// =============================================================================

export interface DebouncedFunction<T extends AnyFunction> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
}

export interface ThrottledFunction<T extends AnyFunction> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

/** Promise-like interface for type checking */
export interface PromiseLikeShape {
  then: unknown;
  catch: unknown;
}
