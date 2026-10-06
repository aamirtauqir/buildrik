/**
 * The site's own tokens, as the canvas must render them.
 *
 * `projectSettings.designTokens` is where a site's brand actually lives — the
 * Brand panel writes it on Apply and the export reads it. Merging it over
 * DEFAULT_TOKENS was written inside `DesignSystemTab.loadFromComposer`, which
 * runs when the PANEL mounts, so on a machine with no local cache a site's
 * brand did not reach the canvas until someone opened Brand. Measured: a site
 * whose body font is Palatino opened rendering Inter, and turned Palatino the
 * moment the panel was clicked.
 *
 * The merge lives here so the panel and the headless applier below share one,
 * and `applyProjectTokensToRoot` puts them on the page at project load.
 *
 * @license BSD-3-Clause
 */

import { validateTokens } from "@buildrik/shared/schemas/design-tokens";
import { TokenMigrationError } from "@buildrik/shared/tokens";
import type { DesignToken } from "../types";
import { DEFAULT_TOKENS } from "../constants";
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "../migrations";

const warnedReasons = new Set<string>();

function fallBackToSeed(reason: string): DesignToken[] {
  if (!warnedReasons.has(reason)) {
    warnedReasons.add(reason);
    console.warn("[tokens] merge fell back to seed", { reason });
  }
  return DEFAULT_TOKENS;
}

/** A row in the v6 shape (it carries `modes`). Shape only — not validated. */
export function isV6TokenRow(r: unknown): r is DesignToken {
  return typeof r === "object" && r !== null && "modes" in r;
}

/** v6 iff every row is an object carrying `modes`; anything else is the v5 shape. */
function inferStoredVersion(rows: readonly unknown[]): number {
  return rows.length > 0 && rows.every(isV6TokenRow) ? CURRENT_SCHEMA_VERSION : 5;
}

/**
 * The site's saved tokens over the seed (v6). A saved token replaces its seed
 * wholesale, modes included; tokens the site added follow the seed. Saves
 * written by an older schema are migrated first. Never throws: input that
 * cannot migrate or validate yields the seed, so the editor still opens.
 */
export function mergeProjectTokens(
  incoming: readonly unknown[],
  storedVersion = inferStoredVersion(incoming)
): DesignToken[] {
  let migrated: unknown;
  try {
    migrated =
      storedVersion < CURRENT_SCHEMA_VERSION
        ? migrateDesignTokens(incoming, storedVersion, CURRENT_SCHEMA_VERSION)
        : incoming;
  } catch (e) {
    return fallBackToSeed(e instanceof TokenMigrationError ? e.reason : String(e));
  }
  const checked = validateTokens(migrated);
  if (!checked.ok) return fallBackToSeed(checked.reason);
  const savedById = new Map(checked.tokens.map((t) => [t.id, t]));
  const seeded = DEFAULT_TOKENS.map((def) => savedById.get(def.id) ?? def);
  const added = checked.tokens.filter((t) => !DEFAULT_TOKENS.some((def) => def.id === t.id));
  return [...seeded, ...added];
}
