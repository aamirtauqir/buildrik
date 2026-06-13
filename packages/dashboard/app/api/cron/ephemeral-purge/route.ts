import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Retention for short-lived tables that otherwise grow unbounded (neither has
// a Site FK, so cascade-on-delete can't reclaim them):
//   - action_confirmations: single-use privileged-action grants. Once expired
//     or consumed they're dead; keep 1 day for audit, then purge.
//   - collab_operations: SSE fan-out op log (collab is demo-only). Applied ops
//     older than 7 days are safe to drop.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = Date.now();
  const confirmationCutoff = new Date(now - 24 * 60 * 60 * 1000);
  const collabCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [confirmations, collab] = await Promise.all([
    prisma.actionConfirmation.deleteMany({
      where: { expiresAt: { lt: confirmationCutoff } },
    }),
    prisma.collabOperation.deleteMany({
      where: { createdAt: { lt: collabCutoff } },
    }),
  ]);

  return Response.json({
    ok: true,
    actionConfirmations: confirmations.count,
    collabOperations: collab.count,
  });
}
