import type { DesignToken, StylePreset } from "../types";

export type LintSeverity = "warning" | "error";

export interface LintIssue {
  rule: LintRuleId;
  severity: LintSeverity;
  tokenId: string;
  message: string;
}

export type LintRuleId =
  | "banned-hue"
  | "pure-black"
  | "empty-value"
  | "missing-dark"
  | "unresolved-binding"
  | "alias-depth-exceeded"
  | "semantic-needs-alias";

/** Max alias chain depth per B2 lock (2026-05-16). Mirror of MAX_ALIAS_DEPTH in
 *  engine/aliasResolver/errors.ts — kept inline to avoid editor → engine import
 *  here since DSLinter ships before AliasResolver in the dep graph for some tests. */
const MAX_ALIAS_DEPTH = 3;

/**
 * Phase H.0: DSLinter — pure-function checker for design-token violations.
 *
 * Rules (initial set; more can be added as DESIGN.md grows):
 *   banned-hue   — color token whose value is in the purple/violet/indigo
 *                  family. DESIGN.md mandates cobalt #2D6DFF as sole accent.
 *   pure-black   — color token with #000 or near-black. DESIGN.md NO BLACK.
 *   empty-value  — non-color token with empty `value` string. Empty `value`
 *                  for a color token is allowed only when the consumer treats
 *                  the token as "transparent / unset"; we still flag it.
 *   missing-dark — color token in a project that has any darkValue at all,
 *                  but this specific token is missing one. Surfaces UI warn
 *                  chip per spec D16.
 *
 * UI consumer is responsible for debouncing per spec D21 (500 ms). The linter
 * itself is pure and synchronous so it can run in tests + on every keystroke
 * if the caller wants.
 */
export class DSLinter {
  lint(tokens: readonly DesignToken[]): LintIssue[] {
    const issues: LintIssue[] = [];
    const projectHasAnyDark = tokens.some((t) => t.darkValue !== undefined);
    const byId = new Map<string, DesignToken>();
    for (const t of tokens) byId.set(t.id, t);

    for (const t of tokens) {
      const isColor = t.category === "colors" || t.kind === "color";

      // semantic-needs-alias (B5 lock 2026-05-16): a token with semanticKind
      // set MUST also have aliasOf set. Semantics are role-named pointers to
      // a primitive (or another semantic); without aliasOf they resolve to
      // nothing. Lint as error to prevent silent rendering failure.
      if (t.semanticKind !== undefined && !t.aliasOf) {
        issues.push({
          rule: "semantic-needs-alias",
          severity: "error",
          tokenId: t.id,
          message: `Semantic token "${t.id}" (semanticKind="${t.semanticKind}") is missing aliasOf. Every semantic token must point to a primitive or another semantic via aliasOf.`,
        });
      }

      // alias-depth-exceeded (B2 lock 2026-05-16): walk the chain from this
      // token; if length exceeds MAX_ALIAS_DEPTH + 1, emit issue on the entry
      // token only. AliasResolver.validate throws on save, this rule surfaces
      // the same condition non-fatally for lint UI (banner/chip).
      if (t.aliasOf) {
        const visited = new Set<string>([t.id]);
        const chain: string[] = [t.id];
        let cursor: DesignToken | undefined = byId.get(t.aliasOf);
        while (cursor) {
          chain.push(cursor.id);
          if (visited.has(cursor.id)) break; // cycle — separate concern
          visited.add(cursor.id);
          if (!cursor.aliasOf) break;
          cursor = byId.get(cursor.aliasOf);
        }
        if (chain.length > MAX_ALIAS_DEPTH + 1) {
          issues.push({
            rule: "alias-depth-exceeded",
            severity: "error",
            tokenId: t.id,
            message: `Token "${t.id}" alias chain exceeds max depth 3 — ${chain.join(" → ")}`,
          });
        }
      }

      // empty-value (warning — color tokens can be intentionally empty)
      if (!t.value || t.value.trim() === "") {
        issues.push({
          rule: "empty-value",
          severity: isColor ? "warning" : "error",
          tokenId: t.id,
          message: `Token "${t.id}" has empty value.`,
        });
      }

      if (!isColor) continue;

      // banned-hue: purple/violet/indigo
      if (isBannedHue(t.value)) {
        issues.push({
          rule: "banned-hue",
          severity: "error",
          tokenId: t.id,
          message: `Token "${t.id}" uses a purple/violet/indigo hue ("${t.value}"). DESIGN.md bans these — use cobalt #2D6DFF or a slate neutral.`,
        });
      }
      if (t.darkValue !== undefined && isBannedHue(t.darkValue)) {
        issues.push({
          rule: "banned-hue",
          severity: "error",
          tokenId: t.id,
          message: `Token "${t.id}" darkValue ("${t.darkValue}") uses a banned hue.`,
        });
      }

      // pure-black: #000 / #000000
      if (isPureBlack(t.value)) {
        issues.push({
          rule: "pure-black",
          severity: "error",
          tokenId: t.id,
          message: `Token "${t.id}" is pure black. DESIGN.md NO BLACK rule — use slate-700 or cobalt instead.`,
        });
      }
      if (t.darkValue !== undefined && isPureBlack(t.darkValue)) {
        issues.push({
          rule: "pure-black",
          severity: "error",
          tokenId: t.id,
          message: `Token "${t.id}" darkValue is pure black. DESIGN.md NO BLACK rule.`,
        });
      }

      // missing-dark: warn only when project has any dark intent at all
      if (projectHasAnyDark && t.darkValue === undefined) {
        issues.push({
          rule: "missing-dark",
          severity: "warning",
          tokenId: t.id,
          message: `Color token "${t.id}" missing darkValue. Will fall back to light value in dark mode.`,
        });
      }
    }

    return issues;
  }

