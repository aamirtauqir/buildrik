/**
 * Contrast as a LINT RULE — one computation, every surface.
 *
 * Found live 2026-08-13: the colour list's "Issues (1)" chip counted its own
 * local WCAG check while the Lint destination said "Nothing to fix" — the
 * exact banner-vs-section disagreement M5's shared hook was built to end,
 * reintroduced by a third, local implementation. The engine's original
 * LintIssue union even carried "contrast"; DSLinter never implemented it, so
 * ColorTokenList grew its own.
 *
 * These helpers moved here from ColorTokenList so the chip (fix suggestions)
 * and useDSLint (the shared result the Lint section and banner read) compute
 * from the same functions.
 *
 * @license BSD-3-Clause
 */
import type { LintIssue } from "../../../engine/designSystem/linter";
import type { DesignToken } from "../types";
import { calcWcagLevel } from "./colorUtils";

/**
 * Resolved from the customer's own background token, honouring their colour
 * mode. Falls back to white, which is what a web page is when nobody says
 * otherwise — never to near-black. (Bodies verbatim from ColorTokenList —
 * the first extraction rewrote them from memory and reported 4 findings
 * where the chip showed 1.)
 */
const FALLBACK_BG = "#FFFFFF";

export function findSurfaceToken(tokens: readonly DesignToken[]): DesignToken | undefined {
  return (
    tokens.find((t) => t.id === "color-background") ??
    tokens.find((t) => t.group === "surface" && /background/i.test(t.name))
  );
}

export function resolveSurface(bg: DesignToken | undefined, mode: "light" | "dark"): string {
  if (!bg) return FALLBACK_BG;
  return (mode === "dark" ? bg.darkValue : bg.value) || bg.value || FALLBACK_BG;
}

/** In dark mode a token is shown as its dark value, so that is the value that
 *  has to survive the dark surface. */
export const shownValue = (t: DesignToken, mode: "light" | "dark") =>
  (mode === "dark" ? t.darkValue : t.value) || t.value;

/** The page colour itself is not "text on the page" — never compare it to
 *  itself. By VALUE, not just by id: the default palette ships #F8FAFC three
 *  times (`color-background`, `color-slate-50`, `color-surface`), so an
 *  id-only check flagged the page colour twice at ratio 1.00 and a fresh site
 *  opened on four warnings, two of them impossible to act on — passing
 *  contrast against the page is not a thing Slate 50 can do and stay Slate 50. */
export const contrastFails = (
  t: DesignToken,
  surfaceBg: string,
  mode: "light" | "dark",
  surfaceId?: string,
) => {
  if (t.id === surfaceId) return false;
  const shown = shownValue(t, mode);
  if (shown && shown.toUpperCase() === surfaceBg.toUpperCase()) return false;
  return calcWcagLevel(shown, surfaceBg) === "fail";
};

/** The rule, in the linter's vocabulary — what useDSLint merges in. */
export function buildContrastIssues(
  tokens: readonly DesignToken[],
  mode: "light" | "dark",
): LintIssue[] {
  const surfaceToken = findSurfaceToken(tokens);
  const surfaceBg = resolveSurface(surfaceToken, mode);
  return tokens
    .filter((t) => contrastFails(t, surfaceBg, mode, surfaceToken?.id))
    .map((t) => ({
      rule: "contrast" as const,
      severity: "warning" as const,
      tokenId: t.id,
      message: `${t.name || t.id} fails WCAG AA against the page background`,
    }));
}
