import { validateTokens, TOKENS_SCHEMA_VERSION, DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import { migrateTokensToV6, TokenMigrationError } from "@buildrik/shared/tokens";

export class TokenSaveError extends Error {
  constructor(public code: "TOKENS_INVALID" | "TOKENS_STALE_CLIENT" | "TOKENS_NEED_CAS", message: string) {
    super(message);
    this.name = "TokenSaveError";
  }
}

/**
 * Kill switch (D14, eng E3). Off = no NEW migrations; migrated sites keep
 * working. `BRAND_TOKENS_V2=on` enables every workspace;
 * `BRAND_TOKENS_V2_WORKSPACES` (comma-separated ids) enables only those — the
 * "QA workspace first" rollout step.
 */
export function isBrandTokensV2Enabled(workspaceId?: string): boolean {
  if (process.env.BRAND_TOKENS_V2 === "on") return true;
  if (!workspaceId) return false;
  return (process.env.BRAND_TOKENS_V2_WORKSPACES ?? "").split(",").some((id) => id.trim() === workspaceId);
}

const isKnownVersion = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= TOKENS_SCHEMA_VERSION;

/**
 * Missing = 1. A stored value outside 1..current (written before the payload
 * check existed) counts as current, so it cannot mark every client stale; the
 * next validated save overwrites it with the current version.
 */
const storedVersionOf = (s: unknown): number => {
  if (!s || typeof s !== "object") return 1;
  const v = (s as { designTokensSchemaVersion?: unknown }).designTokensSchemaVersion;
  if (v === undefined) return 1;
  return isKnownVersion(v) ? v : TOKENS_SCHEMA_VERSION;
};

/**
 * Missing = 1; anything else must be an integer 1..current or the save is
 * TOKENS_INVALID. The stored version is then always the server's: current for
 * a validated set, the payload's own (≤ current - 1) only when it is kept unchanged.
 */
function payloadVersionOf(p: { designTokensSchemaVersion?: unknown }): number {
  const v = p.designTokensSchemaVersion;
  if (v === undefined) return 1;
  if (!isKnownVersion(v)) {
    throw new TokenSaveError("TOKENS_INVALID", `designTokensSchemaVersion must be an integer from 1 to ${TOKENS_SCHEMA_VERSION}`);
  }
  return v;
}

const hasStoredTokens = (s: unknown): boolean => {
  const rows = s && typeof s === "object" ? (s as { designTokens?: unknown }).designTokens : undefined;
  return Array.isArray(rows) && rows.length > 0;
};

/**
 * `no-tokens`: the payload carries no token list (`designTokens` absent,
 * undefined — superjson keeps an undefined key, which is what ⌘Z of a site's
 * first token edit sends — or not an array); the stored token state is kept.
 * `unchanged`: store the payload's tokens and version as sent (pre-v6 only).
 * `same-version` / `first-migrated`: store `tokens` with the current schema
 * version — the server sets it, never the payload.
 */
export type TokenCheck =
  | { kind: "no-tokens" }
  | { kind: "unchanged" }
  | { kind: "same-version"; tokens: unknown[] }
  | { kind: "first-migrated"; tokens: unknown[]; storedTokens: unknown; storedVersion: number };

/**
 * The save boundary's token rule. A payload older than the store is a stale
 * tab. A pre-v6 payload stays as it is unless it is exactly v5, the switch is
 * on and the site is not held — the editor runs the v1→v5 chain itself, and a
 * v5 set that cannot migrate belongs to a site the editor shows read-only,
 * whose save must still land. A v6 payload must validate; a held site
 * (brand rolled back) cannot take its first v6 save. A v6 payload over a
 * store with no tokens replaces nothing, so it is an ordinary save whatever
 * the switch says. `workspaceId` selects the switch for that workspace.
 */
export function checkTokenPayload(
  payload: unknown,
  stored: unknown,
  opts: { hold?: boolean; workspaceId?: string } = {},
): TokenCheck {
  if (!payload || typeof payload !== "object") return { kind: "no-tokens" };
  const p = payload as { designTokens?: unknown; designTokensSchemaVersion?: unknown; darkMode?: unknown };
  if (!Array.isArray(p.designTokens)) return { kind: "no-tokens" };
  const switchOn = isBrandTokensV2Enabled(opts.workspaceId);
  const pv = payloadVersionOf(p);
  const sv = storedVersionOf(stored);
  if (pv < sv) throw new TokenSaveError("TOKENS_STALE_CLIENT", "This tab has an older brand format — reload to continue.");
  if (p.darkMode !== undefined && !DarkModeSchema.safeParse(p.darkMode).success) {
    throw new TokenSaveError("TOKENS_INVALID", "darkMode must be auto or off");
  }
  let tokens: unknown = p.designTokens;
  if (pv < TOKENS_SCHEMA_VERSION) {
    if (pv !== 5 || opts.hold || !switchOn) return { kind: "unchanged" };
    try {
      tokens = migrateTokensToV6(tokens);
    } catch (e) {
      if (e instanceof TokenMigrationError) return { kind: "unchanged" };
      throw e;
    }
  }
  const checked = validateTokens(tokens);
  if (!checked.ok) throw new TokenSaveError("TOKENS_INVALID", checked.reason);
  if (sv >= TOKENS_SCHEMA_VERSION || (pv === TOKENS_SCHEMA_VERSION && !hasStoredTokens(stored))) {
    return { kind: "same-version", tokens: checked.tokens };
  }
  if (opts.hold) throw new TokenSaveError("TOKENS_STALE_CLIENT", "This site's brand was rolled back — reload to continue.");
  if (!switchOn) throw new TokenSaveError("TOKENS_STALE_CLIENT", "Brand upgrade is paused — reload to continue.");
  const storedTokens = stored && typeof stored === "object" ? (stored as { designTokens?: unknown }).designTokens : undefined;
  return { kind: "first-migrated", tokens: checked.tokens, storedTokens, storedVersion: sv };
}
