/**
 * Box registry entries — Layout, Size, Spacing, Fill, Border (lane L2-C).
 *
 * There are no Flexbox / Grid sections any more: a container set to Flex or
 * Grid shows those controls inside Layout, and the Flex / Grid types carry
 * them in their type block (the same `FlexControls` / `GridControls`).
 * Flex- and grid-ITEM controls sit in Size while the parent is a flex or grid
 * container (`layout/ItemControls.tsx`).
 *
 * @license BSD-3-Clause
 */

import { adaptBaseStyleProps, defineSection, shownOnInstanceRoot, type AnySectionEntry } from "./_shared";
import { LayoutSection } from "../layout";
import { SizeSection } from "../SizeSection";
import { SpacingSection } from "../SpacingSection";
import { BackgroundSection } from "../BackgroundSection";
import { BorderSection } from "../BorderSection";

const FLEX_KEYS = ["flex-direction", "flex-wrap", "justify-content", "align-items", "align-content"];
const GRID_KEYS = ["grid-template-columns", "grid-template-rows", "grid-auto-flow", "justify-items"];
const GAP_KEYS = ["gap", "row-gap", "column-gap"];
const LAYOUT_KEYS = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "overflow",
  "overflow-x",
  "overflow-y",
  "box-sizing",
  "float",
  "clear",
  "visibility",
  ...FLEX_KEYS,
  ...GRID_KEYS,
  ...GAP_KEYS,
];
const ITEM_KEYS = ["flex-grow", "flex-shrink", "flex-basis", "order", "align-self", "justify-self", "grid-column", "grid-row"];

export const BOX_SECTIONS: Record<string, AnySectionEntry> = {
  layout: defineSection({
    tab: "style",
    title: "Layout",
    open: "always",
    capability: (caps) => caps.layout,
    shouldRender: (ctx) => shownOnInstanceRoot(ctx, LAYOUT_KEYS),
    Component: LayoutSection,
    advancedKey: "layout",
    advancedProps: ["overflow", "overflow-x", "overflow-y", "box-sizing", "float", "clear", "visibility"],
    styleKeys: LAYOUT_KEYS,
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  size: defineSection({
    tab: "style",
    title: "Size",
    open: "always",
    page: true,
    Component: SizeSection,
    advancedKey: "size",
    advancedProps: ["min-width", "max-width", "min-height", "max-height", "flex-shrink", "flex-basis", "order", "align-self", "justify-self"],
    styleKeys: ["width", "height", "min-width", "min-height", "max-width", "max-height", ...ITEM_KEYS],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      elementId: ctx.selectedElement.id,
      variant: ctx.variant,
      parentLayout: ctx.cssContext.isFlexItem ? ("flex" as const) : ctx.cssContext.isGridItem ? ("grid" as const) : null,
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
    styleKeys: ["padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      propertyStates: ctx.propertyStates,
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
      variant: ctx.variant,
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
