/**
 * Text registry entries — Typography (open, text types) and "Text inside"
 * (closed with a summary, board 17; owner answer 1 extends it to button,
 * input and checkbox). Owned by lane L2-A after W1.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry, type SectionContext } from "./_shared";
import { TypographySection } from "../typography";

const TYPOGRAPHY_KEYS = ["font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "color", "text-align", "text-transform", "text-decoration", "white-space", "word-break", "word-spacing", "text-indent", "vertical-align"];
const TYPOGRAPHY_ADVANCED = ["font-style", "text-indent", "vertical-align", "white-space", "word-break"];

const adaptTypography = (ctx: SectionContext) => ({
  ...adaptBaseStyleProps(ctx),
  advancedExpanded: ctx.advancedExpanded,
  onAdvancedToggle: ctx.onAdvancedToggle,
  inherited: ctx.caps.typography !== "open",
});

/** "Inter · 16px · #111827" — family, size, colour, as the element carries them. */
function textSummary(styles: Record<string, string>): string | null {
  const family = styles["font-family"]?.split(",")[0]?.replace(/["']/g, "").trim();
  const parts = [family, styles["font-size"], styles.color].filter(Boolean);
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
    summary: (ctx) => textSummary(ctx.styles),
    Component: TypographySection,
    advancedKey: "text-inside",
    advancedProps: TYPOGRAPHY_ADVANCED,
    styleKeys: TYPOGRAPHY_KEYS,
    adaptProps: adaptTypography,
  }),
};
