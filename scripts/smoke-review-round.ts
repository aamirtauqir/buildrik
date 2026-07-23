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
import { getCurrentRound, revokeReviewRound, getApprovedSnapshot, listReviews } from "@/server/services/review.service";
import { issueReviewToken } from "@/server/services/client-review.service";
import { getHandoverRollup } from "@/server/services/handover.service";
import { renameWorkspaceComponent, deleteWorkspaceComponent, listWorkspaceComponents } from "@/server/services/site-component.service";

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

    // 7. §3 Compare source: no approved round yet → null (a state, not an error).
    const noSnap = await getApprovedSnapshot(site.id);
    noSnap === null ? ok("getApprovedSnapshot null before any approval") : bad(`expected null, got ${JSON.stringify(noSnap)?.slice(0, 60)}`);

    // 8. approve a round WITH a snapshot → getApprovedSnapshot returns those pages.
    const snapPages = [{ path: "home", html: "<div class='buildrick-root'><section class='buildrick-hero'>Hi</section></div>" }];
    await prisma.reviewRequest.update({
      where: { id: review.id },
      data: { status: "APPROVED", snapshotPages: snapPages },
    });
    const snap = await getApprovedSnapshot(site.id);
    Array.isArray(snap) && snap[0]?.path === "home" && snap[0]?.html.includes("buildrick-hero")
      ? ok("getApprovedSnapshot returns the frozen approved pages")
      : bad(`approved snapshot = ${JSON.stringify(snap)?.slice(0, 80)}`);

    // 9. cursor pagination against real Postgres (mocks can't prove cursor/skip).
    //    Two more non-PENDING rounds (pending-unique index allows one PENDING) →
    //    workspace has 3 reviews total (1 approved + 2). limit 2 → page + cursor.
    await prisma.reviewRequest.create({ data: { siteId: site.id, requestedById: owner.id, status: "CHANGES_REQUESTED" } });
    await prisma.reviewRequest.create({ data: { siteId: site.id, requestedById: owner.id, status: "CHANGES_REQUESTED" } });
    const p1 = await listReviews(site.workspaceId, undefined, { limit: 2 });
    p1.items.length === 2 && p1.nextCursor !== null
      ? ok("listReviews page 1 → 2 items + a nextCursor")
      : bad(`page1 = ${p1.items.length} items, cursor ${p1.nextCursor}`);
    const p2 = await listReviews(site.workspaceId, undefined, { limit: 2, cursor: p1.nextCursor! });
    const noOverlap = !p2.items.some((r) => p1.items.some((a) => a.id === r.id));
    p2.items.length === 1 && p2.nextCursor === null && noOverlap
      ? ok("listReviews page 2 → remaining item, no cursor, no overlap")
      : bad(`page2 = ${p2.items.length} items, cursor ${p2.nextCursor}, overlap=${!noOverlap}`);

    // 10. handover rollup — the draft site (never published, no domain/forms)
    //     rolls up to publish=pending → not ready to hand over.
    const rollup = await getHandoverRollup(site.workspaceId);
    const row = rollup.find((r) => r.siteId === site.id);
    const publishItem = row?.items.find((i) => i.key === "publish");
    row && publishItem?.status === "pending" && row.ready === false
      ? ok("handover rollup: draft site → publish pending, not ready")
      : bad(`handover row = ${JSON.stringify(row)?.slice(0, 100)}`);

    // 11. shared library — workspace rename/delete of a component master, over
    //     the real `site: { workspaceId }` join (mocks can't prove the join).
    await prisma.siteComponent.create({ data: { siteId: site.id, componentId: "smoke-comp", name: "Old name", payload: {} } });
    const ren = await renameWorkspaceComponent(site.workspaceId, "smoke-comp", "New name");
    const afterRename = await listWorkspaceComponents(site.workspaceId);
    ren.updated === 1 && afterRename.find((c) => c.componentId === "smoke-comp")?.name === "New name"
      ? ok("renameWorkspaceComponent renamed the master workspace-wide")
      : bad(`rename = ${JSON.stringify(ren)}, list=${JSON.stringify(afterRename)?.slice(0, 80)}`);
    const del = await deleteWorkspaceComponent(site.workspaceId, "smoke-comp");
    const afterDelete = await listWorkspaceComponents(site.workspaceId);
    del.deleted === 1 && !afterDelete.find((c) => c.componentId === "smoke-comp")
      ? ok("deleteWorkspaceComponent removed the master workspace-wide")
      : bad(`delete = ${JSON.stringify(del)}, still present=${!!afterDelete.find((c) => c.componentId === "smoke-comp")}`);
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
