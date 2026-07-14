import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiter backed by Postgres so the count is shared across
 * serverless instances (an in-memory Map resets per lambda, silently turning
 * every limit into N×configured). The whole check is ONE atomic upsert:
 * concurrent requests serialize on the row, so a burst can't double-spend a
 * window. Expired rows are pruned by the session-cleanup cron.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = new Date();
  const newResetAt = new Date(now.getTime() + windowMs);

  // Raw SQL (physical table name per @@map) — Prisma's upsert can't express
  // "reset the counter only if the window lapsed" in one statement.
  //
  // `resetAt` is `timestamp WITHOUT time zone`, and raw SQL binds a JS Date as
  // LOCAL wall-clock. Reading it straight back and calling .getTime() therefore
  // reports an instant shifted by the server's UTC offset — on a UTC+5 box the
  // countdown read "313 minutes" for a 15-minute window. Enforcement was never
  // wrong (both sides of the comparison carry the same shift), but the value is
  // unusable off the row. So compute the remaining seconds IN Postgres, where
  // both operands live in the same space, and rebuild the instant from the
  // Node clock.
  const rows = await prisma.$queryRaw<{ count: number; secondsLeft: number }[]>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${newResetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit_buckets"."resetAt" < ${now} THEN 1
        ELSE "rate_limit_buckets"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "rate_limit_buckets"."resetAt" < ${now} THEN ${newResetAt}
        ELSE "rate_limit_buckets"."resetAt"
      END
    RETURNING "count", EXTRACT(EPOCH FROM ("resetAt" - ${now}))::double precision AS "secondsLeft"
  `;

  const row = rows[0];
  const secondsLeft = Math.max(0, Math.ceil(Number(row.secondsLeft)));
  return {
    allowed: row.count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - row.count),
    resetAt: now.getTime() + secondsLeft * 1000,
  };
}

/**
 * Read-only check: does `key` still have budget WITHOUT consuming any? Lets a
 * caller gate on the limit but only spend budget on the outcomes it cares about
 * (e.g. login counts failures only, so a successful login never burns the bucket).
 */
export async function peekRateLimit(
  key: string,
  maxAttempts: number
): Promise<{ allowed: boolean }> {
  const now = new Date();
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    SELECT "count", "resetAt" FROM "rate_limit_buckets" WHERE "key" = ${key}
  `;
  const row = rows[0];
  if (!row || row.resetAt < now) return { allowed: true };
  return { allowed: row.count < maxAttempts };
}
