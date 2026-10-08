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
import { PAGE_BACKGROUND_TOKEN } from "@buildrik/shared/content/elementIds";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "../types";
import { calcContrastRatio, calcWcagLevel, hexToRgb, relativeLuminance } from "./colorUtils";
import { parseColor, rgbToHex } from "@/shared/utils/parsers";

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
    /* `color-surface` is the SEMANTIC name for the same colour, and in
       Beginner mode it is the only one of the two on screen. Missing it sent
       the whole computation to the white fallback, where the page colour
       itself scored 1.05 and got reported as a contrast failure — with an
       auto-fix that would have repainted the page grey. */
    tokens.find((t) => t.id === "color-surface") ??
    tokens.find((t) => t.group === "surface" && /background/i.test(t.name))
  );
}

export function resolveSurface(
  bg: DesignToken | undefined,
  tokens: readonly DesignToken[],
  mode: "light" | "dark",
): string {
  if (!bg) return FALLBACK_BG;
  return shownValue(bg, tokens, mode) || FALLBACK_BG;
}

/** In dark mode a token is shown as its dark value, so that is the value that
 *  has to survive the dark surface. An empty dark literal shows the light one. */
export const shownValue = (t: DesignToken, tokens: readonly DesignToken[], mode: "light" | "dark") =>
  resolveTokenLiteral(tokens, t.id, mode) || resolveTokenLiteral(tokens, t.id, "light") || "";

/** Token ids that name a fill, a border or a colour shown on another fill. */
const NOT_PAGE_TEXT = /(^|-)(surface|border)(-|$)|^color-on-/;

/** The page colour itself is not "text on the page" — never compare it to
 *  itself. By VALUE, not just by id: the default palette ships that same
 *  colour under three ids (`color-background`, `color-slate-50`,
 *  `color-surface`), so an id-only check flagged the page colour twice at
 *  ratio 1.00 and a fresh site opened on four warnings, two of them
 *  impossible to act on — passing contrast against the page is not a thing
 *  Slate 50 can do and stay Slate 50. */
export const contrastFails = (
  t: DesignToken,
  tokens: readonly DesignToken[],
  surfaceBg: string,
  mode: "light" | "dark",
  surfaceId?: string,
) => {
  if (t.id === surfaceId) return false;
  /* The page root's own background is a surface too, never text on one —
     and seeded `transparent`, which no ratio can be read from. */
  if (t.id === PAGE_BACKGROUND_TOKEN.id) return false;
  /* Fills, borders and on-fill colours are not text on the page either: a
     raised surface is white ON the page by design, a border is not read, and
     on-primary is read against Primary (Brand Part 1b seed roles). */
  if (NOT_PAGE_TEXT.test(t.id)) return false;
  const shown = shownValue(t, tokens, mode);
  if (shown && shown.toUpperCase() === surfaceBg.toUpperCase()) return false;
  return calcWcagLevel(shown, surfaceBg) === "fail";
};

/** Which way the engine's one-step fix should push the token: away from the
 *  surface. A token darker than the page darkens further; one lighter than
 *  the page lightens. `applyAutoFix` rewrites the light literal, so the
 *  direction is read off the light value against the light surface. */
export function contrastFixHint(tokenValue: string, surfaceBg: string): "darken-22" | "lighten-22" {
  const t = hexToRgb(tokenValue);
  const s = hexToRgb(surfaceBg);
  if (!t || !s) return "darken-22";
  return relativeLuminance(t.r, t.g, t.b) < relativeLuminance(s.r, s.g, s.b) ? "darken-22" : "lighten-22";
}

/** The rule, in the linter's vocabulary — what useDSLint merges in. Each
 *  finding carries the hint `applyAutoFix` needs (B9 / SH-64), so the Issues
 *  panel's Fix › has a producer. */
export function buildContrastIssues(
  tokens: readonly DesignToken[],
  mode: "light" | "dark",
): LintIssue[] {
  const surfaceToken = findSurfaceToken(tokens);
  const surfaceBg = resolveSurface(surfaceToken, tokens, mode);
  const lightSurface = resolveSurface(surfaceToken, tokens, "light");
  /* Only semantic tokens are shown on a page. A primitive is the literal a
     semantic token aliases — often its DARK literal — so measuring it against
     the light surface reports colours no page shows in that mode. */
  return tokens
    .filter((t) => t.layer === "semantic" && contrastFails(t, tokens, surfaceBg, mode, surfaceToken?.id))
    .map((t) => ({
      rule: "contrast" as const,
      severity: "warning" as const,
      tokenId: t.id,
      message: `${t.name || t.id} fails WCAG AA against the page background`,
      autoFixHint: contrastFixHint(resolveTokenLiteral(tokens, t.id, "light") ?? "", lightSurface),
    }));
}