  /** Filter helper — caller often wants only error-severity issues. */
  errors(tokens: readonly DesignToken[]): LintIssue[] {
    return this.lint(tokens).filter((i) => i.severity === "error");
  }

  /**
   * Phase B/S2.1 follow-up: scan preset bindings, ensure every tokenId
   * resolves against the live token registry. Per spec §5.4 raw values
   * are forbidden; this catches the orthogonal failure — a binding that
   * references an id which has been deleted or renamed.
   *
   * Returns issues with tokenId field set to "${presetId}.${cssProperty}"
   * so UI consumers can render a row-scoped warning chip.
   */
  lintPresets(
    presets: readonly StylePreset[],
    tokens: readonly DesignToken[],
  ): LintIssue[] {
    const tokenIds = new Set(tokens.map((t) => t.id));
    const issues: LintIssue[] = [];
    for (const p of presets) {
      for (const [css, b] of Object.entries(p.bindings)) {
        if (!tokenIds.has(b.tokenId)) {
          issues.push({
            rule: "unresolved-binding",
            severity: "error",
            tokenId: `${p.id}.${css}`,
            message: `Preset "${p.id}" binding ${css} → unknown token "${b.tokenId}".`,
          });
        }
      }
    }
    return issues;
  }
}

// ─── Rule helpers ────────────────────────────────────────────────────────────

function isBannedHue(value: string): boolean {
  const v = value.trim().toLowerCase();
  // Tailwind purple / violet / indigo hex families. Approximate regex
  // catches the dominant prefixes; finer-grain HSL detection deferred.
  // Purple 500–900 starts with #6/#7/#8/#9 + 0–4 G channel + a-f-c B channel.
  // We use a permissive substring check on a handful of well-known values.
  const banned = [
    // indigo 400–700
    "#6366f1", "#4f46e5", "#4338ca", "#3730a3",
    // violet 400–700
    "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9",
    // purple 400–700
    "#c084fc", "#a855f7", "#9333ea", "#7e22ce",
  ];
  if (banned.includes(v)) return true;
  // Any rgb(...) /  hsl(...) parsing deferred. For now flag when the named
  // CSS keyword is "purple", "violet", or "indigo".
  if (v === "purple" || v === "violet" || v === "indigo") return true;
  return false;
}

function isPureBlack(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "#000" || v === "#000000" || v === "black" || v === "rgb(0,0,0)" || v === "rgb(0, 0, 0)";
}
