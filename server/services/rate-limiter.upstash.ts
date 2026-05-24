/**
 * Prod-safe rate limiter — Upstash Redis backing.
 *
 * NOT WIRED. Reference template for when prod deploy needs serverless-safe
 * rate limiting (audit Iter 19 / Sprint 7).
 *
 * The default in-memory rate-limiter at ./rate-limiter.ts uses an
 * in-process Map. On Vercel serverless each cold instance gets its own
 * Map, so brute-force attacks against `auth.login` / `auth.checkEmail` /
 * `auth.resendVerification` are not actually throttled across instances
 * — the effective limit is (per-instance-limit × warm-instance-count),
 * which can be 10× the intended ceiling under attack load.
 *
 * To enable in prod:
 *
 * 1. Provision Upstash Redis (free tier covers ~10k req/day):
 *    https://upstash.com → Create Database → "Global" type
 *
 * 2. Copy `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` from the
 *    Upstash REST API panel. Add both to:
 *    - `.env.local` (local dev — optional; falls back to in-memory)
 *    - Vercel project Settings → Environment Variables (production)
 *
 * 3. Install deps:
 *    pnpm --filter @buildrik/dashboard add @upstash/ratelimit @upstash/redis
 *
 * 4. Swap the import in `server/auth.config.ts` and `server/trpc/trpc.ts`:
 *    -  import { checkRateLimit } from "@/server/services/rate-limiter";
 *    +  import { checkRateLimit } from "@/server/services/rate-limiter.upstash";
 *
 * 5. Both call sites already await — `auth.config.ts:44` is inside an
 *    `async authorize()` and `trpc.ts:122` is inside an async middleware,
 *    so the signature change (sync → Promise) drops in cleanly.
 *
 * 6. Verify: tail Upstash dashboard → confirm hit/limit counters increment
 *    on repeated failed-login attempts. Rollback = revert step 4.
 */

// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";

// const redis =
//   process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
//     ? new Redis({
//         url: process.env.UPSTASH_REDIS_REST_URL,
//         token: process.env.UPSTASH_REDIS_REST_TOKEN,
//       })
//     : null;

// /**
//  * Same signature as the in-memory checkRateLimit but async + Redis-backed.
//  * Returns { allowed, remaining, resetAt }. Falls back to in-memory impl
//  * when UPSTASH_* env vars are absent (dev / preview without creds).
//  */
// export async function checkRateLimit(
//   key: string,
//   maxAttempts: number,
//   windowMs: number,
// ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
//   if (!redis) {
//     const { checkRateLimit: fallback } = await import("./rate-limiter");
//     return fallback(key, maxAttempts, windowMs);
//   }
//
//   const ratelimit = new Ratelimit({
//     redis,
//     limiter: Ratelimit.slidingWindow(maxAttempts, `${windowMs} ms`),
//     analytics: true,
//     prefix: "buildrik:rl",
//   });
//
//   const { success, remaining, reset } = await ratelimit.limit(key);
//   return { allowed: success, remaining, resetAt: reset };
// }

// Re-export the in-memory impl so import paths can swap with zero code changes
// once @upstash/ratelimit + @upstash/redis are installed and the body above is
// uncommented.
export { checkRateLimit } from "./rate-limiter";
