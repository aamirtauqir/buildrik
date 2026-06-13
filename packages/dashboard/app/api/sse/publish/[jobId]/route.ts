import { type NextRequest } from "next/server";
import { auth } from "@server/auth";
import { prisma } from "@lib/prisma";

export const dynamic = "force-dynamic";

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "CANCELLED"]);

// Hard cap so a stranded job (stuck non-terminal) can't keep an SSE stream
// polling the DB once a second forever. The worker's maxDuration is 300s and
// the cleanup cron reaps stale jobs hourly; 10 min comfortably covers a real
// publish. The client can reconnect if it needs to keep watching.
const MAX_LIFETIME_MS = 10 * 60 * 1000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const { jobId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      // Send current state immediately
      let job = await prisma.publishBuildJob.findUnique({ where: { id: jobId } });
      if (!job) {
        send("error", { message: "Job not found" });
        controller.close();
        return;
      }

      // Verify the requesting user is a member of the job's workspace
      const isMember = await prisma.workspaceMember.findFirst({
        where: { workspaceId: job.workspaceId, userId },
        select: { id: true },
      });
      if (!isMember) {
        send("error", { message: "Forbidden" });
        controller.close();
        return;
      }
      send("status", job);

      if (TERMINAL_STATUSES.has(job.status)) {
        controller.close();
        return;
      }

      // Poll every second until terminal state (or the lifetime cap).
      const startedAt = Date.now();
      const interval = setInterval(async () => {
        try {
          if (Date.now() - startedAt > MAX_LIFETIME_MS) {
            send("timeout", { message: "Stream closed — reconnect to keep watching." });
            clearInterval(interval);
            controller.close();
            return;
          }
          const updated = await prisma.publishBuildJob.findUnique({ where: { id: jobId } });
          if (!updated) {
            clearInterval(interval);
            controller.close();
            return;
          }

          const changed =
            updated.status !== job!.status ||
            updated.progress !== job!.progress;

          if (changed) {
            job = updated;
            send("status", updated);
          }

          if (TERMINAL_STATUSES.has(updated.status)) {
            clearInterval(interval);
            setTimeout(() => controller.close(), 100);
          }
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
