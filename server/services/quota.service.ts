import { prisma } from "@/lib/prisma";
import {
  PLAN_LIMITS,
  PLAN_MODELS,
  type PlanName,
} from "@/lib/constants/plan-limits";

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

/**
 * Read a user's AI-prompt usage for today. This is the limit that actually
 * blocks in-editor AI (reserveQuota enforces aiPromptsPerDay), so the AI-credits
 * UI can surface it instead of only the monthly site-generation count.
 */
export async function getDailyPromptUsage(
  userId: string,
  plan: PlanName,
): Promise<{ used: number; limit: number }> {
  const limit = PLAN_LIMITS[plan].aiPromptsPerDay as number;
  const row = await prisma.aIUsage.findUnique({
    where: { userId_dayBucket: { userId, dayBucket: todayBucket() } },
    select: { count: true },
  });
  return { used: row?.count ?? 0, limit };
}

async function getUserPlan(userId: string): Promise<PlanName> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { workspace: { select: { plan: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return (member?.workspace?.plan ?? "FREE") as PlanName;
}

async function getTierLimit(userId: string): Promise<number> {
  const plan = await getUserPlan(userId);
  return PLAN_LIMITS[plan].aiPromptsPerDay as number;
}

function isUniqueViolation(e: unknown): boolean {
  return (e as { code?: string })?.code === "P2002";
}

/**
 * Atomically reserve one quota unit BEFORE the AI provider call, closing the
 * check-then-act race where N concurrent requests all pass a read-only
 * `checkQuota` before any of them increments. Strategy: a conditional
 * `updateMany` that only increments a row already under the limit, falling
 * back to a `create` for the first call of the day. Concurrency can therefore
 * never push the count past the limit. Refund with `releaseQuota` if the
 * provider call fails before delivering value.
 */
export async function reserveQuota(
  userId: string,
  model: string,
): Promise<QuotaStatus> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].aiPromptsPerDay as number;
  const dayBucket = todayBucket();
  const resetsAt = nextMidnightUTC();

  if (limit === UNLIMITED) {
    await prisma.aIUsage.upsert({
      where: { userId_dayBucket: { userId, dayBucket } },
      create: { userId, dayBucket, count: 1, model },
      update: { count: { increment: 1 }, model },
    });
    return { ok: true, used: 0, limit, resetsAt };
  }

  // Increment only if an existing row is still under the limit (atomic guard).
  const bumped = await prisma.aIUsage.updateMany({
    where: { userId, dayBucket, count: { lt: limit } },
    data: { count: { increment: 1 }, model },
  });
  if (bumped.count === 1) {
    return { ok: true, used: limit, limit, resetsAt };
  }

  // No row matched: either none exists yet (first call) or it is at/over limit.
  try {
    await prisma.aIUsage.create({
      data: { userId, dayBucket, count: 1, model },
    });
    return { ok: true, used: 1, limit, resetsAt };
  } catch (e) {
    if (isUniqueViolation(e)) {
      const usage = await prisma.aIUsage.findUnique({
        where: { userId_dayBucket: { userId, dayBucket } },
      });
      return { ok: false, used: usage?.count ?? limit, limit, resetsAt };
    }
    throw e;
  }
}

/**
 * Refund one reserved unit (provider call failed before delivering value, or
 * the stream errored). Floored at zero so a double-refund cannot go negative.
 */
export async function releaseQuota(userId: string): Promise<void> {
  const dayBucket = todayBucket();
  await prisma.aIUsage.updateMany({
    where: { userId, dayBucket, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}

/**
 * Say once, out loud, which provider this process will actually use.
 *
 * The Ollama branch below is a free local fallback for developers. It is also
 * how in-editor AI stayed broken in production for months without anyone
 * noticing: on a dev machine every request short-circuited to a local model, so
 * the paid path — the only one production has — was never exercised. Silence was
 * the bug. A dev now sees, on the first AI call, that they are NOT testing what
 * production runs.
 */
let announced = false;
function announceProvider(model: string): void {
  if (announced) return;
  announced = true;
  if (model === "ollama") {
    console.warn(
      `[ai] OLLAMA_BASE_URL is set — every AI request in this process uses the local ` +
        `model (${process.env.OLLAMA_MODEL ?? "unset"}), NOT the paid provider production runs. ` +
        `Unset it to exercise the real path.`,
    );
  } else {
    console.log(`[ai] provider: openai (model: ${model})`);
  }
}

/**
 * Server-authoritative model selection. The client-sent model is a hint:
 * honoured only if it is in the user's tier allow-list, otherwise the tier
 * default is used. Prevents a lower tier from forcing a premium model.
 */
export async function resolveModelForUser(
  userId: string,
  hint?: string,
): Promise<string> {
  // Local Ollama mode: when configured, force the local model regardless of
  // tier or client hint so no paid API key is used. Quota still applies.
  if ((process.env.OLLAMA_BASE_URL ?? "").length > 0) {
    announceProvider("ollama");
    return "ollama";
  }
  const plan = await getUserPlan(userId);
  const cfg = PLAN_MODELS[plan];
  const model = hint && cfg.allowed.includes(hint) ? hint : cfg.default;
  announceProvider(model);
  return model;
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

