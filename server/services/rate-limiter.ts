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
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
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
    RETURNING "count", "resetAt"
  `;

  const row = rows[0];
  return {
    allowed: row.count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - row.count),
    resetAt: row.resetAt.getTime(),
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
