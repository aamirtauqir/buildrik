/**
 * GET /api/integrations/vercel/authorize?workspaceId=ws_xxx
 *
 * Owner/Admin entry point for Vercel OAuth. Returns 302 redirect to
 * vercel.com/integrations/<slug>/new?state=<HMAC-signed-state>.
 *
 * Flow A step 2 of Vercel OAuth spec
 * (docs/superpowers/specs/2026-05-19-vercel-oauth-integration-design.md).
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";
import { buildAuthUrl } from "@/server/services/vercel-oauth.service";

export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "MISSING_WORKSPACE_ID" }, { status: 400 });
  }

  try {
    await checkWorkspaceRole(prisma, session.user.id, workspaceId, "ADMIN");
  } catch (err) {
    if (err instanceof PermissionError) {
      return NextResponse.json({ error: err.code }, { status: err.code === "NOT_FOUND" ? 404 : 403 });
    }
    throw err;
  }

  const redirectTo = buildAuthUrl(workspaceId, session.user.id);
  return NextResponse.redirect(redirectTo, 302);
}
