import { validateTokens, TOKENS_SCHEMA_VERSION, DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import { migrateTokensToV6, TokenMigrationError } from "@buildrik/shared/tokens";

export class TokenSaveError extends Error {
  constructor(public code: "TOKENS_INVALID" | "TOKENS_STALE_CLIENT" | "TOKENS_NEED_CAS", message: string) {
    super(message);
    this.name = "TokenSaveError";
  }
}

/** Kill switch (D14, eng E3). Off = no NEW migrations; migrated sites keep working. */
export function isBrandTokensV2Enabled(): boolean {
  return process.env.BRAND_TOKENS_V2 === "on";
}

const storedVersionOf = (s: unknown): number => {
  if (!s || typeof s !== "object") return 1;
  const v = (s as { designTokensSchemaVersion?: unknown }).designTokensSchemaVersion;
  return typeof v === "number" ? v : 1;
};

/** The payload's version is client-controlled: only an integer 1..current is believed (a stored 999 would lock every client out). */
function payloadVersionOf(p: { designTokensSchemaVersion?: unknown }): number {
  const v = p.designTokensSchemaVersion;
  if (v === undefined) return 1;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > TOKENS_SCHEMA_VERSION) {
    throw new TokenSaveError("TOKENS_INVALID", `designTokensSchemaVersion must be an integer from 1 to ${TOKENS_SCHEMA_VERSION}`);
  }
  return v;
}

/**
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
 * (brand rolled back) cannot take its first v6 save.
 */
export function checkTokenPayload(payload: unknown, stored: unknown, opts: { hold?: boolean } = {}): TokenCheck {
  if (!payload || typeof payload !== "object" || !("designTokens" in payload)) return { kind: "no-tokens" };
  const p = payload as { designTokens: unknown; designTokensSchemaVersion?: unknown; darkMode?: unknown };
  const pv = payloadVersionOf(p);
  const sv = storedVersionOf(stored);
  if (pv < sv) throw new TokenSaveError("TOKENS_STALE_CLIENT", "This tab has an older brand format — reload to continue.");
  if (p.darkMode !== undefined && !DarkModeSchema.safeParse(p.darkMode).success) {
    throw new TokenSaveError("TOKENS_INVALID", "darkMode must be auto or off");
  }
  let tokens: unknown = p.designTokens;
  if (pv < TOKENS_SCHEMA_VERSION) {
    if (pv !== 5 || opts.hold || !isBrandTokensV2Enabled()) return { kind: "unchanged" };
    try {
      tokens = migrateTokensToV6(tokens);
    } catch (e) {
      if (e instanceof TokenMigrationError) return { kind: "unchanged" };
      throw e;
    }
  }
  const checked = validateTokens(tokens);
  if (!checked.ok) throw new TokenSaveError("TOKENS_INVALID", checked.reason);
  if (sv >= TOKENS_SCHEMA_VERSION) return { kind: "same-version", tokens: checked.tokens };
  if (opts.hold) throw new TokenSaveError("TOKENS_STALE_CLIENT", "This site's brand was rolled back — reload to continue.");
  const storedTokens = stored && typeof stored === "object" ? (stored as { designTokens?: unknown }).designTokens : undefined;
  return { kind: "first-migrated", tokens: checked.tokens, storedTokens, storedVersion: sv };
}
