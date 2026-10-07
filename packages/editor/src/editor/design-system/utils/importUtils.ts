/**
 * importUtils — pure JSON parser + diff for token import flow (S5).
 *
 * Accepts both export formats produced by exportUtils.buildExport("json", ...):
 *   - Versioned:  { schemaVersion: number, tokens: DesignToken[] }
 *   - Legacy:     DesignToken[]
 *
 * Validation is shape-only — minimum fields needed for the registries to
 * accept the token. Per-kind structural validation belongs in the Composer
 * gate (Phase A.2 AliasResolver / Zod schemas), not here.
 *
 * @license BSD-3-Clause
 */

import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { validateTokens } from "@buildrik/shared/schemas/design-tokens";
import type { DesignToken } from "../types";
import type { LegacyDesignToken } from "@/engine/designSystem/types";

export interface ParseResult {
  tokens: DesignToken[];
  errors: string[];
}

export interface TokenModification {
  id: string;
  previousValue: string;
  nextValue: string;
}

export interface DiffResult {
  added: DesignToken[];
  modified: TokenModification[];
}

import { inferKind } from "../state/useImportTokens";
import { isV6TokenRow } from "@/engine/designSystem/projectTokens";

/* A token with a category outside this set routes to a registry, applies, and
   is then dropped at persist with nothing said — the v6 schema's category enum
   is exactly this union. Rejected here instead, with its id. */
const PERSISTABLE_CATEGORIES = [
  "colors", "typography", "spacing", "effects",
  "layout", "icons", "buttons", "forms", "theme",
] as const;

const REQUIRED_FIELDS = ["id", "name", "value", "category", "cssVar", "type"] as const;

/** A row of a pre-v6 export (`value` / `darkValue` fields). */
function isLegacyRow(x: unknown): x is LegacyDesignToken {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  return REQUIRED_FIELDS.every((f) => typeof obj[f] === "string");
}

/** An imported pre-v6 row, one for one: a semantic token holding its own
 *  literals. No primitives are extracted — the registry update path writes
 *  literals, and an added token must stand alone in the import. */
function legacyRowToV6(row: LegacyDesignToken, kind: DesignToken["kind"]): DesignToken {
  const token: DesignToken = {
    id: row.id, name: row.name, kind, layer: "semantic",
    modes: row.darkValue !== undefined
      ? { light: { value: row.value }, dark: { value: row.darkValue } }
      : { light: { value: row.value } },
    category: row.category, cssVar: row.cssVar, type: row.type,
  };
  for (const key of ["group", "options", "description", "friendlyName", "semanticKind", "replacedBy"] as const) {
    if (row[key] !== undefined) Object.assign(token, { [key]: row[key] });
  }
  return token;
}
export function parseImportJSON(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { tokens: [], errors: [`JSON parse error: ${(e as Error).message}`] };
  }

  let candidates: unknown[];
  if (Array.isArray(parsed)) {
    candidates = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    "tokens" in parsed &&
    Array.isArray((parsed as { tokens: unknown }).tokens)
  ) {
    candidates = (parsed as { tokens: unknown[] }).tokens;
  } else {
    return { tokens: [], errors: ["Unrecognized format — expected token array or { schemaVersion, tokens }"] };
  }

  if (candidates.length === 0) {
    return { tokens: [], errors: ["Import is empty — no tokens to apply"] };
  }

  /* A v6 export (every row carries `modes`) is the graph as saved: validate it
     whole, aliases included. */
  if (candidates.every(isV6TokenRow)) {
    const checked = validateTokens(candidates);
    return checked.ok ? { tokens: checked.tokens, errors: [] } : { tokens: [], errors: [checked.reason] };
  }

  const errors: string[] = [];
  const tokens: DesignToken[] = [];
  candidates.forEach((c, i) => {
    if (!isLegacyRow(c)) {
      errors.push(`Token #${i} is missing required fields (${REQUIRED_FIELDS.join(", ")})`);
      return;
    }
    /* "Valid" used to mean only "has six string fields" — `kind` is not among
       them — so a token in any of the eleven kinds that `category` cannot
       resolve was counted in "Valid tokens N" and in "Apply N valid only", then
       silently dropped at apply time with a count-only toast. A token that
       cannot be routed is not valid; say so here, with its id. */
    if (!(PERSISTABLE_CATEGORIES as readonly string[]).includes(c.category)) {
      errors.push(
        `Token "${c.id}" has category "${c.category}", which isn't one of ` +
          `${PERSISTABLE_CATEGORIES.join(", ")} — it would not survive a save.`,
      );
      return;
    }
    const kind = inferKind(c);
    if (kind === null) {
      errors.push(
        `Token "${c.id}" has no "kind" and category "${c.category}" doesn't name one — ` +
          `add "kind" (e.g. radius, shadow, motion) so it can be applied.`,
      );
      return;
    }
    tokens.push(legacyRowToV6(c, kind));
  });

  if (errors.length > 0) return { tokens: [], errors };
  const checked = validateTokens(tokens);
  return checked.ok ? { tokens: checked.tokens, errors: [] } : { tokens: [], errors: [checked.reason] };
}

export function diffTokens(current: DesignToken[], incoming: DesignToken[]): DiffResult {
  const currentById = new Map(current.map((t) => [t.id, t]));
  const added: DesignToken[] = [];
  const modified: TokenModification[] = [];

  for (const t of incoming) {
    const existing = currentById.get(t.id);
    if (!existing) {
      added.push(t);
    } else {
      const previousValue = resolveTokenLiteral(current, t.id, "light") ?? "";
      const nextValue = resolveTokenLiteral(incoming, t.id, "light") ?? "";
      const darkOf = (list: readonly DesignToken[], tok: DesignToken) =>
        tok.modes.dark ? resolveTokenLiteral(list, tok.id, "dark") : undefined;
      // §2-B13: a dark-mode-only change (light value identical) must still
      // count as a modification, else re-importing a dark-complete export
      // shows "nothing to apply" and the dark variant silently never lands.
      if (previousValue !== nextValue || darkOf(current, existing) !== darkOf(incoming, t)) {
        modified.push({ id: t.id, previousValue, nextValue });
      }
    }
  }

  return { added, modified };
}
