/**
 * GET /api/integrations/vercel/callback?code=<code>&state=<state>
 *
 * Vercel's callback after user authorizes the integration. Exchanges
 * code for access token, optionally lists teams, stashes transient
 * state in an encrypted httpOnly cookie, redirects to team-picker
 * page where user confirms / picks team.
 *
 * Flow A step 4 of Vercel OAuth spec.
 */
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";
import {
  exchangeCodeForToken,
  listTeams,
  verifyState,
} from "@/server/services/vercel-oauth.service";

const PENDING_COOKIE = "buildrik_vercel_pending";
const PENDING_TTL_SECONDS = 10 * 60;

function errorRedirect(req: Request, errorCode: string): Response {
  const url = new URL(req.url);
  const dest = new URL("/dashboard/settings/integrations", `${url.protocol}//${url.host}`);
  dest.searchParams.set("error", errorCode);
  return NextResponse.redirect(dest, 302);
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "MISSING_CODE" }, { status: 400 });
  }
  if (!state) {
    return errorRedirect(req, "oauth_state_invalid");
  }

  const decoded = verifyState(state);
  if (!decoded) {
    return errorRedirect(req, "oauth_state_invalid");
  }

  const redirectUri = `${url.protocol}//${url.host}/api/integrations/vercel/callback`;

  let token;
  try {
    token = await exchangeCodeForToken(code, redirectUri);
  } catch {
    return errorRedirect(req, "oauth_denied");
  }

  let candidateTeams: Array<{ id: string; name: string; slug: string }> = [];
  if (!token.teamId) {
    candidateTeams = await listTeams(token.accessToken);
  }

  const pendingPayload = JSON.stringify({
    workspaceId: decoded.workspaceId,
    userId: decoded.userId,
    accessToken: token.accessToken,
    vercelUserId: token.vercelUserId,
    teamId: token.teamId,
    configurationId: token.configurationId,
    candidateTeams,
    exp: Date.now() + PENDING_TTL_SECONDS * 1000,
  });

  const encrypted = encrypt(pendingPayload);

  const dest = new URL(
    "/dashboard/settings/integrations/vercel-team-picker",
    `${url.protocol}//${url.host}`,
  );
  const res = NextResponse.redirect(dest, 302);
  res.cookies.set(PENDING_COOKIE, encrypted, {
    httpOnly: true,
    secure: url.protocol === "https:",
    // Lax (NOT Strict) — Strict blocks the cookie when the request chain
    // originated from vercel.com (cross-site), even though the callback →
    // team-picker hop is technically same-site. OAuth callback flows must
    // be Lax to survive the cross-origin entry point.
    sameSite: "lax",
    maxAge: PENDING_TTL_SECONDS,
    path: "/",
  });
  return res;
}
