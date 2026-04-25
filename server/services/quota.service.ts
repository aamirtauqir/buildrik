import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

export const UNLIMITED = -1;

export interface QuotaStatus {
  ok: boolean;
  used: number;
  limit: number;
  resetsAt: Date;
}

function todayBucket(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextMidnightUTC(): Date {
  const next = new Date();
  next.setUTCHours(24, 0, 0, 0);
  return next;
}

async function getTierLimit(userId: string): Promise<number> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { workspace: { select: { plan: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const plan = (member?.workspace?.plan ?? "FREE") as PlanName;
  return PLAN_LIMITS[plan].aiPromptsPerDay as number;
}

export async function checkQuota(userId: string): Promise<QuotaStatus> {
  const limit = await getTierLimit(userId);
  const dayBucket = todayBucket();
  const usage = await prisma.aIUsage.findUnique({
    where: { userId_dayBucket: { userId, dayBucket } },
  });
  const used = usage?.count ?? 0;
  return {
    ok: limit === UNLIMITED || used < limit,
    used,
    limit,
    resetsAt: nextMidnightUTC(),
  };
}

export async function recordUsage(userId: string, model: string): Promise<void> {
  const dayBucket = todayBucket();
  await prisma.aIUsage.upsert({
    where: { userId_dayBucket: { userId, dayBucket } },
    create: { userId, dayBucket, count: 1, model },
    update: { count: { increment: 1 }, model },
  });
}
