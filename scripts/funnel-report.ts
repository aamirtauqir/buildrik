/**
 * Funnel report — the numbers that already exist and nobody has counted.
 *
 *   npx tsx scripts/funnel-report.ts        # last 8 weeks
 *   npx tsx scripts/funnel-report.ts 4      # last 4 weeks
 *
 * WHY THIS IS A SCRIPT AND NOT A TABLE
 *
 * A 2026-08-26 review looked for analytics by grepping for
 * `posthog|mixpanel|amplitude|analytics.track|signup_completed` and found
 * nothing — which was true and gave exactly the wrong impression. The facts are
 * already recorded, in tables that already have indexes:
 *
 *   - signups → `audit_logs` where action in (SIGNUP, OAUTH_SIGNUP). Checked
 *     all 17 cron routes: there is no audit-log purge, so the full history
 *     since launch is sitting there.
 *   - review rounds → every send writes a `ReviewRequest`;
 *     `invitedEmail IS NOT NULL` is exactly "a round that went to a client".
 *   - publishes → `PublishJob`, and `Site.publishedAt`.
 *
 * So the gap was never a writer. Nobody had run the query. This is that query:
 * no new table, no vendor, no module-level client, nothing to maintain.
 *
 * ONE THING TO READ CAREFULLY: `approved → published` is reported as its own
 * step on purpose. Publishing needs the workspace's own Vercel OAuth connection
 * and `runPrePublishChecks` hard-fails without one, so a "rounds sent, nothing
 * published" reading is a DEPLOY signal, not a review-loop signal. Split here so
 * the first real numbers cannot be misread as the wedge failing.
 *
 * @license BSD-3-Clause
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const pct = (n: number, d: number) => (d === 0 ? "  — " : `${Math.round((n / d) * 100)}%`.padStart(4));
const pad = (v: string | number, w: number) => String(v).padStart(w);

async function main() {
  const weeks = Math.max(1, Number(process.argv[2] ?? 8));
  const since = new Date(Date.now() - weeks * WEEK_MS);

  const [signups, sites, rounds, publishes] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: { in: ["SIGNUP", "OAUTH_SIGNUP"] }, status: "success", createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.site.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.reviewRequest.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true, invitedEmail: true },
    }),
    prisma.site.findMany({
      where: { lastPublishedAt: { not: null, gte: since } },
      select: { lastPublishedAt: true },
    }),
  ]);

  const bucket = (d: Date) => Math.floor((Date.now() - d.getTime()) / WEEK_MS);
  const rows: { signups: number; sites: number; sent: number; approved: number; published: number }[] =
    Array.from({ length: weeks }, () => ({ signups: 0, sites: 0, sent: 0, approved: 0, published: 0 }));
  const put = (i: number, k: keyof (typeof rows)[number]) => {
    if (i >= 0 && i < weeks) rows[i][k] += 1;
  };

  for (const s of signups) put(bucket(s.createdAt), "signups");
  for (const s of sites) put(bucket(s.createdAt), "sites");
  for (const p of publishes) put(bucket(p.lastPublishedAt!), "published");
  for (const r of rounds) {
    // A round with no invited email is an INTERNAL admin submit, not the wedge.
    if (!r.invitedEmail) continue;
    put(bucket(r.createdAt), "sent");
    if (r.status === "APPROVED") put(bucket(r.createdAt), "approved");
  }

  console.log(`\nFunnel — last ${weeks} week(s), most recent first\n`);
  console.log("  week   signups  sites   rounds sent   approved   send→appr   published");
  console.log("  ────   ───────  ─────   ───────────   ────────   ─────────   ─────────");
  for (let i = 0; i < weeks; i++) {
    const r = rows[i];
    console.log(
      `  ${pad(`-${i}w`, 4)}   ${pad(r.signups, 7)}  ${pad(r.sites, 5)}   ${pad(r.sent, 11)}   ` +
        `${pad(r.approved, 8)}   ${pct(r.approved, r.sent)}        ${pad(r.published, 9)}`,
    );
  }

  const tot = rows.reduce(
    (a, r) => ({
      signups: a.signups + r.signups, sites: a.sites + r.sites, sent: a.sent + r.sent,
      approved: a.approved + r.approved, published: a.published + r.published,
    }),
    { signups: 0, sites: 0, sent: 0, approved: 0, published: 0 },
  );
  console.log("  ────   ───────  ─────   ───────────   ────────   ─────────   ─────────");
  console.log(
    `  all    ${pad(tot.signups, 7)}  ${pad(tot.sites, 5)}   ${pad(tot.sent, 11)}   ` +
      `${pad(tot.approved, 8)}   ${pct(tot.approved, tot.sent)}        ${pad(tot.published, 9)}`,
  );

  const invitesFailed = await prisma.auditLog.count({
    where: { action: "REVIEW_INVITE_EMAIL_FAILED", createdAt: { gte: since } },
  });
  console.log(`\n  client invites that never sent: ${invitesFailed}`);
  if (tot.sent > 0 && tot.published === 0) {
    console.log(
      "\n  NOTE: rounds are being sent and nothing has published. Publishing needs the\n" +
        "  workspace's own Vercel connection (runPrePublishChecks hard-fails without one),\n" +
        "  so read this as a deploy signal before reading it as a review-loop signal.",
    );
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
