/**
 * AI adoption report — the STOP-AND-MEASURE read path.
 *
 *   npx tsx scripts/ai-adoption-report.ts                 # list workspaces with events
 *   npx tsx scripts/ai-adoption-report.ts <workspaceId>   # summary (last 30d)
 *   npx tsx scripts/ai-adoption-report.ts <workspaceId> 7 # summary (last 7d)
 *
 * Uses its own PrismaClient (so it runs without the `@/` alias resolver) and the
 * shared pure summarizer for the aggregation.
 */
import { PrismaClient } from "@prisma/client";
import { summarizeAdoptionRows } from "../server/services/ai-adoption.summary";

const prisma = new PrismaClient();
const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

async function main() {
  const workspaceId = process.argv[2];
  const days = Number(process.argv[3] ?? 30);

  if (!workspaceId) {
    const grouped = await prisma.aiAdoptionEvent.groupBy({
      by: ["workspaceId"],
      _count: { _all: true },
    });
    console.log("Usage: npx tsx scripts/ai-adoption-report.ts <workspaceId> [days=30]\n");
    if (grouped.length === 0) {
      console.log("No AI adoption events recorded yet.");
    } else {
      console.log("Workspaces with events:");
      for (const g of grouped) console.log(`  ${g.workspaceId}  (${g._count._all} events)`);
    }
    return;
  }

  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await prisma.aiAdoptionEvent.findMany({
    where: { workspaceId, createdAt: { gte: since } },
    select: { event: true, surface: true, metadata: true },
  });
  const s = summarizeAdoptionRows(rows, days);

  console.log(`\nAI adoption — workspace ${workspaceId} — last ${days}d\n`);
  console.log(`  edits applied : ${s.totals.applied}`);
  console.log(`  edits reverted: ${s.totals.reverted}   (revert rate ${pct(s.revertRate)})`);
  console.log(
    `  agent runs    : ${s.totals.agentRuns}   (step acceptance ${pct(s.agent.acceptanceRate)}, avg ${s.agent.avgDurationMs}ms)`,
  );
  if (s.bySurface.length) {
    console.log(`\n  applied by surface:`);
    for (const r of s.bySurface) console.log(`    ${r.surface.padEnd(8)} ${r.applied}`);
  }
  if (s.commandFrequency.length) {
    console.log(`\n  commands used (which jobs):`);
    for (const c of s.commandFrequency) console.log(`    ${c.commandId.padEnd(20)} ${c.count}`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
