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

import type { DesignToken } from "../types";

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

const REQUIRED_FIELDS = ["id", "name", "value", "category", "cssVar", "type"] as const;

function isCandidateToken(x: unknown): x is DesignToken {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  return REQUIRED_FIELDS.every((f) => typeof obj[f] === "string");
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

  const errors: string[] = [];
  const tokens: DesignToken[] = [];
  candidates.forEach((c, i) => {
    if (!isCandidateToken(c)) {
      errors.push(`Token #${i} is missing required fields (${REQUIRED_FIELDS.join(", ")})`);
      return;
    }
    /* "Valid" used to mean only "has six string fields" — `kind` is not among
       them — so a token in any of the eleven kinds that `category` cannot
       resolve was counted in "Valid tokens N" and in "Apply N valid only", then
       silently dropped at apply time with a count-only toast. A token that
       cannot be routed is not valid; say so here, with its id. */
    if (inferKind(c) === null) {
      errors.push(
        `Token "${c.id}" has no "kind" and category "${c.category}" doesn't name one — ` +
          `add "kind" (e.g. radius, shadow, motion) so it can be applied.`,
      );
      return;
    }
    tokens.push(c);
  });

  if (errors.length > 0) return { tokens: [], errors };
  return { tokens, errors: [] };
}

export function diffTokens(current: DesignToken[], incoming: DesignToken[]): DiffResult {
  const currentById = new Map(current.map((t) => [t.id, t]));
  const added: DesignToken[] = [];
  const modified: TokenModification[] = [];

  for (const t of incoming) {
    const existing = currentById.get(t.id);
    if (!existing) {
      added.push(t);
    } else if (existing.value !== t.value || existing.darkValue !== t.darkValue) {
      // §2-B13: a dark-mode-only change (light value identical) must still
      // count as a modification, else re-importing a dark-complete export
      // shows "nothing to apply" and the dark variant silently never lands.
      modified.push({ id: t.id, previousValue: existing.value, nextValue: t.value });
    }
  }

  return { added, modified };
}
