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

const versionOf = (s: unknown): number => {
  if (!s || typeof s !== "object") return 1;
  const v = (s as { designTokensSchemaVersion?: unknown }).designTokensSchemaVersion;
  return typeof v === "number" ? v : 1;
};

export type TokenCheck =
  | { kind: "no-tokens" }
  | { kind: "same-version"; tokens: unknown[] }
  | { kind: "first-migrated"; tokens: unknown[]; storedTokens: unknown; storedVersion: number };

/**
 * The save boundary's token rule. A payload older than the store is a stale
 * tab. A pre-v6 payload stays as it is while the switch is off, and also when
 * it cannot be migrated over a pre-v6 store: the editor shows that site
 * read-only, and refusing its save would lose the page work riding with it.
 * A v6 payload must validate.
 */
export function checkTokenPayload(payload: unknown, stored: unknown): TokenCheck {
  if (!payload || typeof payload !== "object" || !("designTokens" in payload)) return { kind: "no-tokens" };
  const p = payload as { designTokens: unknown; designTokensSchemaVersion?: unknown; darkMode?: unknown };
  const pv = versionOf(p);
  const sv = versionOf(stored);
  if (pv < sv) throw new TokenSaveError("TOKENS_STALE_CLIENT", "This tab has an older brand format — reload to continue.");
  if (p.darkMode !== undefined && !DarkModeSchema.safeParse(p.darkMode).success) {
    throw new TokenSaveError("TOKENS_INVALID", "darkMode must be auto or off");
  }
  let tokens: unknown = p.designTokens;
  if (pv < TOKENS_SCHEMA_VERSION) {
    const unchanged = { kind: "same-version", tokens: Array.isArray(tokens) ? tokens : [] } as const;
    if (!isBrandTokensV2Enabled()) return unchanged;
    try {
      tokens = migrateTokensToV6(tokens);
    } catch (e) {
      if (e instanceof TokenMigrationError) return unchanged;
      throw e;
    }
  }
  const checked = validateTokens(tokens);
  if (!checked.ok) throw new TokenSaveError("TOKENS_INVALID", checked.reason);
  const storedTokens = stored && typeof stored === "object" ? (stored as { designTokens?: unknown }).designTokens : undefined;
  return sv < TOKENS_SCHEMA_VERSION
    ? { kind: "first-migrated", tokens: checked.tokens, storedTokens, storedVersion: sv }
    : { kind: "same-version", tokens: checked.tokens };
}
