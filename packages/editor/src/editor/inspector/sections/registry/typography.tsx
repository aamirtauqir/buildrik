/**
 * Typography-family section registry: typography (font + text-rendering).
 *
 * Lives in its own file so future sections that edit text concerns
 * (line-height variants, vertical rhythm, etc.) have a clear home.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry } from "./_shared";
import { TypographySection } from "../typography";
import { CONTAINER_TYPES } from "@/shared/utils/html/typeMapping";

export const TYPOGRAPHY_SECTIONS: Record<string, AnySectionEntry> = {
  typography: defineSection({
    tab: "style",
    title: "Typography",
    Component: TypographySection,
    advancedKey: "typography",
    /* Extracted from this section's own advanced block, not from a registry
       prefix — see SectionEntry.advancedProps. */
    advancedProps: ["font-style", "text-indent", "vertical-align", "white-space", "word-break"],
    styleKeys: ["font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "color", "text-align", "text-transform", "text-decoration", "white-space", "word-break", "word-spacing", "text-indent", "vertical-align"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
      inherited: ctx.cssContext.inspectorContext.isTextLike !== true,
    }),
    /* Text-like elements, and containers — board 7056:78382 draws TYPOGRAPHY
       on a Section: the family and size its text inherits. */
    shouldRender: (ctx) =>
      ctx.cssContext.inspectorContext.isTextLike === true || CONTAINER_TYPES.has(ctx.selectedElement.type),
  }),
};
