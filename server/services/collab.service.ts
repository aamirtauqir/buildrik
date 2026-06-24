import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// DB-backed collaboration op-log. Clients append ops; an SSE stream replays
// ops with seq greater than the client's last-seen seq. This is the serverless-
// friendly transport (no stateful WebSocket server) — the DB is the shared
// ordering authority. Latency is the poll interval, not true real-time, but it
// makes multi-user editing functional on the existing stack.

const MAX_BATCH = 200;
// Replayable retention window. Ops older than this are pruned so the op-log
// doesn't grow without bound. A client whose last-seen op predates the window
// resyncs via a full project reload (see hasResyncGap), not op replay.
const RETENTION_MS = 24 * 60 * 60 * 1000;
// Deterministic prune cadence: every Nth append runs the age-based prune. Was a
// Math.random()<0.02 gamble, which never fired on low-traffic sites (table grew
// unbounded) and was non-reproducible. seq is a global monotonic counter, so
// modulo gives a steady, test-deterministic cadence regardless of per-site rate.
const PRUNE_EVERY = 50;

export async function appendCollabOp(
  siteId: string,
  authorId: string,
  clientId: string,
  op: unknown,
): Promise<{ seq: number; id: string }> {
  const row = await prisma.collabOperation.create({
    data: { siteId, authorId, clientId, op: op as Prisma.InputJsonValue },
    select: { id: true, seq: true },
  });
  // Deterministic best-effort prune — keeps the table bounded without a delete on
  // every write or a separate cron. Fires on a fixed cadence, not a coin flip.
  if (row.seq % PRUNE_EVERY === 0) {
    void prisma.collabOperation
      .deleteMany({ where: { siteId, createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } })
      .catch(() => {});
  }
  return row;
}

export async function getCollabOpsSince(siteId: string, sinceSeq: number) {
  return prisma.collabOperation.findMany({
    where: { siteId, seq: { gt: sinceSeq } },
    orderBy: { seq: "asc" },
    take: MAX_BATCH,
    select: { seq: true, op: true, clientId: true, authorId: true, createdAt: true },
  });
}

/** Latest seq for a site, or 0 when empty — used to seed a joining client. */
export async function latestCollabSeq(siteId: string): Promise<number> {
  const row = await prisma.collabOperation.findFirst({
    where: { siteId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  return row?.seq ?? 0;
}

/** Oldest still-retained seq for a site, or 0 when empty. */
export async function oldestCollabSeq(siteId: string): Promise<number> {
  const row = await prisma.collabOperation.findFirst({
    where: { siteId },
    orderBy: { seq: "asc" },
    select: { seq: true },
  });
  return row?.seq ?? 0;
}

/**
 * Whether a returning client must full-reload instead of replaying ops.
 *
 * If the op the client last saw (`sinceSeq`) is no longer in the log — i.e. it
 * is older than the oldest retained op — then ops it still needs may have been
 * pruned, and replaying only what survived would silently corrupt its state.
 * In that case it must resync from a fresh project load. When `sinceSeq >=`
 * the oldest retained op, its checkpoint is intact and every later op is
 * guaranteed present, so replay is safe.
 */
export async function hasResyncGap(siteId: string, sinceSeq: number): Promise<boolean> {
  if (sinceSeq <= 0) return false; // fresh client — gets head via hello, no replay gap
  const oldest = await oldestCollabSeq(siteId);
  return oldest > 0 && sinceSeq < oldest;
}
