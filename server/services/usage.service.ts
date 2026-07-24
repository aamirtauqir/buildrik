import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

export interface UsageMetric {
  key: string;
  label: string;
  used: number;
  /** -1 = unlimited */
  limit: number;
  unit: string;
  /** true when the source metric isn't measured server-side yet */
  estimated?: boolean;
}

export interface WorkspaceUsage {
  plan: PlanName;
  period: { label: string };
  metrics: UsageMetric[];
  /** last-14-day daily form-submission counts, oldest → newest */
  submissionSeries: { day: string; count: number }[];
}

const MB_PER_GB = 1024;
const toGB = (mb: number) => Math.round((mb / MB_PER_GB) * 10) / 10;

// Build minutes aren't in PLAN_LIMITS — builds run off-platform and aren't
// metered server-side. These are the per-tier caps surfaced in the Usage
// "Build minutes" tile (design's 4th tile). -1 = unlimited.
const BUILD_MINUTES_LIMIT: Record<PlanName, number> = { FREE: 500, PRO: 2500, BUSINESS: -1 };

export async function getWorkspaceUsage(workspaceId: string): Promise<WorkspaceUsage> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fourteenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);

  const siteIds = (await prisma.site.findMany({ where: { workspaceId }, select: { id: true } })).map((s) => s.id);

  const [workspace, storageAgg, submissionCount, recentSubmissions, memberCount, aiCount] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { plan: true } }),
    prisma.mediaAsset.aggregate({ _sum: { bytes: true }, where: { siteId: { in: siteIds } } }),
    prisma.formSubmission.count({ where: { siteId: { in: siteIds }, createdAt: { gte: startOfMonth } } }),
    prisma.formSubmission.findMany({
      where: { siteId: { in: siteIds }, createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.workspaceMember.count({ where: { workspaceId, status: "ACTIVE" } }),
    prisma.aIGenerationJob.count({ where: { workspaceId, createdAt: { gte: startOfMonth } } }),
  ]);

  const plan = (workspace?.plan as PlanName) ?? "FREE";
  const limits = PLAN_LIMITS[plan];
  const storageMB = Math.round((storageAgg._sum?.bytes ?? 0) / (1024 * 1024));

  // 14-day daily submission series (fill gaps with 0)
  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const s of recentSubmissions) {
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const submissionSeries = [...buckets.entries()].map(([day, count]) => ({ day, count }));

  // Lead with the metrics that actually gate the workspace (sites, team, AI,
  // storage, submissions) — the page used to show only bandwidth/build (both
  // permanently 0) + submissions/storage, omitting every real quota driver.
  const metrics: UsageMetric[] = [
    { key: "sites", label: "Sites", used: siteIds.length, limit: limits.sites as number, unit: "" },
    { key: "team", label: "Team members", used: memberCount, limit: limits.teamMembers as number, unit: "" },
    { key: "ai", label: "AI generations", used: aiCount, limit: limits.aiGenerations as number, unit: "" },
    { key: "storage", label: "Storage", used: toGB(storageMB), limit: toGB(limits.storageMB as number), unit: "GB" },
    { key: "submissions", label: "Form submissions", used: submissionCount, limit: limits.formSubmissions as number, unit: "" },
    // Bandwidth + build minutes aren't metered server-side (edge/off-platform);
    // shown against the plan cap and flagged estimated rather than fabricated.
    { key: "bandwidth", label: "Bandwidth", used: 0, limit: toGB(limits.bandwidthMB as number), unit: "GB", estimated: true },
    { key: "build", label: "Build minutes", used: 0, limit: BUILD_MINUTES_LIMIT[plan], unit: "", estimated: true },
  ];

  return {
    plan,
    period: { label: startOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }) },
    metrics,
    submissionSeries,
  };
}
