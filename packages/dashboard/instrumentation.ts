/**
 * Next.js instrumentation hook — runs once per server worker on boot.
 * Initialises Sentry on the Node and Edge runtimes.
 *
 * Gate: skipped entirely when SENTRY_DSN is unset. Dev runs without
 * SENTRY_DSN in .env.local stay no-op; prod (Vercel project env) opts
 * in by setting the var.
 *
 * @license BSD-3-Clause
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  } else if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
