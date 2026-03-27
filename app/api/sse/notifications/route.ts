import { type NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      // Send initial unread count immediately
      let lastCount: number;
      try {
        lastCount = await prisma.notification.count({
          where: { userId, isRead: false },
        });
        send("unread", { count: lastCount });
      } catch {
        controller.close();
        return;
      }

      // Poll every 5 seconds for changes
      const interval = setInterval(async () => {
        try {
          const count = await prisma.notification.count({
            where: { userId, isRead: false },
          });
          if (count !== lastCount) {
            lastCount = count;
            send("unread", { count });
          }
          // Heartbeat to keep connection alive
          send("heartbeat", { ts: Date.now() });
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 5000);

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
