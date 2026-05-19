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
import { checkWorkspaceRole } from "@/server/services/sites.service";
import { buildAuthUrl } from "@/server/services/vercel-oauth.service";

export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "UNAUTHENTICATED" }), { status: 401 });
  }

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) {
    return new Response(JSON.stringify({ error: "MISSING_WORKSPACE_ID" }), { status: 400 });
  }

  try {
    await checkWorkspaceRole(session.user.id, workspaceId, "ADMIN");
  } catch {
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), { status: 403 });
  }

  const redirectTo = buildAuthUrl(workspaceId, session.user.id);
  return NextResponse.redirect(redirectTo, 302);
}
