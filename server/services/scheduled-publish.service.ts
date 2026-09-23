/**
 * Scheduled publish — E2 (docs/design-jobs/BLOCKERS.md), taken 2026-09-08.
 *
 * Confirmed absent 2026-09-03: no `scheduledFor`, `schedulePublish` or
 * `scheduled_publish` existed anywhere in `server/`, `prisma/` or the editor,
 * so four boards drew a feature with no producer of any kind.
 *
 * This owns the SCHEDULE only. When a schedule comes due the cron sweep hands
 * off to `startPublish`, which already owns pre-publish checks, the approval
 * gate, the single-active-job rule and the worker dispatch. Duplicating any of
 * that here would give scheduled publishes a second, weaker set of rules than
 * the button — which is exactly the class of split this codebase keeps paying
 * for (see the dev-fallback incidents in the root CLAUDE.md).
 *
 * @license BSD-3-Clause
 */

import { prisma } from "@lib/prisma";

/** A schedule must be in the future, and not so far out it is certainly a typo. */
const MIN_LEAD_MS = 60_000;                       // one minute
const MAX_LEAD_MS = 365 * 24 * 60 * 60 * 1000;    // one year

export class ScheduledPublishError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ScheduledPublishError";
  }
}

export async function schedulePublish(input: {
  siteId: string;
  workspaceId: string;
  userId: string;
  scheduledFor: Date;
}) {
  const lead = input.scheduledFor.getTime() - Date.now();
  if (Number.isNaN(lead)) {
    throw new ScheduledPublishError("INVALID_DATE", "That is not a valid date and time.");
  }
  if (lead < MIN_LEAD_MS) {
    throw new ScheduledPublishError(
      "TOO_SOON",
      "Pick a time at least a minute from now — anything sooner should just be published.",
    );
  }
  if (lead > MAX_LEAD_MS) {
    throw new ScheduledPublishError("TOO_FAR", "Pick a time within the next year.");
  }

  /* The partial unique index (`scheduled_publishes_site_pending_unique`) is the
     real guard: two concurrent requests can both pass a findFirst check and
     only the database can refuse the second. This read exists to turn that
     refusal into a sentence a person can act on. */
  try {
    return await prisma.scheduledPublish.create({
      data: {
        siteId: input.siteId,
        workspaceId: input.workspaceId,
        createdBy: input.userId,
        scheduledFor: input.scheduledFor,
        status: "PENDING",
      },
    });
  } catch (e) {
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      throw new ScheduledPublishError(
        "ALREADY_SCHEDULED",
        "This site already has a publish scheduled. Cancel it first to pick a new time.",
      );
    }
    throw e;
  }
}

/** Cancelling RECORDS the cancellation; it never deletes the row. */
export async function cancelScheduledPublish(siteId: string) {
  const pending = await prisma.scheduledPublish.findFirst({
    where: { siteId, status: "PENDING" },
  });
  if (!pending) {
    throw new ScheduledPublishError("NOT_SCHEDULED", "There is no scheduled publish to cancel.");
  }
  return prisma.scheduledPublish.update({
    where: { id: pending.id },
    data: { status: "CANCELLED" },
  });
}

export async function getScheduledPublish(siteId: string) {
  return prisma.scheduledPublish.findFirst({
    where: { siteId, status: "PENDING" },
    orderBy: { scheduledFor: "asc" },
  });
}

/**
 * Rows whose time has come.
 *
 * `lte: now` and not a window: a sweep that missed its slot — a deploy, an
 * outage — must still fire, late, rather than skipping the schedule entirely.
 * Late is a delay; skipped is a promise broken silently.
 */
export async function dueSchedules(now: Date, limit = 25) {
  return prisma.scheduledPublish.findMany({
    where: { status: "PENDING", scheduledFor: { lte: now } },
    orderBy: { scheduledFor: "asc" },
    take: limit,
  });
}

export async function markScheduleStarted(id: string, jobId: string) {
  return prisma.scheduledPublish.update({
    where: { id },
    data: { status: "PUBLISHED", startedAt: new Date(), jobId },
  });
}

export async function markScheduleFailed(id: string, error: string) {
  return prisma.scheduledPublish.update({
    where: { id },
    data: { status: "FAILED", startedAt: new Date(), error: error.slice(0, 500) },
  });
}
