import { timingSafeEqual } from "node:crypto";

/**
 * Shared bearer check for the cron routes.
 *
 * Thirteen routes each carried `authHeader !== \`Bearer ${process.env.CRON_SECRET}\``.
 * Two problems with that line, and the second is the reason this file exists:
 *
 *  1. It is a non-constant-time string comparison of a secret.
 *  2. **It fails OPEN when the secret is unset.** Template interpolation of
 *     `undefined` produces the literal string "Bearer undefined", so a request
 *     sending exactly that header authenticates against an unconfigured
 *     deployment. `CRON_SECRET` is set in production today, which is the only
 *     reason this was not live — and "a var that is missing in prod" is the
 *     exact shape that hid three outages here before.
 *
 * Returns a Response to send back, or null when the caller may proceed.
 */
export function checkCronAuth(req: { headers: { get(name: string): string | null } }): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    /* Loud, not quiet: an unconfigured cron endpoint is a deployment fault, and
       a 500 says so where a 401 would read as "wrong token, try again". */
    return new Response("CRON_SECRET is not configured", { status: 500 });
  }

  const header = req.headers.get("authorization");
  if (!header) return new Response("Unauthorized", { status: 401 });

  const expected = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(header);
  /* timingSafeEqual throws on a length mismatch, so the length check is part of
     the comparison, not a shortcut around it. Length is not the secret. */
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  return null;
}
