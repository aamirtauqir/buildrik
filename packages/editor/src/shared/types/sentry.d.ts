/**
 * Sentry Stub Type Declarations
 * Provides no-op types for @sentry/react when not installed
 *
 * This stub allows error tracking code to compile without requiring
 * the actual @sentry/react dependency. In production, install the
 * real package for full error tracking functionality.
 *
 * @module types/sentry
 */

declare module "@sentry/react" {
  export interface Scope {
    setExtra(key: string, value: unknown): void;
  }

  export interface User {
    id: string;
  }

  export interface SentryOptions {
    dsn: string;
    environment?: string;
    enabled?: boolean;
    tracesSampleRate?: number;
    sendDefaultPii?: boolean;
    ignoreErrors?: string[];
  }

  export function init(options: SentryOptions): void;
  export function captureException(error: Error): void;
  export function withScope(callback: (scope: Scope) => void): void;
  export function setUser(user: User | null): void;
}
