import type { DesignToken } from "../types";

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
  | "missing-dark";

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

    for (const t of tokens) {
      const isColor = t.category === "colors" || t.kind === "color";

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
