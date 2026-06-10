import { type NextRequest } from "next/server";
import { auth } from "@server/auth";
import { prisma } from "@lib/prisma";
import { checkSiteRole } from "@server/services/permission.service";
import { getCollabOpsSince, latestCollabSeq } from "@server/services/collab.service";

export const dynamic = "force-dynamic";

// SSE stream of collaboration ops for a site. Replays ops with seq greater than
// the `since` query param, then polls for new ops. Serverless-friendly DB
// fan-out (the WebSocket-free transport). Editors only.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { siteId } = await params;
  try {
    await checkSiteRole(prisma, session.user.id, siteId, "EDITOR");
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const sinceParam = Number(req.nextUrl.searchParams.get("since"));
  let lastSeq = Number.isFinite(sinceParam) && sinceParam >= 0 ? sinceParam : 0;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      // Tell the client the current head so it can detect gaps.
      try {
        send("hello", { seq: await latestCollabSeq(siteId) });
      } catch {
        controller.close();
        return;
      }

      let closed = false;
      const poll = async () => {
        if (closed) return;
        try {
          const ops = await getCollabOpsSince(siteId, lastSeq);
          for (const o of ops) {
            lastSeq = o.seq;
            send("op", { seq: o.seq, clientId: o.clientId, authorId: o.authorId, op: o.op });
          }
        } catch {
          // transient DB error — keep polling
        }
      };

      await poll();
      const interval = setInterval(poll, 1500);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
