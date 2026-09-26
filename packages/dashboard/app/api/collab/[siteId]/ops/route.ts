import { NextRequest, NextResponse } from "next/server";
import { auth } from "@server/auth";
import { prisma } from "@lib/prisma";
import { checkSiteRole } from "@server/services/permission.service";
import { appendCollabOp, isCollabEnabled } from "@server/services/collab.service";
import { checkRateLimit } from "@server/services/rate-limiter";
import { MAX_COLLAB_OP_BYTES, collabOpBodySchema } from "@buildrik/shared/schemas/collab";

// Cursor moves are throttled to 50 ms client-side (useCursorSync): 20/s, 1200/min.
const OPS_PER_WINDOW = 1500;
const WINDOW_MS = 60_000;

// Append a collaboration op for a site. Editors only. The op is replayed to
// every collaborator's editor, so it is validated (envelope, size, no
// prototype keys) before it is stored — it used to be opaque (A16-6).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  if (!isCollabEnabled()) return new NextResponse(null, { status: 404 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { siteId } = await params;
  try {
    await checkSiteRole(prisma, userId, siteId, "EDITOR");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (Number(req.headers.get("content-length") ?? 0) > MAX_COLLAB_OP_BYTES) {
    return NextResponse.json({ error: "Op too large" }, { status: 413 });
  }
  let text: string;
  try {
    text = await req.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  // Content-Length can be absent (chunked) or wrong; the body itself decides.
  if (Buffer.byteLength(text) > MAX_COLLAB_OP_BYTES) {
    return NextResponse.json({ error: "Op too large" }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = collabOpBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid op", issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }

  const limit = await checkRateLimit(`collab:${userId}:${siteId}`, OPS_PER_WINDOW, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many ops" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
    );
  }

  const { seq } = await appendCollabOp(siteId, userId, parsed.data.clientId, parsed.data.op);
  return NextResponse.json({ seq }, { status: 201 });
}
