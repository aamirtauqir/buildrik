import { createHmac, createHash, timingSafeEqual } from "crypto";

/**
 * Server-signed confirmation tokens for privileged AI actions (platform phase 3).
 *
 * A `propose` step issues a token binding `actorId + siteId + actionId +
 * sha256(args) + expiry`, signed with NEXTAUTH_SECRET (HMAC-SHA256). The
 * `confirm` step re-derives the signature and checks the claims, so a token for
 * one action/site/user can never be replayed for another. The token is NOT a
 * role grant — execute still re-checks the caller's role via the domain path.
 *
 * Stateless by design (no DB row): the HMAC + short TTL is the guarantee.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes — long enough to read the confirm gate

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is required to sign action tokens");
  return s;
}

function hashArgs(args: unknown): string {
  return createHash("sha256").update(JSON.stringify(args ?? {})).digest("hex");
}

export interface ActionClaims {
  actorId: string;
  siteId: string;
  actionId: string;
  argsHash: string;
  exp: number;
}

export function signActionToken(input: {
  actorId: string;
  siteId: string;
  actionId: string;
  args: unknown;
}): string {
  const claims: ActionClaims = {
    actorId: input.actorId,
    siteId: input.siteId,
    actionId: input.actionId,
    argsHash: hashArgs(input.args),
    exp: Date.now() + TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export type VerifyResult =
  | { ok: true; claims: ActionClaims }
  | { ok: false; reason: string };

/**
 * Verify a token against the CURRENT session actor. Returns the signed claims
 * (siteId/actionId/argsHash) so the caller dispatches from trusted data, not
 * from client-supplied fields. The execute payload is supplied separately.
 */
export function verifyActionToken(token: string, sessionActorId: string): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [payload, sig] = parts;

  const expectedSig = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad-signature" };
  }

  let claims: ActionClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof claims.exp !== "number" || Date.now() > claims.exp) {
    return { ok: false, reason: "expired" };
  }
  if (claims.actorId !== sessionActorId) {
    return { ok: false, reason: "actor-mismatch" };
  }
  return { ok: true, claims };
}

/** Re-check that an execute-time args payload matches the proposed args hash. */
export function argsMatch(claims: ActionClaims, args: unknown): boolean {
  return claims.argsHash === hashArgs(args);
}
