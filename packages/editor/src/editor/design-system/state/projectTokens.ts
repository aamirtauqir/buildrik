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
import type { DesignToken } from "../types";
import { DEFAULT_TOKENS } from "../constants";
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "../migrations";

/**
 * The site's saved tokens over the seed (v6). A saved token replaces its seed
 * wholesale, modes included; tokens the site added follow the seed. Saves
 * written by an older schema are migrated first.
 */
export function mergeProjectTokens(
  incoming: readonly unknown[],
  storedVersion = CURRENT_SCHEMA_VERSION
): DesignToken[] {
  const checked = validateTokens(
    storedVersion < CURRENT_SCHEMA_VERSION
      ? migrateDesignTokens(incoming, storedVersion, CURRENT_SCHEMA_VERSION)
      : incoming
  );
  if (!checked.ok) throw new Error(`[ds] saved tokens are not valid v6: ${checked.reason}`);
  const saved = checked.tokens;
  const savedById = new Map(saved.map((t) => [t.id, t]));
  const seeded = DEFAULT_TOKENS.map((def) => savedById.get(def.id) ?? def);
  const added = saved.filter((t) => !DEFAULT_TOKENS.some((def) => def.id === t.id));
  return [...seeded, ...added];
}
