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
 *
 * v2 (2026-05-16) — B5 lock. Adds optional `semanticKind` field to DesignToken.
 *                   No-op migration: existing tokens stay as primitives
 *                   (semanticKind undefined). Future tokens may set semanticKind
 *                   to declare a semantic role.
 *
 * v3 (2026-05-16) — B1 lock. Adds optional `replacedBy` field to DesignToken
 *                   for rename alias bridge. No-op migration: existing tokens
 *                   have no rename history. Future renames write replacedBy on
 *                   the old token; sweep migration (v5 target) removes after
 *                   2-version retention window.
 *
 * v4 (2026-05-17) — B5-wire seed. Injects 4 primitive color tokens
 *                   (color-blue-500 / color-slate-50 / color-slate-700 /
 *                   color-red-500) and 4 semantic color tokens
 *                   (color-action / color-surface / color-text-primary /
 *                   color-feedback-error). Semantics use B1 aliasOf to point
 *                   at the corresponding primitive. Id-gated so user-edited
 *                   entries are never clobbered. Unblocks Beginner-mode
 *                   filtering (B5 lock) — without this seed, fresh installs
 *                   see an empty Tokens tab.
 *
 * v5 (2026-08-16) — brand-blue reconciliation. Renames `color-blue-500` to
 *                   `color-brand-500` (its old name was false: #2D6DFF is
 *                   blue-500 in no ramp) and repoints anything aliased to it.
 *                   VALUES ARE NOT TOUCHED — an existing site keeps whatever
 *                   colour it is already published with; only the id, name and
 *                   cssVar move, and `generateCompatibilityShim` keeps the old
 *                   CSS variable resolving for two versions. Fresh seeds get
 *                   #1A56DB from V4_SEEDS above, which is id-gated, so this
 *                   migration and that seed can never both fire on one token.
 */
export const CURRENT_SCHEMA_VERSION = 5;

/** The v5 rename, named once so the migration and its tests cannot drift. */
const OLD_BRAND_PRIMITIVE_ID = "color-blue-500";
const BRAND_PRIMITIVE_ID = "color-brand-500";

const V4_SEEDS: DesignToken[] = [
  // Primitives (Pro-only).
  {
    id: "color-brand-500",
    name: "Brand 500",
    value: "#1A56DB",
    category: "colors",
    cssVar: "--buildrick-design-color-brand-500",
    type: "color",
    group: "primitive",
  },
  {
    id: "color-slate-50",
    name: "Slate 50",
    value: "#F8FAFC",
    category: "colors",
    cssVar: "--buildrick-design-color-slate-50",
    type: "color",
    group: "primitive",
  },
  {
    id: "color-slate-700",
    name: "Slate 700",
    value: "#334155",
    category: "colors",
    cssVar: "--buildrick-design-color-slate-700",
    type: "color",
    group: "primitive",
  },
  {
    id: "color-red-500",
    name: "Red 500",
    value: "#EF4444",
    category: "colors",
    cssVar: "--buildrick-design-color-red-500",
    type: "color",
    group: "primitive",
  },
  // Semantics (Beginner-visible). aliasOf points at the primitives above so
  // value resolution flows primitive→semantic via the resolver.
  {
    id: "color-action",
    name: "Action",
    value: "#1A56DB",
    category: "colors",
    cssVar: "--buildrick-design-color-action",
    type: "color",
    group: "semantic",
    semanticKind: "action",
    aliasOf: "color-brand-500",
  },
  {
    id: "color-surface",
    name: "Surface",
    value: "#F8FAFC",
    category: "colors",
    cssVar: "--buildrick-design-color-surface",
    type: "color",
    group: "semantic",
    semanticKind: "surface",
    aliasOf: "color-slate-50",
  },
  {
    id: "color-text-primary",
    name: "Text Primary",
    value: "#334155",
    category: "colors",
    cssVar: "--buildrick-design-color-text-primary",
    type: "color",
    group: "semantic",
    semanticKind: "text",
    aliasOf: "color-slate-700",
  },
  {
    id: "color-feedback-error",
    name: "Feedback Error",
    value: "#EF4444",
    category: "colors",
    cssVar: "--buildrick-design-color-feedback-error",
    type: "color",
    group: "semantic",
    semanticKind: "feedback",
    aliasOf: "color-red-500",
  },
];

/**
 * Per-version migration functions. Key = TARGET version.
 *
 * When adding a migration:
 *   1. Bump CURRENT_SCHEMA_VERSION
 *   2. Add MIGRATIONS[newVersion] = migratorFn here
 *   3. Add alias to generateCompatibilityShim in exportUtils.ts (2-version retention)
 */
const MIGRATIONS: Record<number, (tokens: DesignToken[]) => DesignToken[]> = {
  // v1 → v2: additive only. semanticKind field defaults to undefined,
  // preserving all existing tokens as primitives. Identity transform.
  2: (tokens) => tokens,
  // v2 → v3: additive only. replacedBy field defaults to undefined.
  // Sweep semantics activate at v5 (2-version retention window from v3).
  3: (tokens) => tokens,
  // v3 → v4: id-gated append of B5-wire seed tokens. Existing entries are
  // preserved verbatim — only missing ids are added. Lets users who edited
  // a seed (e.g. recolored color-action) keep their edit through the bump.
  4: (tokens) => {
    const existingIds = new Set(tokens.map((t) => t.id));
    const additions = V4_SEEDS.filter((t) => !existingIds.has(t.id));
    return additions.length === 0 ? tokens : [...tokens, ...additions];
  },
  // v4 → v5: rename color-blue-500 → color-brand-500 in place, and repoint
  // every alias that pointed at it. In place rather than the replacedBy bridge
  // because a bridge leaves BOTH ids in the list and the Tokens screen would
  // show the user two primitives where they have one. The old CSS variable
  // keeps resolving on published sites via ALIAS_RETENTION in exportUtils.
  //
  // `value` is deliberately carried across untouched: a site already published
  // with #2D6DFF stays that colour until its owner changes it. Only new seeds
  // get #1A56DB.
  5: (tokens) => {
    if (!tokens.some((t) => t.id === OLD_BRAND_PRIMITIVE_ID || t.aliasOf === OLD_BRAND_PRIMITIVE_ID)) {
      return tokens;
    }
    return tokens.map((t) => {
      const next = { ...t };
      if (next.id === OLD_BRAND_PRIMITIVE_ID) {
        next.id = BRAND_PRIMITIVE_ID;
        next.name = "Brand 500";
        next.cssVar = "--buildrick-design-color-brand-500";
      }
      if (next.aliasOf === OLD_BRAND_PRIMITIVE_ID) next.aliasOf = BRAND_PRIMITIVE_ID;
      return next;
    });
  },
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
