import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// DB-backed collaboration op-log. Clients append ops; an SSE stream replays
// ops with seq greater than the client's last-seen seq. This is the serverless-
// friendly transport (no stateful WebSocket server) — the DB is the shared
// ordering authority. Latency is the poll interval, not true real-time, but it
// makes multi-user editing functional on the existing stack.

const MAX_BATCH = 200;

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
