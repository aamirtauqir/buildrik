/**
 * Layout-family section registry: quick-actions, layout, size, spacing,
 * flex, grid. Edits the geometry / box-model side of an element.
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, type AnySectionEntry } from "./_shared";
import { getProfileFor } from "../../config/elementProfiles";
import { FlexboxSection } from "../flexbox";
import { GridSection } from "../GridSection";
import { LayoutSection } from "../layout";
import { QuickActionsSection } from "../QuickActionsSection";
import { SizeSection } from "../SizeSection";
import { SpacingSection } from "../SpacingSection";

export const LAYOUT_SECTIONS: Record<string, AnySectionEntry> = {
  "quick-actions": defineSection({
    Component: QuickActionsSection,
    styleKeys: ["display", "position", "width", "height", "background-color", "color"],
    adaptProps: (ctx) => ({
      styles: ctx.styles,
      onBatchChange: ctx.onBatchChange,
      tier: ctx.tier,
    }),
  }),

  layout: defineSection({
    Component: LayoutSection,
    advancedKey: "layout",
    styleKeys: ["display", "position", "width", "height", "top", "right", "bottom", "left", "z-index", "overflow", "overflow-x", "overflow-y", "float", "clear", "visibility"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  size: defineSection({
    Component: SizeSection,
    advancedKey: "size",
    styleKeys: ["width", "height", "min-width", "min-height", "max-width", "max-height", "aspect-ratio", "object-fit"],
    adaptProps: (ctx) => {
      const profile = getProfileFor(ctx.selectedElement.type);
      const hasLayout = profile?.style?.order?.includes("layout") ?? false;
      return {
        ...adaptBaseStyleProps(ctx),
        propertyStates: ctx.propertyStates,
        advancedExpanded: ctx.advancedExpanded,
        onAdvancedToggle: ctx.onAdvancedToggle,
        showDimensions: !hasLayout,
      };
    },
  }),

  spacing: defineSection({
    Component: SpacingSection,
    advancedKey: "spacing",
    styleKeys: ["padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "gap", "row-gap", "column-gap"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  flex: defineSection({
    Component: FlexboxSection,
    styleKeys: ["display", "flex-direction", "flex-wrap", "justify-content", "align-items", "align-content", "align-self", "order", "flex-grow", "flex-shrink", "flex-basis", "gap"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      propertyStates: ctx.propertyStates,
      isFlexItem: ctx.cssContext.isFlexItem,
    }),
    // Render when this element IS a flex container OR its parent is one
    // (so a flex item sees its grow/shrink/align-self controls).
    shouldRender: (ctx) =>
      ctx.cssContext.isFlexContainer || ctx.cssContext.isFlexItem,
  }),

  grid: defineSection({
    Component: GridSection,
    styleKeys: ["grid-template-columns", "grid-template-rows", "grid-auto-flow", "grid-column", "grid-row", "gap", "row-gap", "column-gap", "justify-items", "justify-content", "justify-self", "align-items", "align-content", "align-self"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      isGridContainer: ctx.cssContext.isGridContainer,
      isGridItem: ctx.cssContext.isGridItem,
    }),
    shouldRender: (ctx) =>
      ctx.cssContext.isGridContainer || ctx.cssContext.isGridItem,
  }),
};
