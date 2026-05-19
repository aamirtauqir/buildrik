/**
 * Vercel OAuth state machine.
 *
 * - buildAuthUrl + buildStateToken: kick off the OAuth flow with a
 *   CSRF-safe state token (HMAC-signed payload of {workspaceId, userId,
 *   nonce, exp}).
 * - verifyState: validate the state token returned by Vercel callback.
 * - exchangeCodeForToken: trade the auth code for an access token via
 *   Vercel /v2/oauth/access_token.
 * - listTeams: fetch the user's Vercel teams when the OAuth response
 *   didn't include a team_id (rare with Integration install; common with
 *   raw OAuth).
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 min
const VERCEL_API_BASE = "https://api.vercel.com";

interface StatePayload {
  workspaceId: string;
  userId: string;
  nonce: string;
  exp: number;
}

function getHmacKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY env var is not set");
  return Buffer.from(hex, "hex");
}

function hmacSign(body: string): string {
  return createHmac("sha256", getHmacKey()).update(body).digest("hex");
}

export function buildStateToken(workspaceId: string, userId: string): string {
  const payload: StatePayload = {
    workspaceId,
    userId,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + STATE_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmacSign(body)}`;
}

export function verifyState(token: string): { workspaceId: string; userId: string } | null {
  const dotIdx = token.indexOf(".");
  if (dotIdx < 0) return null;
  const body = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = hmacSign(body);
  if (sig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) return null;

  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  return { workspaceId: payload.workspaceId, userId: payload.userId };
}

export function buildAuthUrl(workspaceId: string, userId: string, appUrl: string): string {
  const integrationId = process.env.VERCEL_INTEGRATION_ID;
  if (!integrationId) throw new Error("VERCEL_INTEGRATION_ID env var is not set");
  const state = buildStateToken(workspaceId, userId);
  // Vercel integration install URL format
  const params = new URLSearchParams({ state });
  return `https://vercel.com/integrations/${integrationId}/new?${params}`;
}

export interface ExchangedToken {
  accessToken: string;
  vercelUserId: string;
  teamId: string | null;
  configurationId: string | null;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<ExchangedToken> {
  const clientId = process.env.VERCEL_CLIENT_ID;
  const clientSecret = process.env.VERCEL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("VERCEL_CLIENT_ID / VERCEL_CLIENT_SECRET env vars not set");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${VERCEL_API_BASE}/v2/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Vercel /access_token failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    token_type: string;
    user_id: string;
    team_id?: string | null;
    installation_id?: string | null;
  };

  return {
    accessToken: data.access_token,
    vercelUserId: data.user_id,
    teamId: data.team_id ?? null,
    configurationId: data.installation_id ?? null,
  };
}

export interface VercelTeam {
  id: string;
  name: string;
  slug: string;
}

export async function listTeams(accessToken: string): Promise<VercelTeam[]> {
  const res = await fetch(`${VERCEL_API_BASE}/v2/teams`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    // Non-fatal — caller proceeds with empty team list (personal account only)
    return [];
  }
  const data = (await res.json()) as { teams: VercelTeam[] };
  return data.teams ?? [];
}
