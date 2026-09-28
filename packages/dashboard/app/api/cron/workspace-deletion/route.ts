import { type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { checkCronAuth } from "@/lib/cron-auth";
import { processDueWorkspaceDeletions } from "@/server/services/workspace-settings.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;
  const result = await processDueWorkspaceDeletions(new Date());
  // SA-04 (RT8): the cron is configured by hand on cPanel, so a non-2xx is the
  // only alarm. A publish in flight or a cancelled deletion retries on its own.
  const errors = result.skipped.filter((s) => s.kind === "error");
  for (const s of errors) {
    Sentry.captureMessage(`[workspace-deletion] kept ${s.workspaceId}: ${s.reason}`, { level: "error" });
  }
  return Response.json(result, { status: errors.length > 0 ? 500 : 200 });
}
