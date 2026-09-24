/**
 * Visual-family section registry: background, border (incl. corner radius).
 * Edits the surface treatment of an element (paint + edges).
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry } from "./_shared";
import { BackgroundSection } from "../BackgroundSection";
import { BorderSection } from "../BorderSection";

export const VISUAL_SECTIONS: Record<string, AnySectionEntry> = {
  background: defineSection({
    tab: "style",
    Component: BackgroundSection,
    advancedKey: "background",
    /* Extracted from this section's own advanced block, not from a registry
       prefix — see SectionEntry.advancedProps. */
    advancedProps: ["background-position", "background-size", "background-repeat", "background-attachment", "background-blend-mode"],
    styleKeys: ["background", "background-color", "background-image", "background-size", "background-position", "background-repeat", "background-attachment", "background-blend-mode"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onOpenMediaLibrary: ctx.onOpenMediaLibrary,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  border: defineSection({
    tab: "style",
    Component: BorderSection,
    advancedKey: "border",
    /* Extracted from this section's own advanced block, not from a registry
       prefix — see SectionEntry.advancedProps. */
    advancedProps: ["outline-width", "outline-style", "outline-color", "outline-offset"],
    styleKeys: ["border", "border-width", "border-style", "border-color", "border-top", "border-right", "border-bottom", "border-left", "outline-width", "outline-style", "outline-color", "outline-offset", "border-radius", "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),
};
