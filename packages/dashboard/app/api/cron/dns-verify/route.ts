import { type NextRequest } from "next/server";
import { checkCronAuth } from "@/lib/cron-auth";
import { verifyPendingDomains } from "@server/services/domain.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Every 5 minutes (vercel.json). The checking itself is domain.service's
   `checkDomainDns`, the same code "Check DNS" runs — one source of truth. */
export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const { checked, verified } = await verifyPendingDomains();
  return Response.json({ ok: true, checked, verified });
}
