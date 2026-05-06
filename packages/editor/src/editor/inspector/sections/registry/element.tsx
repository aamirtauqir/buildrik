/**
 * Element-tab section registry: link, element-properties, css-classes,
 * all-css. Edits the element's identity / addressing rather than its style.
 *
 * @license BSD-3-Clause
 */

import { defineSection, type AnySectionEntry } from "./_shared";
import { AllCSSSection } from "../AllCSSSection";
import { CSSClassesSection } from "../CSSClassesSection";
import { ElementPropertiesSection } from "../elementProperties";
import { LinkSection } from "../LinkSection";

export const ELEMENT_SECTIONS: Record<string, AnySectionEntry> = {
  link: defineSection({
    Component: LinkSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
    }),
    // Only renders for linkable element types. LinkSection has its own
    // isLinkable check too, but gating at the registry level keeps the
    // element tab clean for everything else.
    shouldRender: (ctx) =>
      ["link", "button", "cta"].includes(ctx.selectedElement.type),
  }),

  "element-properties": defineSection({
    Component: ElementPropertiesSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
      onOpenMediaLibrary: ctx.onOpenMediaLibrary,
      onOpenIconPicker: ctx.onOpenIconPicker,
    }),
    // ElementPropertiesSection.getPropertiesForType already returns [] for
    // element types with no properties. But hiding the section header too
    // keeps the element tab from showing a header with no content.
    // For now, let it render — the component returns null internally.
  }),

  "css-classes": defineSection({
    Component: CSSClassesSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
    }),
    // Universal — every element can have classes.
  }),

  "all-css": defineSection({
    Component: AllCSSSection,
    styleKeys: [],
    adaptProps: (ctx) => ({
      selectedElement: ctx.selectedElement,
      composer: ctx.composer ?? null,
      isOpen: ctx.isOpen,
      onToggle: ctx.onToggle,
      tier: ctx.tier,
    }),
    // Dev mode only — gated at the registry level.
    shouldRender: (ctx) => ctx.devMode === true,
  }),
};
