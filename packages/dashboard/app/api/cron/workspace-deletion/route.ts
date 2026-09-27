import { type NextRequest } from "next/server";
import { checkCronAuth } from "@/lib/cron-auth";
import { processDueWorkspaceDeletions } from "@/server/services/workspace-settings.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;
  return Response.json(await processDueWorkspaceDeletions(new Date()));
}
