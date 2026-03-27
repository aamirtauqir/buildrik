import { type NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "CANCELLED"]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

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
      send("status", job);

      if (TERMINAL_STATUSES.has(job.status)) {
        controller.close();
        return;
      }

      // Poll every second until terminal state
      const interval = setInterval(async () => {
        try {
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
