/**
 * Live integration for P1 publish truth + rollback (worker-independent parts).
 *   npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/smoke-publish-rollback.ts
 *
 * Verifies against a real DB: completePublish RETAINS the payload (was nulled),
 * prune caps at 20, getPublishHistory reports rollbackable without leaking the
 * HTML, and rollbackPublish refuses a pruned / non-completed target. The
 * rollback→worker-dispatch happy path is covered by the unit test (no Next
 * server here to dispatch to). Cleans up after itself.
 */
import { prisma } from "@/lib/prisma";
import { completePublish, getPublishHistory, rollbackPublish } from "@/server/services/publish.service";

const ok = (m: string) => console.log(`  ✅ ${m}`);
const bad = (m: string) => { console.error(`  ❌ ${m}`); process.exitCode = 1; };

async function main() {
  const stamp = `smoke-pub-${Date.now()}`;
  const owner = await prisma.user.findFirst({ select: { id: true } });
  if (!owner) { console.error("no user"); process.exit(1); }
  const ws = await prisma.workspace.create({ data: { name: stamp, slug: stamp, plan: "FREE", ownerId: owner.id }, select: { id: true } });
  const site = await prisma.site.create({ data: { name: stamp, slug: stamp, workspaceId: ws.id, createdBy: owner.id }, select: { id: true } });
  const pages = [{ path: "/", html: "<h1>v1</h1>" }];

  try {
    // A QUEUED job carrying a payload → completePublish should KEEP the payload.
    const j = await prisma.publishBuildJob.create({
      data: { siteId: site.id, workspaceId: ws.id, status: "QUEUED", progress: 0, steps: [], log: { pages } },
      select: { id: true },
    });
    await completePublish(j.id, "https://x.vercel.app");
    const after = await prisma.publishBuildJob.findUnique({ where: { id: j.id }, select: { status: true, log: true } });
    after?.status === "COMPLETED" ? ok("job COMPLETED") : bad(`status=${after?.status}`);
    after?.log != null ? ok("payload RETAINED on complete (rollbackable)") : bad("payload was nulled — rollback impossible");

    // history: rollbackable, no log leak
    const hist = await getPublishHistory(site.id);
    hist.length === 1 && hist[0].rollbackable ? ok("history shows the version rollbackable") : bad(`history=${JSON.stringify(hist)}`);
    !("log" in (hist[0] as object)) ? ok("history never leaks the HTML payload") : bad("history leaked log!");
    hist[0].version === 1 ? ok("version numbered v1") : bad(`version=${hist[0].version}`);

    // rollback refuses a pruned target
    const pruned = await prisma.publishBuildJob.create({
      data: { siteId: site.id, workspaceId: ws.id, status: "COMPLETED", completedAt: new Date(), steps: [], log: undefined },
      select: { id: true },
    });
    await rollbackPublish(ws.id, site.id, pruned.id, owner.id).then(
      () => bad("rollback of a pruned target should have failed"),
      (e) => (String(e.message) === "NOT_ROLLBACKABLE" ? ok("pruned target → NOT_ROLLBACKABLE") : bad(`got ${e.message}`)),
    );

    // rollback refuses a non-completed target
    const failed = await prisma.publishBuildJob.create({
      data: { siteId: site.id, workspaceId: ws.id, status: "FAILED", steps: [], log: { pages } },
      select: { id: true },
    });
    await rollbackPublish(ws.id, site.id, failed.id, owner.id).then(
      () => bad("rollback of a FAILED target should have failed"),
      (e) => (String(e.message) === "NOT_ROLLBACKABLE" ? ok("non-completed target → NOT_ROLLBACKABLE") : bad(`got ${e.message}`)),
    );

    // rollback refuses a cross-workspace id (IDOR)
    await rollbackPublish("ws-nope", site.id, j.id, owner.id).then(
      () => bad("cross-workspace rollback should have failed"),
      (e) => (String(e.message) === "NOT_FOUND" ? ok("cross-workspace → NOT_FOUND (IDOR)") : bad(`got ${e.message}`)),
    );

    // prune: 21 completed-with-payload → oldest loses its payload
    for (let i = 0; i < 20; i++) {
      await prisma.publishBuildJob.create({
        data: { siteId: site.id, workspaceId: ws.id, status: "COMPLETED", completedAt: new Date(Date.now() + i * 1000), steps: [], log: { pages } },
      });
    }
    // completing one more triggers the prune (now >20 with payload)
    const trigger = await prisma.publishBuildJob.create({
      data: { siteId: site.id, workspaceId: ws.id, status: "QUEUED", progress: 0, steps: [], log: { pages } },
      select: { id: true },
    });
    await completePublish(trigger.id, "https://x.vercel.app");
    // the oldest completed-with-payload (job j) is beyond the 20-most-recent
    // window → its payload is pruned.
    const jStill = await prisma.publishBuildJob.findUnique({ where: { id: j.id }, select: { log: true } });
    jStill?.log == null ? ok("prune nulled the oldest payload (kept 20 most recent)") : bad("oldest payload not pruned");
  } finally {
    await prisma.publishBuildJob.deleteMany({ where: { siteId: site.id } });
    await prisma.site.delete({ where: { id: site.id } });
    await prisma.workspace.delete({ where: { id: ws.id } });
    ok("cleaned up");
  }
}

main().then(() => process.exit(process.exitCode ?? 0)).catch((e) => { console.error(e); process.exit(1); });
