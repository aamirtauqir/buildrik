/**
 * Visual-family section registry: background, border, corner-radius.
 * Edits the surface treatment of an element (paint + edges).
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry } from "./_shared";
import { BackgroundSection } from "../BackgroundSection";
import { BorderSection } from "../BorderSection";
import { CornerRadiusSection } from "../CornerRadiusSection";
import { SchemaBorderSection } from "../border/SchemaBorderSection";
import { USE_SCHEMA_BORDER } from "../../renderer/featureFlags";

export const VISUAL_SECTIONS: Record<string, AnySectionEntry> = {
  background: defineSection({
    Component: BackgroundSection,
    advancedKey: "background",
    styleKeys: ["background", "background-color", "background-image", "background-size", "background-position", "background-repeat", "background-attachment"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onOpenMediaLibrary: ctx.onOpenMediaLibrary,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  border: defineSection({
    // Feature-flagged: localStorage.setItem("buildrick:schema-border", "1")
    // + reload to render the schema-driven version. Default path remains
    // the hand-written BorderSection until the schema reaches full parity
    // including mixed-value badges and persisted advanced-toggle state.
    Component: USE_SCHEMA_BORDER ? SchemaBorderSection : BorderSection,
    advancedKey: "border",
    styleKeys: ["border", "border-width", "border-style", "border-color", "border-top", "border-right", "border-bottom", "border-left", "outline-width", "outline-style", "outline-color", "outline-offset"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  "corner-radius": defineSection({
    Component: CornerRadiusSection,
    styleKeys: [
      "border-radius",
      "border-top-left-radius",
      "border-top-right-radius",
      "border-bottom-right-radius",
      "border-bottom-left-radius",
    ],
    adaptProps: (ctx) => adaptBaseStyleProps(ctx),
  }),
};
