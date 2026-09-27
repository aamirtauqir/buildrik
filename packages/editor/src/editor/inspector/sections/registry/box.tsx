/**
 * Box registry entries — Layout, Size, Spacing, Fill, Border, and the
 * interim Flexbox / Grid sections. Owned by lane L2-C after W1 (which folds
 * Flexbox / Grid into Layout and the Flex / Grid type blocks).
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry } from "./_shared";
import { FlexboxSection } from "../flexbox";
import { GridSection } from "../GridSection";
import { LayoutSection } from "../layout";
import { SizeSection } from "../SizeSection";
import { SpacingSection } from "../SpacingSection";
import { BackgroundSection } from "../BackgroundSection";
import { BorderSection } from "../BorderSection";

export const BOX_SECTIONS: Record<string, AnySectionEntry> = {
  layout: defineSection({
    tab: "style",
    title: "Layout",
    open: "always",
    capability: (caps) => caps.layout,
    Component: LayoutSection,
    advancedKey: "layout",
    advancedProps: ["position", "top", "right", "bottom", "left", "z-index", "overflow", "overflow-x", "overflow-y", "box-sizing", "float", "clear", "visibility"],
    styleKeys: ["display", "position", "width", "height", "top", "right", "bottom", "left", "z-index", "overflow", "overflow-x", "overflow-y", "box-sizing", "float", "clear", "visibility"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  /* Interim (L2-C): a CONTAINER set to flex / grid. The Flex and Grid types
     carry the same controls in their type block, so they skip this. */
  flex: defineSection({
    tab: "style",
    title: "Flexbox",
    open: "always",
    capability: (caps) => caps.layout,
    shouldRender: (ctx) => ctx.cssContext.isFlexContainer,
    Component: FlexboxSection,
    styleKeys: ["display", "flex-direction", "flex-wrap", "justify-content", "align-items", "align-content", "align-self", "order", "flex-grow", "flex-shrink", "flex-basis", "gap"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      propertyStates: ctx.propertyStates,
      isFlexItem: false,
    }),
  }),

  grid: defineSection({
    tab: "style",
    title: "Grid",
    open: "always",
    capability: (caps) => caps.layout,
    shouldRender: (ctx) => ctx.cssContext.isGridContainer,
    Component: GridSection,
    styleKeys: ["grid-template-columns", "grid-template-rows", "grid-auto-flow", "grid-column", "grid-row", "gap", "row-gap", "column-gap", "justify-items", "justify-content", "justify-self", "align-items", "align-content", "align-self"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      isGridContainer: true,
      isGridItem: false,
    }),
  }),

  size: defineSection({
    tab: "style",
    title: "Size",
    open: "always",
    page: true,
    Component: SizeSection,
    advancedKey: "size",
    advancedProps: ["min-width", "max-width", "min-height", "max-height", "object-fit"],
    styleKeys: ["width", "height", "min-width", "min-height", "max-width", "max-height", "aspect-ratio", "object-fit"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  spacing: defineSection({
    tab: "style",
    title: "Spacing",
    open: "always",
    page: true,
    Component: SpacingSection,
    advancedKey: "spacing",
    advancedProps: ["gap", "row-gap", "column-gap"],
    styleKeys: ["padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "gap", "row-gap", "column-gap"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  fill: defineSection({
    tab: "style",
    title: "Fill",
    open: "valued",
    page: true,
    Component: BackgroundSection,
    advancedKey: "fill",
    advancedProps: ["background-position", "background-size", "background-repeat", "background-attachment", "background-blend-mode"],
    styleKeys: ["background", "background-color", "background-image", "background-size", "background-position", "background-repeat", "background-attachment", "background-blend-mode"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      onOpenMediaLibrary: ctx.onOpenMediaLibrary,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  border: defineSection({
    tab: "style",
    title: "Border",
    open: "valued",
    Component: BorderSection,
    advancedKey: "border",
    advancedProps: ["outline-width", "outline-style", "outline-color", "outline-offset"],
    styleKeys: ["border", "border-width", "border-style", "border-color", "border-top", "border-right", "border-bottom", "border-left", "outline-width", "outline-style", "outline-color", "outline-offset", "border-radius", "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),
};
