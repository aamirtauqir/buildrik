/**
 * Sentry client-side init (browser).
 * Gated on NEXT_PUBLIC_SENTRY_DSN — server-side SENTRY_DSN is not
 * exposed to the browser. Set NEXT_PUBLIC_SENTRY_DSN in Vercel env to
 * the same DSN value if you want browser-side error capture too.
 *
 * @license BSD-3-Clause
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
