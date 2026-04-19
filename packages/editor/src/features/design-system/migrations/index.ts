/**
 * Buildrik DS V1 — Token migration framework.
 *
 * Handles schema version transitions for user-saved design tokens.
 * See spec §9 (DS V1 design doc).
 *
 * @license BSD-3-Clause
 */

import type { DesignToken } from "../types";

/**
 * Current schema version. Bump when renaming/splitting/removing tokens
 * in DEFAULT_TOKENS. Each bump requires a matching MIGRATIONS entry.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Per-version migration functions. Key = TARGET version.
 * V1 is baseline. Future entries: MIGRATIONS[2] = migrateV1toV2, etc.
 *
 * When adding a migration:
 *   1. Bump CURRENT_SCHEMA_VERSION
 *   2. Add MIGRATIONS[newVersion] = migratorFn here
 *   3. Add alias to generateCompatibilityShim in exportUtils.ts (2-version retention)
 */
const MIGRATIONS: Record<number, (tokens: DesignToken[]) => DesignToken[]> = {
  // V1 is baseline. No migrations yet.
};

/**
 * Apply migrations to bring tokens from fromVersion to toVersion.
 *
 * Iterates through intermediate versions so V1 → V5 applies migrations
 * [V2, V3, V4, V5] in order.
 *
 * If a migration is missing (schema bumped without migrator added),
 * logs warning and returns tokens unchanged — preferred over crash-on-load.
 *
 * @param tokens - User's saved design tokens
 * @param fromVersion - Schema version the tokens were saved with
 * @param toVersion - Target schema version (usually CURRENT_SCHEMA_VERSION)
 * @returns Migrated tokens array
 */
export function migrateDesignTokens(
  tokens: DesignToken[],
  fromVersion: number,
  toVersion: number,
): DesignToken[] {
  if (fromVersion >= toVersion) return tokens;

  let result = tokens;
  for (let v = fromVersion; v < toVersion; v++) {
    const target = v + 1;
    const migration = MIGRATIONS[target];
    if (!migration) {
      console.warn(
        `[ds] No migration from v${v} to v${target}; keeping tokens as-is. This is a bug.`,
      );
      continue;
    }
    result = migration(result);
  }
  return result;
}
