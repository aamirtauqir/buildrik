/**
 * Scheduled-publish sweep — E2 (docs/design-jobs/BLOCKERS.md), taken 2026-09-08.
 *
 * Fires schedules whose time has come by handing off to `startPublish`, which
 * already owns pre-publish checks, the approval gate, the single-active-job
 * rule and worker dispatch. Nothing about publishing is re-implemented here: a
 * scheduled publish must obey exactly the rules the button obeys, or the two
 * paths drift and the weaker one ships.
 */
import { type NextRequest } from "next/server";
import { startPublish } from "@server/services/publish.service";
import {
  dueSchedules,
  markScheduleFailed,
  markScheduleStarted,
} from "@server/services/scheduled-publish.service";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const due = await dueSchedules(new Date());
  let started = 0;
  let failed = 0;

  for (const s of due) {
    try {
      /* No `pages` argument: the schedule stores WHEN, never a frozen copy of
         the site. A publish scheduled on Monday should ship Friday's content —
         storing pages at schedule time would quietly publish a stale snapshot,
         which is the opposite of what someone scheduling a release wants. */
      const job = await startPublish(s.siteId, s.workspaceId, s.createdBy);
      await markScheduleStarted(s.id, (job as { id: string }).id);
      started += 1;
    } catch (e) {
      /* One bad schedule must not strand the rest of the sweep. The failure is
         RECORDED on the row rather than only logged, so the panel can say what
         happened instead of the schedule appearing to have silently vanished. */
      const message = e instanceof Error ? e.message : "Scheduled publish failed";
      await markScheduleFailed(s.id, message);
      failed += 1;
      console.error(`[scheduled-publish] schedule=${s.id} site=${s.siteId} failed: ${message}`);
    }
  }

  console.log(`[scheduled-publish] due=${due.length} started=${started} failed=${failed}`);
  return Response.json({ due: due.length, started, failed });
}
