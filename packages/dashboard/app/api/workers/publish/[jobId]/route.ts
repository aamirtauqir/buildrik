import { type NextRequest } from "next/server";
import { checkWorkerAuth } from "@/lib/cron-auth";
import { runPublishJob, type PublishJobResult } from "@server/services/publish-worker.service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RESPONSES: Record<PublishJobResult, [body: string, status: number]> = {
  "not-queued": ["Job not found or not in QUEUED state", 400],
  "not-claimed": ["Job left QUEUED before it was claimed", 409],
  completed: ["OK", 200],
  cancelled: ["Cancelled", 200],
  "live-step-failed": ["Live with a failed step", 500],
  failed: ["Error", 500],
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const denied = checkWorkerAuth(req);
  if (denied) return denied;

  const { jobId } = await params;
  const [body, status] = RESPONSES[await runPublishJob(jobId)];
  return new Response(body, { status });
}
