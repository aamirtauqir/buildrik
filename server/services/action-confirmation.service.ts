import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Single-use confirmation grants for privileged AI actions (platform phase 5).
 * Replaces the replayable stateless HMAC token: `propose` creates a row, `confirm`
 * consumes it ATOMICALLY (flips usedAt) so a grant runs exactly once and only
 * before it expires. The row id IS the token (random cuid). confirm also requires
 * the session actor to match the proposer.
 */
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function hashArgs(args: unknown): string {
  return createHash("sha256").update(JSON.stringify(args ?? {})).digest("hex");
}

export interface ConfirmationClaims {
  siteId: string;
  actionId: string;
  argsHash: string;
}

export async function createConfirmation(input: {
  actorId: string;
  siteId: string;
  actionId: string;
  args: unknown;
}): Promise<string> {
  const row = await prisma.actionConfirmation.create({
    data: {
      actorId: input.actorId,
      siteId: input.siteId,
      actionId: input.actionId,
      argsHash: hashArgs(input.args),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
    select: { id: true },
  });
  return row.id;
}

export type ConsumeResult =
  | { ok: true; claims: ConfirmationClaims }
  | { ok: false; reason: string };

export async function consumeConfirmation(
  token: string,
  sessionActorId: string,
): Promise<ConsumeResult> {
  // Atomic single-use: only an unused, unexpired grant for THIS actor flips to
  // usedAt. count === 0 means missing / already used / expired / wrong actor.
  const res = await prisma.actionConfirmation.updateMany({
    where: { id: token, actorId: sessionActorId, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (res.count === 0) return { ok: false, reason: "invalid-used-or-expired" };
  const row = await prisma.actionConfirmation.findUnique({
    where: { id: token },
    select: { siteId: true, actionId: true, argsHash: true },
  });
  if (!row) return { ok: false, reason: "invalid-used-or-expired" };
  return { ok: true, claims: row };
}
