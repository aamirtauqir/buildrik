/**
 * S-11 — `peekRateLimit` compared `row.resetAt < now` in JAVASCRIPT.
 * `resetAt` is `timestamp WITHOUT time zone`, and the write/read round trip
 * through the Postgres SESSION's `TimeZone` GUC is asymmetric: on INSERT,
 * Prisma converts the JS Date (a UTC instant) into the session-timezone
 * wall-clock digits before storing them; on READ, those same digits come
 * back taken at face value as UTC, with no reverse conversion. For a session
 * whose TimeZone is BEHIND UTC (e.g. `America/New_York`, UTC-4/-5), that
 * asymmetry shifts every stored `resetAt` EARLIER than intended — a
 * still-future expiry reads back as already in the past. Verified
 * empirically against this connection: `SET TIME ZONE 'America/New_York'`
 * on a just-written, still-15-minutes-in-the-future `resetAt` reads it back
 * ~4-5 hours earlier — already before `now`. The JS comparison
 * `resetAt < now` therefore read true for a bucket that had NOT actually
 * expired, so peek always reported `allowed: true`, even for a bucket
 * already at its max count. The fix computes the comparison IN SQL
 * (`("resetAt" < $now) AS "expired"`), the same discipline `checkRateLimit`
 * already uses for its write — both sides of the comparison live in
 * Postgres's own time space, so the session TimeZone's write/read asymmetry
 * never has anywhere to introduce an error.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, peekRateLimit } from "@/server/services/rate-limiter";
import { truncateTables } from "./helpers";

beforeEach(async () => {
  await truncateTables("rateLimitBucket");
  // Session-level GUC — persists for this connection for the rest of the
  // test (Prisma reuses the pooled connection across sequential awaits).
  await prisma.$executeRawUnsafe(`SET TIME ZONE 'America/New_York'`);
});

afterAll(async () => {
  await prisma.$executeRawUnsafe(`RESET TIME ZONE`);
});

describe("peekRateLimit — TZ-independent expiry (S-11)", () => {
  it("reports allowed:false for a bucket at max, still inside its window, under a shifted session TimeZone", async () => {
    const key = "s11-peek-tz";
    const max = 3;
    await checkRateLimit(key, max, 15 * 60 * 1000);
    await checkRateLimit(key, max, 15 * 60 * 1000);
    await checkRateLimit(key, max, 15 * 60 * 1000); // count === max now

    const peek = await peekRateLimit(key, max);
    // Before the fix this read `false` (JS-side comparison saw the still-live
    // resetAt as already past under this session TimeZone) — bucket is full,
    // not expired, so peek must refuse.
    expect(peek.allowed).toBe(false);
  });

  it("still reports allowed:true once the count is genuinely below max", async () => {
    const key = "s11-peek-tz-2";
    const max = 3;
    await checkRateLimit(key, max, 15 * 60 * 1000);
    const peek = await peekRateLimit(key, max);
    expect(peek.allowed).toBe(true);
  });

  it("reports allowed:true for a key with no bucket row at all", async () => {
    const peek = await peekRateLimit("s11-peek-tz-missing", 3);
    expect(peek.allowed).toBe(true);
  });
});
