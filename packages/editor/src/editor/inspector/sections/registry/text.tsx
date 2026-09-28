/**
 * Text registry entries — Typography (open, text types; also the Page
 * panel's Font + Text colour, board 21) and "Text inside" (closed with a
 * one-line summary: containers, board 17; button, form fields and widgets,
 * owner answer 1). Owned by lane L2-A.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry, type SectionContext } from "./_shared";
import { TypographySection } from "../typography";
import { primaryFamily } from "../typography/FontPickerDropdown";
import { cssVarToTokenId, extractVarName, resolveTokenVar } from "../../shared/tokenBindingDetection";
import { getDOMElement } from "@/engine/canvas/resize/utils";
import { parseColor } from "@/shared/utils/parsers/colorParser";
import { rgbToHex } from "@/shared/utils/parsers/colorConversionBasic";

const SUMMARY_KEYS = ["font-family", "font-size", "color"] as const;

const TYPOGRAPHY_KEYS = ["font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "color", "text-align", "text-transform", "text-decoration", "white-space", "word-break", "word-spacing", "text-indent", "vertical-align"];
const TYPOGRAPHY_ADVANCED = ["font-style", "text-transform", "text-decoration", "letter-spacing", "word-spacing", "white-space", "word-break", "text-indent", "vertical-align"];

const adaptTypography = (ctx: SectionContext) => ({
  ...adaptBaseStyleProps(ctx),
  advancedExpanded: ctx.advancedExpanded,
  onAdvancedToggle: ctx.onAdvancedToggle,
  variant: ctx.variant,
});

/**
 * A Brand colour token by the name the board prints — `color-text-primary`
 * reads "Text / primary": the group, then the rest.
 */
export function colourTokenLabel(tokenId: string): string {
  const [group, ...rest] = tokenId.replace(/^color-/, "").split("-");
  const head = group.charAt(0).toUpperCase() + group.slice(1);
  return rest.length ? `${head} / ${rest.join(" ")}` : head;
}

/** A value as the summary shows it: a token var resolves to what it stands
 *  for (a size, a family), else stays the token's id; anything else as is. */
function shown(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const varName = extractVarName(value);
  if (!varName) return value;
  return resolveTokenVar(value) || cssVarToTokenId(varName) || value;
}

/**
 * What the text inside an element renders as, for the summary keys it has no
 * value of its own for — a container usually carries none and inherits them
 * (board 17). Read off the canvas node; a colour comes back as hex.
 */
function renderedText(elementId: string, own: Record<string, string>): Record<string, string> {
  const node = getDOMElement(elementId);
  if (!node) return {};
  const cs = window.getComputedStyle(node);
  const out: Record<string, string> = {};
  for (const key of SUMMARY_KEYS) {
    if (own[key]) continue;
    const value = cs.getPropertyValue(key).trim();
    if (!value) continue;
    const rgb = key === "color" ? parseColor(value) : null;
    out[key] = rgb ? rgbToHex(rgb) : value;
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
    summary: (ctx) => textSummary({ ...renderedText(ctx.selectedElement.id, ctx.styles), ...ctx.styles }),
    Component: TypographySection,
    advancedKey: "text-inside",
    advancedProps: TYPOGRAPHY_ADVANCED,
    styleKeys: TYPOGRAPHY_KEYS,
    adaptProps: adaptTypography,
  }),
};
