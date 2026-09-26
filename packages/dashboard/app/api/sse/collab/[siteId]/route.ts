import { type NextRequest } from "next/server";
import { auth } from "@server/auth";
import { prisma } from "@lib/prisma";
import { PermissionError, checkSiteRole } from "@server/services/permission.service";
import {
  getCollabOpsSince,
  latestCollabSeq,
  hasResyncGap,
  isCollabEnabled,
} from "@server/services/collab.service";

export const dynamic = "force-dynamic";

const POLL_MS = 1500;
// Access is re-checked on a live stream, not only at connect: a removed or
// demoted member kept receiving every op, full-project snapshots included,
// until the connection happened to drop (A16-11). 10 polls = 15 s.
const ROLE_CHECK_EVERY_POLLS = 10;
// Without a cap, a stream whose abort never arrives (proxy dependent) polls
// the DB forever (A16-10). EventSource reconnects on its own after a close.
const MAX_LIFETIME_MS = 30 * 60 * 1000;
// A comment line proxies see as traffic, so an idle stream is not cut.
const HEARTBEAT_EVERY_POLLS = 10;

// SSE stream of collaboration ops for a site. Replays ops with seq greater than
// the `since` query param, then polls for new ops. Serverless-friendly DB
// fan-out (the WebSocket-free transport). Editors only.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  if (!isCollabEnabled()) return new Response(null, { status: 404 });

  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const { siteId } = await params;
  try {
    await checkSiteRole(prisma, userId, siteId, "EDITOR");
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const sinceParam = Number(req.nextUrl.searchParams.get("since"));
  let lastSeq = Number.isFinite(sinceParam) && sinceParam >= 0 ? sinceParam : 0;

  const encoder = new TextEncoder();
  let stop = () => {};
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let interval: ReturnType<typeof setInterval> | undefined;
      stop = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed by the runtime
        }
      };
      const write = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          stop(); // the client is gone; stop polling for it
        }
      };
      const send = (event: string, data: unknown) =>
        write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

      // Tell the client the current head so it can detect gaps.
      try {
        send("hello", { seq: await latestCollabSeq(siteId) });
        // A returning client whose last-seen op was pruned must full-reload, not
        // replay a partial gap (which would silently corrupt its state). Signal
        // resync and stop — the client reconnects with since=0 after reloading.
        if (await hasResyncGap(siteId, lastSeq)) {
          send("resync", { reason: "ops-pruned" });
          stop();
          return;
        }
      } catch {
        stop();
        return;
      }

      const startedAt = Date.now();
      let polls = 0;
      const poll = async () => {
        if (closed) return;
        polls++;
        if (Date.now() - startedAt > MAX_LIFETIME_MS) {
          stop();
          return;
        }
        if (polls % ROLE_CHECK_EVERY_POLLS === 0) {
          try {
            await checkSiteRole(prisma, userId, siteId, "EDITOR");
          } catch (err) {
            // A transient DB error is not a revocation — check again next time.
            if (err instanceof PermissionError) {
              send("revoked", { reason: "access-revoked" });
              stop();
              return;
            }
          }
        }
        if (polls % HEARTBEAT_EVERY_POLLS === 0) write(": keep-alive\n\n");
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
      interval = setInterval(poll, POLL_MS);
      req.signal.addEventListener("abort", stop);
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
