-- Shared rate-limit counters. Replaces the per-process in-memory Map, which
-- reset on every cold start and multiplied each limit by the lambda instance
-- count. The limiter increments via a single atomic upsert (see
-- server/services/rate-limiter.ts), so concurrent requests can't double-spend
-- a window.
CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

-- For the session-cleanup cron's expired-row prune.
CREATE INDEX "rate_limit_buckets_resetAt_idx" ON "rate_limit_buckets"("resetAt");
