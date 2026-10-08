/**
 * A restore point's tokens as the site gets them back (spec §8: restore runs
 * in the editor, as one transaction). An older point (theme-push and migration
 * rows hold v5) is migrated first; the set is laid over the seed like every
 * saved set; and a site-only token the point does not have but elements still
 * use is KEPT (1b keepInUseSiteTokens) — otherwise the removal guard in
 * setTokens would refuse the whole restore.
 */
import { validateTokens, TOKENS_SCHEMA_VERSION, type DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { keepInUseSiteTokens, migrateTokensToV6, type TokenUsageCount } from "@buildrik/shared/tokens";
import { migrateDesignTokens } from "./tokenMigrations";
import { mergeProjectTokens } from "./projectTokens";

export function restoredTokens(
  point: { designTokens: unknown[]; tokensSchemaVersion: number },
  current: readonly DesignToken[],
  usage: { count(id: string): TokenUsageCount },
): { ok: true; tokens: DesignToken[] } | { ok: false; reason: string } {
  let rows: unknown = point.designTokens;
  try {
    if (point.tokensSchemaVersion < TOKENS_SCHEMA_VERSION && point.designTokens.length > 0) {
      const v5 = point.tokensSchemaVersion < 5 ? migrateDesignTokens(point.designTokens, point.tokensSchemaVersion, 5) : point.designTokens;
      rows = migrateTokensToV6(v5);
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
  const checked = validateTokens(rows);
  if (!checked.ok) return { ok: false, reason: checked.reason };
  const theme = mergeProjectTokens(checked.tokens, TOKENS_SCHEMA_VERSION);
  return { ok: true, tokens: keepInUseSiteTokens(theme, current, usage).tokens };
}
