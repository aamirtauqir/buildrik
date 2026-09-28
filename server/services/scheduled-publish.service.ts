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

export class ScheduledPublishError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ScheduledPublishError";
  }
}

/**
 * A-16 / PD-18: when a schedule comes due, `dueSchedules` → `startPublish` →
 * the worker, which refuses any job with no page-HTML payload — only the
 * EDITOR renders one, and nothing captures a page snapshot at schedule time.
 * A schedule created today is GUARANTEED to fail later, silently (there is
 * no UI caller to warn anyone at creation time or at failure time). Refuse
 * it here instead of letting a promise get made that cannot be kept. Safe:
 * `schedulePublish` has no production caller today (confirmed absent from
 * `packages/`). The full validation + create implementation this replaced
 * (lead-time bounds, the partial-unique-index ALREADY_SCHEDULED race) is in
 * git history — restore it in the same commit that ships a server-side
 * renderer.
 */
export async function schedulePublish(input: {
  siteId: string;
  workspaceId: string;
  userId: string;
  scheduledFor: Date;
}): Promise<never> {
  // SA-04 (D6): same refusal as startPublish — nothing new goes live in a
  // workspace scheduled for deletion.
  const site = await prisma.site.findUnique({
    where: { id: input.siteId },
    select: { workspace: { select: { deletionScheduledAt: true } } },
  });
  if (site?.workspace.deletionScheduledAt) throw new Error("WORKSPACE_DELETION_SCHEDULED");
  throw new ScheduledPublishError(
    "NO_RENDERER",
    "Scheduled publish isn't available yet — publish from the editor instead.",
  );
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

/** SA-04 (D6): the sweep skipped it — its workspace is scheduled for deletion. */
export async function markScheduleCancelled(id: string, reason: string) {
  return prisma.scheduledPublish.update({
    where: { id },
    data: { status: "CANCELLED", error: reason },
  });
}
