/**
 * Live integration for the P0 review-round read + race-safe revoke.
 *   npx tsx scripts/smoke-review-round.ts
 *
 * Exercises getCurrentRound + revokeReviewRound against a real DB: the round
 * shape/counts, a matched-revision revoke, and the race guard — after a re-send
 * bumps the revision, a revoke with the STALE revision reports "token-changed"
 * instead of silently killing the fresh link. Cleans up after itself.
 */
import { prisma } from "@/lib/prisma";
import { getCurrentRound, revokeReviewRound } from "@/server/services/review.service";
import { issueReviewToken } from "@/server/services/client-review.service";

const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.error(`  ❌ ${m}`); process.exitCode = 1; };

async function main() {
  const stamp = `smoke-round-${Date.now()}`;
  const owner = await prisma.user.findFirst({ select: { id: true } });
  if (!owner) { console.error("no user to own the throwaway workspace"); process.exit(1); }
  const ws = await prisma.workspace.create({
    data: { name: stamp, slug: stamp, plan: "FREE", ownerId: owner.id },
    select: { id: true },
  });
  const site = await prisma.site.create({
    data: { name: stamp, slug: stamp, workspaceId: ws.id, createdBy: owner.id },
    select: { id: true, workspaceId: true },
  });
  const reviewer = await prisma.reviewer.create({
    data: { siteId: site.id, name: "Sara Client", email: `sara-${stamp}@x.test` },
    select: { id: true },
  });
  const review = await prisma.reviewRequest.create({
    data: { siteId: site.id, requestedById: owner.id, status: "PENDING", invitedEmail: `sara-${stamp}@x.test`, reviewerId: reviewer.id },
    select: { id: true },
  });
  await prisma.comment.create({ data: { siteId: site.id, reviewerId: reviewer.id, body: "hero too dark", status: "OPEN" } });
  await prisma.comment.create({ data: { siteId: site.id, reviewerId: reviewer.id, body: "resolved one", status: "RESOLVED" } });

  try {
    // 1. getCurrentRound
    const round = await getCurrentRound(site.id);
    if (!round) return bad("getCurrentRound returned null");
    round.id === review.id ? ok("round id matches") : bad(`round id ${round.id} != ${review.id}`);
    round.reviewerName === "Sara Client" ? ok("reviewer name joined") : bad(`reviewerName=${round.reviewerName}`);
    round.status === "PENDING" ? ok("status PENDING") : bad(`status=${round.status}`);
    round.openCommentCount === 1 ? ok("openCommentCount=1 (only OPEN counted)") : bad(`openCommentCount=${round.openCommentCount}`);
    round.roundNumber === 1 && round.totalRounds === 1 ? ok("round 1 of 1") : bad(`round ${round.roundNumber}/${round.totalRounds}`);
    typeof round.revision === "string" ? ok("revision is an ISO string") : bad("revision missing");

    // 2. stale revision → not-found/token-changed BEFORE a real revoke lands
    const stale = new Date(Date.now() - 60_000).toISOString();
    const staleRes = await revokeReviewRound(site.workspaceId, review.id, stale);
    staleRes.revoked === false && staleRes.reason === "token-changed"
      ? ok("stale revision → token-changed (no silent kill)")
      : bad(`stale revoke = ${JSON.stringify(staleRes)}`);

    // 3. cross-workspace id → not-found (IDOR)
    const idor = await revokeReviewRound("ws-does-not-exist", review.id, round.revision);
    idor.reason === "not-found" ? ok("cross-workspace → not-found (IDOR guard)") : bad(`idor = ${JSON.stringify(idor)}`);

    // 4. matched revision → revoked
    const good = await revokeReviewRound(site.workspaceId, review.id, round.revision);
    good.revoked === true ? ok("matched revision → revoked") : bad(`good revoke = ${JSON.stringify(good)}`);

    // 5. idempotent — a second revoke reports already-revoked
    const again = await revokeReviewRound(site.workspaceId, review.id, round.revision);
    again.reason === "already-revoked" ? ok("second revoke → already-revoked (idempotent)") : bad(`again = ${JSON.stringify(again)}`);

    // 6. the race: re-send mints a fresh token (bumps updatedAt); a revoke with
    //    the OLD revision must NOT kill the fresh link.
    await prisma.reviewRequest.update({ where: { id: review.id }, data: { revokedAt: null } });
    const fresh = await getCurrentRound(site.id);
    const oldRevision = fresh!.revision;
    await new Promise((r) => setTimeout(r, 5));
    await issueReviewToken(review.id, `sara-${stamp}@x.test`); // re-send → new token + updatedAt bump
    const raced = await revokeReviewRound(site.workspaceId, review.id, oldRevision);
    raced.revoked === false && raced.reason === "token-changed"
      ? ok("re-send then stale revoke → token-changed (fresh link survives)")
      : bad(`raced = ${JSON.stringify(raced)}`);
    const stillLive = await prisma.reviewRequest.findUnique({ where: { id: review.id }, select: { revokedAt: true } });
    stillLive?.revokedAt === null ? ok("fresh link is still live after the raced revoke") : bad("fresh link was killed by a stale revoke!");
  } finally {
    await prisma.comment.deleteMany({ where: { siteId: site.id } });
    await prisma.reviewRequest.deleteMany({ where: { siteId: site.id } });
    await prisma.reviewer.deleteMany({ where: { siteId: site.id } });
    await prisma.site.delete({ where: { id: site.id } });
    await prisma.workspace.delete({ where: { id: ws.id } });
    ok("cleaned up");
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => { console.error(e); process.exit(1); });
