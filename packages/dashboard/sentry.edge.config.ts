/**
 * Sentry edge-runtime init.
 * Loaded by instrumentation.ts only when SENTRY_DSN is set.
 *
 * @license BSD-3-Clause
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
