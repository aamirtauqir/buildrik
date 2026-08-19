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

import type { DesignToken } from "../types";
import { DEFAULT_TOKENS } from "../constants";
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "../migrations";

/**
 * The site's saved tokens over the seed, migrated if they were written by an
 * older schema. Matching is by id, falling back to name for pre-id rows.
 */
export function mergeProjectTokens(
  incoming: readonly DesignToken[],
  storedVersion = CURRENT_SCHEMA_VERSION
): DesignToken[] {
  const saved =
    storedVersion < CURRENT_SCHEMA_VERSION
      ? migrateDesignTokens(incoming as DesignToken[], storedVersion, CURRENT_SCHEMA_VERSION)
      : (incoming as DesignToken[]);
  return DEFAULT_TOKENS.map((def) => {
    const hit = saved.find((t) => (t.id ? t.id === def.id : t.name === def.name));
    return hit ? { ...def, value: hit.value } : def;
  });
}
