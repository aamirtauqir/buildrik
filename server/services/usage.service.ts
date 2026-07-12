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

export async function getWorkspaceUsage(workspaceId: string): Promise<WorkspaceUsage> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fourteenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);

  const siteIds = (await prisma.site.findMany({ where: { workspaceId }, select: { id: true } })).map((s) => s.id);

  const [workspace, storageAgg, aiJobCount, submissionCount, recentSubmissions] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { plan: true } }),
    prisma.mediaAsset.aggregate({ _sum: { bytes: true }, where: { siteId: { in: siteIds } } }),
    prisma.aIGenerationJob.count({ where: { workspaceId, createdAt: { gte: startOfMonth } } }),
    prisma.formSubmission.count({ where: { siteId: { in: siteIds }, createdAt: { gte: startOfMonth } } }),
    prisma.formSubmission.findMany({
      where: { siteId: { in: siteIds }, createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    }),
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

  const metrics: UsageMetric[] = [
    { key: "storage", label: "Storage", used: toGB(storageMB), limit: toGB(limits.storageMB as number), unit: "GB" },
    // Bandwidth is not measured server-side (served from the edge); shown against
    // the plan cap and flagged estimated rather than fabricating a used value.
    { key: "bandwidth", label: "Bandwidth", used: 0, limit: toGB(limits.bandwidthMB as number), unit: "GB", estimated: true },
    { key: "submissions", label: "Form submissions", used: submissionCount, limit: limits.formSubmissions as number, unit: "" },
    // dc design's 4th tile is "Build minutes" (untracked); AI generations is the
    // real per-workspace monthly counter we do measure.
    { key: "ai", label: "AI generations", used: aiJobCount, limit: limits.aiGenerations as number, unit: "" },
  ];

  return {
    plan,
    period: { label: startOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }) },
    metrics,
    submissionSeries,
  };
}
