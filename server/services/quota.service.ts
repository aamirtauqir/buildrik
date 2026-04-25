import { prisma } from "@/lib/prisma";

export const TIER_LIMITS: Record<string, number> = {
  FREE: 10,
  PRO: 200,
  BUSINESS: Infinity,
};

export interface QuotaStatus {
  ok: boolean;
  used: number;
  limit: number;
  resetsAt: Date;
}

function todayBucket(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextMidnight(): Date {
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  return next;
}

async function getTierLimit(userId: string): Promise<number> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { workspace: { select: { plan: true } } },
    orderBy: { joinedAt: "asc" },
  });
  const plan = member?.workspace?.plan ?? "FREE";
  return TIER_LIMITS[plan] ?? TIER_LIMITS.FREE;
}

export async function checkQuota(userId: string): Promise<QuotaStatus> {
  const limit = await getTierLimit(userId);
  const dayBucket = todayBucket();
  const usage = await prisma.aIUsage.findUnique({
    where: { userId_dayBucket: { userId, dayBucket } },
  });
  const used = usage?.count ?? 0;
  return {
    ok: used < limit,
    used,
    limit,
    resetsAt: nextMidnight(),
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
