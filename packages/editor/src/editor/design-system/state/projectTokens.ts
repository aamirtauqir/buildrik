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
  const seeded = DEFAULT_TOKENS.map((def) => {
    const hit = saved.find((t) => (t.id ? t.id === def.id : t.name === def.name));
    /* The dark variant rides along. Only `value` was copied, so a dark value
       saved through Brand's Apply reached projectSettings and was dropped
       here on the next load — measured live 2026-09-24: #76A9FA saved, "—"
       after reload. A saved row without one keeps the seed's. */
    if (!hit) return def;
    return hit.darkValue ? { ...def, value: hit.value, darkValue: hit.darkValue } : { ...def, value: hit.value };
  });
  /* Tokens the site ADDED (Brand's "+ Add token") are not in the seed, and
     mapping over the seed dropped them: measured live 2026-09-24, a token
     added, saved and reloaded was gone. They follow the seed, as saved. */
  const added = saved.filter((t) => t.id && !DEFAULT_TOKENS.some((def) => def.id === t.id));
  return [...seeded, ...added];
}
