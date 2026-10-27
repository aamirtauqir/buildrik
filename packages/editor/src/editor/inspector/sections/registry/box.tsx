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

import { adaptBaseStyleProps, defineSection, shownOnInstanceRoot, type AnySectionEntry, type ShouldRenderContext } from "./_shared";
import { LayoutAdvancedSection, LayoutSection } from "../layout";
import { SizeSection } from "../SizeSection";
import { FlexItemSection, GridItemSection } from "../layout/ItemControls";
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
  ...FLEX_KEYS,
  ...GRID_KEYS,
  ...GAP_KEYS,
];
const LAYOUT_ADVANCED_KEYS = ["overflow", "overflow-x", "overflow-y", "box-sizing", "float", "clear", "visibility"];
const FLEX_ITEM_KEYS = ["flex-grow", "flex-shrink", "flex-basis", "order", "align-self"];
const GRID_ITEM_KEYS = ["grid-column", "grid-row", "align-self", "justify-self"];

/** "2 set" / "None" — how many of a section's own properties the element
 *  carries here (2L9 161:8940 draws Spacing, Background and Border shut
 *  with this). */
function setSummary(keys: readonly string[]) {
  return (ctx: ShouldRenderContext): string => {
    const n = keys.filter((k) => {
      const v = ctx.authoredStyles[k];
      return v !== undefined && v !== "" && v !== "none" && v !== "0" && v !== "0px";
    }).length;
    return n ? `${n} set` : "None";
  };
}

const SPACING_KEYS = ["padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left"];
const FILL_KEYS = ["background", "background-color", "background-image", "background-size", "background-position", "background-repeat", "background-attachment", "background-blend-mode"];
const BORDER_KEYS = ["border", "border-width", "border-style", "border-color", "border-top", "border-right", "border-bottom", "border-left", "outline-width", "outline-style", "outline-color", "outline-offset", "border-radius", "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"];

export const BOX_SECTIONS: Record<string, AnySectionEntry> = {
  layout: defineSection({
    tab: "style",
    /* 2L9 247:21216, 36:2. */
    title: "Children layout",
    open: "always",
    capability: (caps) => caps.layout,
    shouldRender: (ctx) => shownOnInstanceRoot(ctx, LAYOUT_KEYS),
    Component: LayoutSection,
    advancedKey: "layout",
    advancedProps: ["grid-template-rows", "grid-auto-flow"],
    styleKeys: LAYOUT_KEYS,
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      onBatchChange: ctx.onBatchChange,
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  "layout-advanced": defineSection({
    tab: "style",
    title: "Advanced layout",
    open: "closed",
    summary: setSummary(LAYOUT_ADVANCED_KEYS),
    capability: (caps) => caps.layout,
    shouldRender: (ctx) => shownOnInstanceRoot(ctx, LAYOUT_ADVANCED_KEYS),
    Component: LayoutAdvancedSection,
    styleKeys: LAYOUT_ADVANCED_KEYS,
    adaptProps: adaptBaseStyleProps,
  }),

  size: defineSection({
    tab: "style",
    title: "Size",
    open: "always",
    page: true,
    Component: SizeSection,
    advancedKey: "size",
    advancedProps: ["min-width", "max-width", "min-height", "max-height"],
    styleKeys: ["width", "height", "min-width", "min-height", "max-width", "max-height", "object-fit"],
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      elementId: ctx.selectedElement.id,
      variant: ctx.variant,
      fit: ctx.caps.typeBlock === "image",
      propertyStates: ctx.propertyStates,
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),

  /* 2L9 247:22853: a flex / grid child's own group, while its parent is one. */
  "flex-item": defineSection({
    tab: "style",
    title: "Flex item",
    open: "always",
    shouldRender: (ctx) => ctx.cssContext.isFlexItem,
    Component: FlexItemSection,
    styleKeys: FLEX_ITEM_KEYS,
    adaptProps: adaptBaseStyleProps,
  }),

  "grid-item": defineSection({
    tab: "style",
    title: "Grid item",
    open: "always",
    shouldRender: (ctx) => ctx.cssContext.isGridItem,
    Component: GridItemSection,
    styleKeys: GRID_ITEM_KEYS,
    adaptProps: adaptBaseStyleProps,
  }),

  spacing: defineSection({
    tab: "style",
    title: "Spacing",
    open: "closed",
    summary: setSummary(SPACING_KEYS),
    page: true,
    Component: SpacingSection,
    advancedKey: "spacing",
    styleKeys: SPACING_KEYS,
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
    /* 2L9 161:8940 calls it Background. */
    title: "Background",
    open: "closed",
    summary: setSummary(FILL_KEYS),
    page: true,
    Component: BackgroundSection,
    advancedKey: "fill",
    advancedProps: ["background-position", "background-size", "background-repeat", "background-attachment", "background-blend-mode"],
    styleKeys: FILL_KEYS,
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
    open: "closed",
    summary: setSummary(BORDER_KEYS),
    Component: BorderSection,
    advancedKey: "border",
    /* The outline and split corners show on the face once set (247:24493). */
    advancedProps: ["border-top", "border-right", "border-bottom", "border-left"],
    styleKeys: BORDER_KEYS,
    adaptProps: (ctx) => ({
      ...adaptBaseStyleProps(ctx),
      advancedExpanded: ctx.advancedExpanded,
      onAdvancedToggle: ctx.onAdvancedToggle,
    }),
  }),
};
