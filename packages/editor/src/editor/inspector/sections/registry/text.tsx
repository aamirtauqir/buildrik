/**
 * Text registry entries — Typography (open, text types; also the Page
 * panel's Font + Text colour, board 21) and "Text inside" (closed with a
 * one-line summary: containers, board 17; button, form fields and widgets,
 * owner answer 1). Owned by lane L2-A.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, shownOnInstanceRoot, type AnySectionEntry, type SectionContext } from "./_shared";
import { TypographySection } from "../typography";
import { primaryFamily } from "../typography/FontPickerDropdown";
import { cssVarToTokenId, extractVarName, resolveTokenVar } from "@/editor/inspector/shared/tokenBindingDetection";
import { getDOMElement } from "@/engine/canvas/resize/utils";
import { parseColor } from "@/shared/utils/parsers/colorParser";
import { rgbToHex } from "@/shared/utils/parsers/colorConversionBasic";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";
import type { DesignToken } from "@/engine/designSystem/types";
import type { Composer } from "@/engine";
import { colourTokenLabel } from "@/editor/inspector/shared/controls/ColorInput";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";

const SUMMARY_KEYS = ["font-family", "font-size", "color"] as const;

const TYPOGRAPHY_KEYS = ["font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "color", "text-align", "text-transform", "text-decoration", "white-space", "word-break", "word-spacing", "text-indent", "vertical-align"];
const TYPOGRAPHY_ADVANCED = ["font-style", "text-transform", "text-decoration", "letter-spacing", "word-spacing", "white-space", "word-break", "text-indent", "vertical-align"];

const adaptTypography = (ctx: SectionContext) => ({
  ...adaptBaseStyleProps(ctx),
  advancedExpanded: ctx.advancedExpanded,
  onAdvancedToggle: ctx.onAdvancedToggle,
  variant: ctx.variant,
  /* The Page panel shows what the page renders where it sets nothing: its
     font and text colour (board 21: "Inter", "Text / primary"). */
  inherited: ctx.variant === "page" ? renderedValues(ctx.selectedElement.id, ctx.styles, ctx.composer) : undefined,
});

/** A value as the summary shows it: a token var resolves to what it stands
 *  for (a size, a family), else stays the token's id; anything else as is. */
function shown(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const varName = extractVarName(value);
  if (!varName) return value;
  return resolveTokenVar(value) || cssVarToTokenId(varName) || value;
}

const toHex = (value: string): string | null => {
  const rgb = parseColor(value);
  return rgb ? rgbToHex(rgb).toUpperCase() : null;
};

/** A palette step ("color-slate-700") rather than a role ("color-text-primary"). */
const isRamp = (id: string) => /-\d+$/.test(id);

/**
 * The site's colour token whose value is `hex` — the saved tokens over the
 * seed. Several tokens can share a value (#334155 is both Slate / 700 and
 * Text / primary): a role name wins over a palette step, then Brand's order.
 * Null when none matches.
 */
function colourTokenFor(composer: Composer | null | undefined, hex: string): DesignToken | null {
  const settings = composer?.getProjectSettings?.();
  const tokens = mergeProjectTokens(settings?.designTokens ?? [], settings?.designTokensSchemaVersion);
  const want = hex.toUpperCase();
  const hits = tokens.filter((t) => t.category === "colors" && toHex(resolveTokenLiteral(tokens, t.id, "light") ?? "") === want);
  /* A semantic token is the name a site gave the colour; the primitive it
     aliases shares its value and comes earlier in the list. */
  return hits.find((t) => t.layer === "semantic" && !isRamp(t.id)) ?? hits.find((t) => !isRamp(t.id)) ?? hits[0] ?? null;
}

/**
 * What an element renders as for the summary keys it has no value of its own
 * for — a container or the page root usually carries none and inherits them
 * (boards 17, 21). Read off the canvas node. A colour that equals a Brand
 * colour token comes back as that token's var, else as hex.
 */
function renderedValues(elementId: string, own: Record<string, string>, composer: Composer | null | undefined): Record<string, string> {
  const node = getDOMElement(elementId);
  if (!node) return {};
  const cs = window.getComputedStyle(node);
  const out: Record<string, string> = {};
  for (const key of SUMMARY_KEYS) {
    if (own[key]) continue;
    const value = cs.getPropertyValue(key).trim();
    if (!value) continue;
    const hex = key === "color" ? toHex(value) : null;
    const token = hex ? colourTokenFor(composer, hex) : null;
    out[key] = token?.cssVar ? `var(${token.cssVar})` : (hex ?? value);
  }
  return out;
}

/** "Inter · 16px · Text / primary" — family, size, colour (board 17). A
 *  colour bound to a Brand token is named by the token, never `var(--…)`. */
export function textSummary(styles: Record<string, string>): string | null {
  const family = primaryFamily(shown(styles["font-family"]) ?? "") || undefined;
  const colourVar = styles.color ? extractVarName(styles.color) : null;
  const colourId = colourVar ? cssVarToTokenId(colourVar) : null;
  const colour = colourId ? colourTokenLabel(colourId) : styles.color;
  const parts = [family, shown(styles["font-size"]), colour].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export const TEXT_SECTIONS: Record<string, AnySectionEntry> = {
  typography: defineSection({
    tab: "style",
    title: "Typography",
    open: "always",
    page: true,
    capability: (caps) => caps.typography === "open",
    Component: TypographySection,
    advancedKey: "typography",
    advancedProps: TYPOGRAPHY_ADVANCED,
    styleKeys: TYPOGRAPHY_KEYS,
    adaptProps: adaptTypography,
  }),

  "text-inside": defineSection({
    tab: "style",
    title: "Text inside",
    open: "closed",
    capability: (caps) => caps.typography === "inside",
    shouldRender: (ctx) => shownOnInstanceRoot(ctx, TYPOGRAPHY_KEYS),
    summary: (ctx) => textSummary({ ...renderedValues(ctx.selectedElement.id, ctx.styles, ctx.composer), ...ctx.styles }),
    Component: TypographySection,
    advancedKey: "text-inside",
    advancedProps: TYPOGRAPHY_ADVANCED,
    styleKeys: TYPOGRAPHY_KEYS,
    adaptProps: adaptTypography,
  }),
};
