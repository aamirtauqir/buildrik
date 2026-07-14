/**
 * Build the rate-limit screen's URL, carrying the limiter's real `resetAt`.
 *
 * `createRateLimitedProcedure` attaches `{ resetAt }` as the TRPCError cause, and
 * the errorFormatter forwards it to the client as `data.cause`. Without the param
 * the screen falls back to no countdown — which is honest — rather than the old
 * hardcoded 60s, which was a lie against a 15-minute window.
 */
export function rateLimitedHref(
  err: { data?: unknown } | null | undefined,
  base = "/auth/error/rate-limited"
): string {
  const data = err?.data as { cause?: { resetAt?: string } } | undefined;
  const resetAt = data?.cause?.resetAt;
  return resetAt ? `${base}?until=${encodeURIComponent(resetAt)}` : base;
}