/** The element surface the dark-mode pair check reads — `Element` satisfies it. */
export interface StyledNode {
  getStyles(): Record<string, string>;
  getParent(): StyledNode | null;
}

const TOKEN_VAR = /var\(\s*(--buildrick-design-[\w-]+)/;
const styleOf = (s: Record<string, string>, kebab: string, camel: string) => (s[kebab] ?? s[camel] ?? "").trim();

/** One side of a pair: a token (with its light and dark literals) or a raw colour. */
function side(value: string, tokens: readonly DesignToken[]): { tokenId: string | null; light: string; dark: string } | null {
  const ref = TOKEN_VAR.exec(value);
  if (ref) {
    const t = tokens.find((x) => x.cssVar === ref[1]);
    if (!t) return null;
    const light = resolveTokenLiteral(tokens, t.id, "light") ?? "";
    const dark = (t.modes.dark && resolveTokenLiteral(tokens, t.id, "dark")) || light;
    return hexToRgb(light) && hexToRgb(dark) ? { tokenId: t.id, light, dark } : null;
  }
  const rgb = parseColor(value);
  if (!rgb || (rgb.a !== undefined && rgb.a < 1)) return null;
  const hex = rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b }).toUpperCase();
  return { tokenId: null, light: hex, dark: hex };
}

/** The nearest painted background at or above `el` — `background-color`, or a
 *  `background` shorthand that is a colour or a token. */
function backgroundOf(el: StyledNode | null): string {
  for (let n = el; n; n = n.getParent()) {
    const s = n.getStyles();
    const bg = styleOf(s, "background-color", "backgroundColor") || styleOf(s, "background", "background");
    if (bg && bg !== "transparent" && bg !== "none" && !/gradient|url\(/.test(bg)) return bg;
  }
  return "";
}

/**
 * Dark mode only (BRP1-M8): an element whose text colour and background are
 * ONE token and ONE raw colour. Turning Auto on moves the token side and
 * leaves the raw side — inserted blocks bind their surfaces
 * (`color-surface-raised`, #FFFFFF → #1E293B) but some keep raw text
 * (`#666`, `#333`), so dark text lands on a dark card. Flagged when the pair
 * reads in light (≥ 4.5:1) and fails in dark; grouped by the token, which is
 * what Open lands on. Pairs of two tokens are the palette's contrast check,
 * and two raw colours never change with the mode. Only an element's OWN
 * `color` is read — inherited text is not followed.
 */
export function buildDarkPairIssues(elements: readonly StyledNode[], tokens: readonly DesignToken[]): LintIssue[] {
  const byToken = new Map<string, { count: number; worst: number; raw: string; dark: string }>();
  for (const el of elements) {
    const color = styleOf(el.getStyles(), "color", "color");
    if (!color) continue;
    const bgValue = backgroundOf(el);
    if (!bgValue) continue;
    const fg = side(color, tokens);
    const bg = side(bgValue, tokens);
    if (!fg || !bg || Boolean(fg.tokenId) === Boolean(bg.tokenId)) continue;
    if (calcContrastRatio(fg.light, bg.light) < 4.5) continue;
    const ratio = calcContrastRatio(fg.dark, bg.dark);
    if (ratio >= 4.5) continue;
    const token = (fg.tokenId ?? bg.tokenId) as string;
    const raw = fg.tokenId ? bg.dark : fg.dark;
    const dark = fg.tokenId ? fg.dark : bg.dark;
    const prev = byToken.get(token);
    if (!prev || ratio < prev.worst) byToken.set(token, { count: (prev?.count ?? 0) + 1, worst: ratio, raw, dark });
    else prev.count += 1;
  }
  return [...byToken].map(([tokenId, f]) => ({
    rule: "dark-mode-pair" as const,
    severity: "warning" as const,
    tokenId,
    message:
      `In dark mode ${f.count === 1 ? "1 element pairs" : `${f.count} elements pair`} a fixed colour (${f.raw}) with ${tokenId}, ` +
      `which turns ${f.dark} — ${f.worst.toFixed(1)}:1, below 4.5:1.`,
  }));
}
