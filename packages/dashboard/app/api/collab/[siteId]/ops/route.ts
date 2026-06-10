import { NextRequest, NextResponse } from "next/server";
import { auth } from "@server/auth";
import { prisma } from "@lib/prisma";
import { checkSiteRole } from "@server/services/permission.service";
import { appendCollabOp } from "@server/services/collab.service";

// Append a collaboration op for a site. Editors only. The op JSON is opaque to
// the server (an OT operation produced by the editor's OTEngine).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siteId } = await params;
  try {
    await checkSiteRole(prisma, session.user.id, siteId, "EDITOR");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { clientId?: string; op?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.clientId || body.op == null) {
    return NextResponse.json({ error: "clientId and op required" }, { status: 400 });
  }

  const { seq } = await appendCollabOp(siteId, session.user.id, body.clientId, body.op);
  return NextResponse.json({ seq }, { status: 201 });
}
