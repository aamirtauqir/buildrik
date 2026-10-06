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
import { TokenMigrationError, isSafeCssVarName } from "@buildrik/shared/tokens";
import type { DesignToken } from "./types";
import { DEFAULT_TOKENS } from "./defaultTokens";
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "./tokenMigrations";

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

/** A saved token that replaces a seed token by id keeps the seed's own name; the name it was saved under
 *  follows as a legacy alias, so both resolve to the saved value (v5 fed a seed's var by id). */
function adoptSeedName(saved: DesignToken, seed: DesignToken): DesignToken {
  if (saved.cssVar === seed.cssVar) return saved;
  const legacyNames = [...new Set([...(saved.legacyNames ?? []), saved.cssVar])];
  return { ...saved, cssVar: seed.cssVar, legacyNames };
}

type Merged = { ok: true; tokens: DesignToken[] } | { ok: false; reason: string };

function tryMerge(incoming: readonly unknown[], storedVersion: number): Merged {
  let migrated: unknown;
  try {
    migrated =
      storedVersion < CURRENT_SCHEMA_VERSION
        ? migrateDesignTokens(incoming, storedVersion, CURRENT_SCHEMA_VERSION)
        : incoming;
  } catch (e) {
    return { ok: false, reason: e instanceof TokenMigrationError ? e.reason : String(e) };
  }
  const checked = validateTokens(migrated);
  if (!checked.ok) return { ok: false, reason: checked.reason };
  const savedById = new Map(checked.tokens.map((t) => [t.id, t]));
  const seeded = DEFAULT_TOKENS.map((def) => {
    const saved = savedById.get(def.id);
    return saved ? adoptSeedName(saved, def) : def;
  });
  const added = checked.tokens.filter((t) => !DEFAULT_TOKENS.some((def) => def.id === t.id));
  return { ok: true, tokens: [...seeded, ...added] };
}

/**
 * The site's saved tokens over the seed (v6). A saved token replaces its seed
 * wholesale, modes included; tokens the site added follow the seed. Saves
 * written by an older schema are migrated first. Never throws: input that
 * cannot migrate or validate yields the seed, so the editor still opens.
 * This is the strict merge — Brand and every write path use it.
 */
export function mergeProjectTokens(
  incoming: readonly unknown[],
  storedVersion?: number
): DesignToken[] {
  const rows = Array.isArray(incoming) ? incoming : [];
  const merged = tryMerge(rows, storedVersion ?? inferStoredVersion(rows));
  return merged.ok ? merged.tokens : fallBackToSeed(merged.reason);
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** The light literal a saved row carries: v5 `value`, or v6 `modes.light.value`. */
function lightLiteral(row: Record<string, unknown>): string | null {
  if (typeof row.value === "string") return row.value;
  const light = isRecord(row.modes) && isRecord(row.modes.light) ? row.modes.light : null;
  return light && typeof light.value === "string" ? light.value : null;
}

/** Saved rows laid over the seed as plain literals, validated by nothing but their shape (the emitter cleans values). */
function overlayUnvalidated(rows: readonly unknown[]): DesignToken[] {
  const out = [...DEFAULT_TOKENS];
  for (const row of rows) {
    if (!isRecord(row) || typeof row.id !== "string" || typeof row.cssVar !== "string") continue;
    const value = lightLiteral(row);
    if (value === null || !isSafeCssVarName(row.cssVar)) continue;
    const at = out.findIndex((t) => t.id === row.id);
    if (at >= 0) {
      out[at] = adoptSeedName({ ...out[at], cssVar: row.cssVar, modes: { light: { value } } }, out[at]);
    } else {
      out.push({
        id: row.id, name: row.id, kind: "color", layer: "primitive", category: "colors", type: "string",
        cssVar: row.cssVar, modes: { light: { value } },
      });
    }
  }
  return out;
}

/**
 * The token list the canvas and every export write (one source: canvas = export).
 * The strict merge when the saved list is valid. Otherwise the saved rows are
 * laid over the seed as unvalidated literals: a site opens with its OLD brand
 * and one odd row never reverts the rest to the default (D17).
 */
export function tokensForEmit(
  settings: { designTokens?: unknown; designTokensSchemaVersion?: number } | undefined
): DesignToken[] {
  const rows = Array.isArray(settings?.designTokens) ? settings.designTokens : [];
  const merged = tryMerge(rows, settings?.designTokensSchemaVersion ?? inferStoredVersion(rows));
  return merged.ok ? merged.tokens : overlayUnvalidated(rows);
}
