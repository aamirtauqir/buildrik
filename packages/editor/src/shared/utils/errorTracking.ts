/**
 * Error Tracking — Sentry Integration (Optional)
 *
 * Dev bypass pattern: when VITE_SENTRY_DSN is not set or @sentry/react
 * is not installed, all exports are no-ops. Zero noise in local
 * development, full visibility in production.
 *
 * @module utils/errorTracking
 */

import { IS_DEV_BUILD, SENTRY_DSN } from "./runtimeEnv";

// Lazy-loaded Sentry — avoids build error when @sentry/react isn't installed
let _sentry: typeof import("@sentry/react") | null = null;

async function getSentry(): Promise<typeof import("@sentry/react") | null> {
  if (_sentry) return _sentry;
  if (!SENTRY_DSN) return null;
  try {
    _sentry = await import("@sentry/react");
    return _sentry;
  } catch {
    return null;
  }
}

/**
 * Initialise Sentry error tracking.
 * Safe to call unconditionally — returns immediately when DSN is absent
 * or @sentry/react is not installed.
 */
export async function initErrorTracking(): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.init({
    dsn: SENTRY_DSN!,
    /* `import.meta.env` does not exist in the Next-bundled editor, which is
       the build that ships — reading .MODE off undefined throws, and it would
       have thrown here only on the deployments that actually configure a DSN.
       runtimeEnv resolves this for both builds. */
    environment: IS_DEV_BUILD ? "development" : "production",
    enabled: !IS_DEV_BUILD,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    ignoreErrors: ["ResizeObserver loop", "Non-Error promise rejection", "AbortError"],
  });
}

/**
 * Capture an error with optional structured context.
 * No-op when Sentry is not configured or not installed.
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) return;

  // Fire-and-forget: load Sentry and report
  void getSentry().then((Sentry) => {
    if (!Sentry) return;
    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  });
}

/**
 * Associate the current session with a user (or clear it on sign-out).
 * No-op when Sentry is not configured or not installed.
 */
export function setUser(userId: string | null): void {
  if (!SENTRY_DSN) return;

  void getSentry().then((Sentry) => {
    if (!Sentry) return;
    Sentry.setUser(userId ? { id: userId } : null);
  });
}
